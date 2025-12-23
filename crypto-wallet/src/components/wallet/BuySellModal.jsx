import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Wallet, ShieldCheck, Lock } from 'lucide-react';
import TransactionSimulator from './TransactionSimulator';
import './BuySellModal.css';

const BuySellModal = ({ isOpen, onClose, type, asset, onConfirm, currentPrice }) => {
    const [amount, setAmount] = useState('');
    const [estimatedValue, setEstimatedValue] = useState(0);
    const [showSimulation, setShowSimulation] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setEstimatedValue(0);
            setShowSimulation(false);
            setPassword('');
            setError('');
        }
    }, [isOpen]);

    const handleAmountChange = (e) => {
        const val = e.target.value;
        setAmount(val);
        setEstimatedValue(parseFloat(val || 0) * currentPrice);
    };

    if (!isOpen) return null;

    // Simplified list of coins for the dropdown - in a real app this comes from API/Context
    const availableCoins = [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
        { id: 'solana', name: 'Solana', symbol: 'SOL' },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
        { id: 'ripple', name: 'XRP', symbol: 'XRP' },
        { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
    ];

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="modal-header">
                    <div className={`icon-circle ${type}`}>
                        <Wallet size={24} />
                    </div>
                    <h2>{type === 'buy' ? 'Buy Asset' : 'Sell Asset'}</h2>
                </div>

                <div className="form-group">
                    <label>Select Asset</label>
                    <select
                        className="asset-select"
                        value={asset?.id || 'bitcoin'}
                        onChange={(e) => {
                            // This is a simplified handling where we just log or would ideally call a parent handler
                            console.log("Selected asset:", e.target.value);
                        }}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '16px',
                            outline: 'none',
                            marginBottom: '1rem'
                        }}
                    >
                        {availableCoins.map(coin => (
                            <option key={coin.id} value={coin.id}>
                                {coin.name} ({coin.symbol})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="asset-preview">
                    <div className={`coin-icon ${asset?.symbol?.toLowerCase()}`}>{asset?.symbol?.[0]}</div>
                    <div className="asset-info">
                        <h3>{asset?.name}</h3>
                        <span>Current Price: ${currentPrice.toLocaleString()}</span>
                    </div>
                </div>

                <div className="form-group">
                    <label>Amount ({asset?.symbol})</label>
                    <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={handleAmountChange}
                        min="0"
                    />
                </div>

                <div className="summary-row">
                    <span>Estimated Value</span>
                    <span className="value">${estimatedValue.toLocaleString()}</span>
                </div>

                {!showSimulation ? (
                    <button
                        className={`confirm-btn ${type}`}
                        onClick={() => setShowSimulation(true)}
                        disabled={!amount || parseFloat(amount) <= 0}
                    >
                        {type === 'buy' ? 'Review Purchase' : 'Review Sale'} <ArrowRight size={16} />
                    </button>
                ) : (
                    <div className="security-layer">
                        <TransactionSimulator
                            tx={{
                                type,
                                amount: parseFloat(amount),
                                symbol: asset?.symbol,
                                costUsd: estimatedValue.toFixed(2),
                                targetAddress: '0x3c...8f2a', // Mock
                                gasPrice: 25 // Mock
                            }}
                            onApprove={() => {
                                if (password === '1234') { // Using PIN for demo
                                    onConfirm(parseFloat(amount), type);
                                    onClose();
                                } else {
                                    setError('Invalid PIN for signing');
                                }
                            }}
                            onCancel={() => setShowSimulation(false)}
                        />

                        <div className="signing-field">
                            <label><Lock size={14} /> Confirm PIN to Sign</label>
                            <input
                                type="password"
                                placeholder="Enter 4-digit PIN"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={error ? 'error' : ''}
                            />
                            {error && <p className="error-text">{error}</p>}
                        </div>
                    </div>
                )}
            </div>
            <style jsx>{`
                .security-layer {
                    margin-top: 1rem;
                }
                .signing-field {
                    margin-top: 1rem;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 1rem;
                    border-radius: 12px;
                }
                .signing-field label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                }
                .signing-field input {
                    width: 100%;
                    padding: 10px;
                    background: rgba(0, 0, 0, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    color: white;
                    text-align: center;
                    letter-spacing: 4px;
                }
                .signing-field input.error {
                    border-color: #ef4444;
                }
                .error-text {
                    color: #ef4444;
                    font-size: 0.8rem;
                    margin-top: 4px;
                    text-align: center;
                }
            `}</style>
        </div>
    );
};

export default BuySellModal;
