import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Wallet, ShieldCheck, Lock, Search } from 'lucide-react';
import TransactionSimulator from './TransactionSimulator';
import './BuySellModal.css';

const BuySellModal = ({ isOpen, onClose, type, asset, onConfirm, currentPrice, availableAssets = [], onAssetChange }) => {
    const [amount, setAmount] = useState('');
    const [estimatedValue, setEstimatedValue] = useState(0);
    const [showSimulation, setShowSimulation] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setEstimatedValue(0);
            setShowSimulation(false);
            setPassword('');
            setError('');
            setSearchQuery('');
        }
    }, [isOpen]);

    const handleAmountChange = (e) => {
        const val = e.target.value;
        setAmount(val);
        setEstimatedValue(parseFloat(val || 0) * currentPrice);
    };

    if (!isOpen) return null;

    const assetsToDisplay = availableAssets.length > 0 ? availableAssets : [
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', current_price: 60000 },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', current_price: 3000 },
        { id: 'solana', name: 'Solana', symbol: 'SOL', current_price: 150 },
    ];

    // Filter assets based on search query (only for buy)
    const filteredAssets = type === 'buy' && searchQuery
        ? assetsToDisplay.filter(coin =>
            coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : assetsToDisplay;

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

                {type === 'buy' && (
                    <div className="form-group">
                        <label>Search Assets</label>
                        <div className="search-input-wrapper">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by name or symbol..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>
                )}

                <div className="form-group">
                    <label>Select Asset</label>
                    <select
                        className="asset-select"
                        value={asset?.id || ''}
                        onChange={(e) => {
                            const selected = assetsToDisplay.find(a => a.id === e.target.value);
                            if (selected && onAssetChange) {
                                onAssetChange(selected);
                                setSearchQuery(''); // Clear search after selection
                            }
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
                        {filteredAssets.map(coin => (
                            <option key={coin.id} value={coin.id}>
                                {coin.name} ({coin.symbol})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="asset-preview">
                    {asset?.image ? (
                        <img src={asset.image} alt={asset.name} style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px' }} />
                    ) : (
                        <div className={`coin-icon ${asset?.symbol?.toLowerCase()}`}>{asset?.symbol?.[0]}</div>
                    )}
                    <div className="asset-info">
                        <h3>{asset?.name}</h3>
                        <span>Current Price: ${currentPrice.toLocaleString()}</span>
                    </div>
                </div>

                <div className="form-group">
                    <label>Amount ({asset?.symbol})</label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Available: {asset?.amount || 0} {asset?.symbol}
                        </span>
                        {type === 'sell' && (
                            <button
                                onClick={() => handleAmountChange({ target: { value: asset?.amount || 0 } })}
                                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer' }}
                            >
                                Max
                            </button>
                        )}
                    </div>
                    <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={handleAmountChange}
                        min="0"
                        max={type === 'sell' ? asset?.amount : undefined}
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
