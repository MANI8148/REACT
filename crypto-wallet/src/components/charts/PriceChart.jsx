import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PriceChart = ({ data, color = "#8B5CF6", height = 300 }) => {
    if (!data || data.length === 0) {
        return <div className="no-data-chart">No chart data available</div>;
    }

    return (
        <div className="price-chart-container" style={{ width: '100%', height: height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorPriceChart" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.5} />
                    <XAxis
                        dataKey="date"
                        hide={true}
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        orientation="right"
                        tick={{ fill: '#94a3b8', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => `$${val.toLocaleString()}`}
                        width={60}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            borderColor: '#334155',
                            color: '#fff',
                            borderRadius: '8px'
                        }}
                        itemStyle={{ color: color }}
                        formatter={(value) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 'Price']}
                        labelStyle={{ color: '#94a3b8', marginBottom: '0.25rem' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke={color}
                        fillOpacity={1}
                        fill="url(#colorPriceChart)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PriceChart;
