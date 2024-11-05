import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Define types for TypeScript
interface PriceData {
    date: string;
    close: number;
}

interface Trade {
    date: string;
    type: 'BUY' | 'SELL';
    price: number;
    amount: number;
}

// Moving Average Calculation
const calculateSMA = (data: number[], window: number) => {
    return data.map((_, i) =>
        i >= window - 1
            ? data.slice(i - window + 1, i + 1).reduce((sum, val) => sum + val, 0) / window
            : null
    );
};

// Main Component
const TradingBot: React.FC = () => {
    const [priceData, setPriceData] = useState<PriceData[]>([]);
    const [shortSMA, setShortSMA] = useState<(number | null)[]>([]);
    const [longSMA, setLongSMA] = useState<(number | null)[]>([]);
    const [trades, setTrades] = useState<Trade[]>([]);
    const [capital, setCapital] = useState(5);  // Initial capital for simulation
    const [position, setPosition] = useState(0);   // BTC holdings

    const shortWindow = 10;
    const longWindow = 30;

    // Fetch synthetic historical data for simulation
    useEffect(() => {
        const fetchData = async () => {
            const data: PriceData[] = Array.from({ length: 365 }, (_, i) => ({
                date: new Date(2023, 0, i + 1).toISOString().split('T')[0],
                close: 5000 + i * 2 + Math.random() * 50,
            }));
            setPriceData(data);

            // Calculate moving averages
            const closes = data.map(d => d.close);
            setShortSMA(calculateSMA(closes, shortWindow));
            setLongSMA(calculateSMA(closes, longWindow));
        };
        fetchData();
    }, []);

    // Simulate Trading on SMA Crossover
    useEffect(() => {
        if (priceData.length && shortSMA.length && longSMA.length) {
            const newTrades: Trade[] = [];
            let tempCapital = capital;
            let tempPosition = position;

            priceData.forEach((price, i) => {
                const short = shortSMA[i];
                const long = longSMA[i];

                if (i > 0 && shortSMA[i - 1] && longSMA[i - 1]) {
                    if (shortSMA[i - 1]! < longSMA[i - 1]! && short! > long!) {
                        // Buy Signal
                        const btcToBuy = (tempCapital * 0.1) / price.close;
                        tempCapital -= btcToBuy * price.close;
                        tempPosition += btcToBuy;
                        newTrades.push({ date: price.date, type: 'BUY', price: price.close, amount: btcToBuy });
                    } else if (shortSMA[i - 1]! > longSMA[i - 1]! && short! < long!) {
                        // Sell Signal
                        tempCapital += tempPosition * price.close;
                        newTrades.push({ date: price.date, type: 'SELL', price: price.close, amount: tempPosition });
                        tempPosition = 0;
                    }
                }
            });

            setTrades(newTrades);
            setCapital(tempCapital);
            setPosition(tempPosition);
        }
    }, [priceData, shortSMA, longSMA]);

    // Button Handlers
    const increaseCapital = () => setCapital(prevCapital => prevCapital + 100);  // Increase capital by $100
    const decreaseCapital = () => setCapital(prevCapital => Math.max(0, prevCapital - 100));  // Decrease capital by $100, with a minimum of 0

    // Prepare data for Chart.js
    const chartData = {
        labels: priceData.map(d => d.date),
        datasets: [
            {
                label: 'Price',
                data: priceData.map(d => d.close),
                borderColor: 'blue',
                fill: false,
            },
            {
                label: `SMA ${shortWindow}`,
                data: shortSMA,
                borderColor: 'white',
                fill: false,
            },
            {
                label: `SMA ${longWindow}`,
                data: longSMA,
                borderColor: 'purple',
                fill: false,
            },
            ...trades.map(trade => ({
                label: trade.type,
                data: priceData.map((_, i) => (priceData[i].date === trade.date ? trade.price : null)),
                pointBackgroundColor: trade.type === 'BUY' ? 'green' : 'red',
                borderColor: 'transparent',
                pointRadius: 5,
                showLine: false,
            })),
        ],
    };

    return (
        <div style={{ width: '80%', margin: 'auto' }}>
            <h2>Simulated Trading Bot (SMA Crossover Strategy)</h2>
            <button onClick={increaseCapital}>Increase Capital by $100</button>
            <button onClick={decreaseCapital}>Decrease Capital by $100</button>
            <Line data={chartData} />
            <h3>Final Portfolio Value: ${(capital + position * priceData[priceData.length - 1]?.close).toFixed(2)}</h3>
            <h3>Total Profit/Loss: ${(capital + position * priceData[priceData.length - 1]?.close - 1000).toFixed(2)}</h3>
            <h3>Trade Log:</h3>
            <ul>
                {trades.map((trade, index) => (
                    <li key={index}>
                        {trade.date}: {trade.type} {trade.amount.toFixed(4)} BTC at ${trade.price.toFixed(2)}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TradingBot;
