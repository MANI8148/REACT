import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon } from 'lucide-react';
import './Wallet.css';

const Wallet = () => {
    // Mock data for assets
    const assets = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', amount: 0.45, value: 29500, change: 2.5 },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', amount: 3.2, value: 5800, change: -1.2 },
        { id: 'solana', name: 'Solana', symbol: 'SOL', amount: 145, value: 3200, change: 5.8 },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA', amount: 5000, value: 1500, change: 0.5 },
    ];

    const totalBalance = assets.reduce((acc, asset) => acc + asset.value, 0);

    return (
        <div className="wallet-page">
            <header className="page-header">
                <h1>My Wallet</h1>
                <div className="user-profile">
                    <span className="user-initials">MP</span>
                </div>
            </header>

            <section className="balance-card">
                <div className="balance-info">
                    <span className="label">Total Balance</span>
                    <h2 className="amount">${totalBalance.toLocaleString()}</h2>
                    <div className="change positive">
                        <ArrowUpRight size={16} />
                        <span>+2.4% (24h)</span>
                    </div>
                </div>
                <div className="actions">
                    <button className="action-btn send">
                        <div className="icon">
                            <ArrowUpRight size={24} />
                        </div>
                        <span>Send</span>
                    </button>
                    <button className="action-btn receive">
                        <div className="icon">
                            <ArrowDownLeft size={24} />
                        </div>
                        <span>Receive</span>
                    </button>
                    <button className="action-btn buy">
                        <div className="icon">
                            <WalletIcon size={24} />
                        </div>
                        <span>Buy</span>
                    </button>
                </div>
            </section>

            <section className="assets-section">
                <h3>Your Assets</h3>
                <div className="assets-list">
                    {assets.map(asset => (
                        <div key={asset.id} className="asset-item">
                            <div className="asset-info">
                                <div className={`asset-icon ${asset.symbol.toLowerCase()}`}>
                                    {asset.symbol[0]}
                                </div>
                                <div className="asset-details">
                                    <span className="asset-name">{asset.name}</span>
                                    <span className="asset-amount">{asset.amount} {asset.symbol}</span>
                                </div>
                            </div>
                            <div className="asset-value">
                                <span className="value-usd">${asset.value.toLocaleString()}</span>
                                <span className={`change-pill ${asset.change >= 0 ? 'positive' : 'negative'}`}>
                                    {asset.change >= 0 ? '+' : ''}{asset.change}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Wallet;
