import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { getCoinDetail, getMarketChart } from '../../services/cryptoApi';
import './CoinDetails.css';

const CoinDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [coin, setCoin] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [days, setDays] = useState(7); // Default to 7 days

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [coinData, marketChart] = await Promise.all([
                    getCoinDetail(id),
                    getMarketChart(id, days)
                ]);

                setCoin(coinData);

                // Format chart data: [timestamp, price] -> { date, price }
                const formattedChartData = marketChart.prices.map(item => ({
                    date: new Date(item[0]).toLocaleDateString(),
                    price: item[1]
                }));
                setChartData(formattedChartData);
            } catch (error) {
                console.error("Error fetching coin details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, days]);

    if (loading) return <div className="loading-state">Loading coin details...</div>;
    if (!coin) return <div className="error-state">Coin not found</div>;

    const isPositive = coin.market_data.price_change_percentage_24h >= 0;

    return (
        <div className="coin-details-page">
            <button className="back-btn" onClick={() => navigate(-1)}>
                <ArrowLeft size={20} />
                Back
            </button>

            <header className="coin-header">
                <div className="coin-identity">
                    <img src={coin.image?.large || 'https://cryptologos.cc/logos/bitcoin-btc-logo.png'} alt={coin.name} />
                    <div>
                        <h1>{coin.name} <span className="symbol">({coin.symbol.toUpperCase()})</span></h1>
                        <span className="rank">Rank #{coin.market_cap_rank}</span>
                    </div>
                </div>
                <div className="coin-price-block">
                    <h2>${coin.market_data.current_price.usd.toLocaleString()}</h2>
                    <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
                        {isPositive ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                        {coin.market_data.price_change_percentage_24h.toFixed(2)}%
                    </div>
                </div>
            </header>

            <div className="time-filters">
                {[1, 7, 30, 365].map((d) => (
                    <button
                        key={d}
                        className={`filter-btn ${days === d ? 'active' : ''}`}
                        onClick={() => setDays(d)}
                    >
                        {d === 1 ? '24h' : d === 365 ? '1y' : `${d}d`}
                    </button>
                ))}
            </div>

            <section className="chart-section">
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={400}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2d2d3f" />
                            <XAxis
                                dataKey="date"
                                hide={true} // Hide X axis labels for cleaner look or customize
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                orientation="right"
                                tick={{ fill: '#A1A1AA' }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `$${val.toLocaleString()}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1E1E2E', borderColor: '#2D2D3F', color: '#fff' }}
                                itemStyle={{ color: '#8B5CF6' }}
                                formatter={(value) => [`$${value.toLocaleString()}`, 'Price']}
                                labelStyle={{ color: '#A1A1AA' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="price"
                                stroke="#8B5CF6"
                                fillOpacity={1}
                                fill="url(#colorPrice)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <section className="stats-grid">
                <div className="stat-card">
                    <span className="label">Market Cap</span>
                    <span className="value">${coin.market_data.market_cap.usd.toLocaleString()}</span>
                </div>
                <div className="stat-card">
                    <span className="label">24h Volume</span>
                    <span className="value">${coin.market_data.total_volume.usd.toLocaleString()}</span>
                </div>
                <div className="stat-card">
                    <span className="label">High 24h</span>
                    <span className="value">${coin.market_data.high_24h.usd.toLocaleString()}</span>
                </div>
                <div className="stat-card">
                    <span className="label">Low 24h</span>
                    <span className="value">${coin.market_data.low_24h.usd.toLocaleString()}</span>
                </div>
            </section>

            <div className="description-section">
                <h3>About {coin.name}</h3>
                <p dangerouslySetInnerHTML={{ __html: coin.description.en.split('. ')[0] + '.' }}></p>
            </div>
        </div>
    );
};

export default CoinDetails;
