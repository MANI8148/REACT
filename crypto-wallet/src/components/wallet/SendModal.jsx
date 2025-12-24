import React, { useState, useEffect } from 'react';
import { X, Send, ArrowRight, Lock, User } from 'lucide-react';
import TransactionSimulator from './TransactionSimulator';
import './BuySellModal.css'; // Reusing styles for consistency

const SendModal = ({ isOpen, onClose, asset, onConfirm, availableAssets = [] }) => {
    const [amount, setAmount] = useState('');
    const [address, setAddress] = useState('');
    const [showSimulation, setShowSimulation] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setAddress('');
            setShowSimulation(false);
            setPassword('');
            setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const assetsToDisplay = availableAssets.length > 0 ? availableAssets : [asset];

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="modal-header">
                    <div className="icon-circle buy">
                        <Send size={24} />
                    </div>
                    <h2>Send Crypto</h2>
                </div>

                <div className="form-group">
                    <label>Select Asset</label>
                    <select
                        className="asset-select"
                        value={asset?.id || 'bitcoin'}
                        disabled
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '16px',
                            outline: 'none',
                            marginBottom: '1rem',
                            opacity: 0.7
                        }}
                    >
                        <option value={asset?.id}>{asset?.name} ({asset?.symbol})</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Recipient Address</label>
                    <div className="input-with-icon">
                        <User size={16} className="input-icon" />
                        <input
                            type="text"
                            placeholder="Enter 0x address or ENS"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            style={{ paddingLeft: '40px' }}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Amount ({asset?.symbol})</label>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Available: {asset?.amount || 0} {asset?.symbol}
                        </span>
                        <button
                            onClick={() => setAmount(asset?.amount || 0)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                            Max
                        </button>
                    </div>
                    <input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        max={asset?.amount}
                    />
                </div>

                {!showSimulation ? (
                    <button
                        className="confirm-btn buy"
                        onClick={() => setShowSimulation(true)}
                        disabled={!amount || parseFloat(amount) <= 0 || !address}
                    >
                        Review Transaction <ArrowRight size={16} />
                    </button>
                ) : (
                    <div className="security-layer">
                        <TransactionSimulator
                            tx={{
                                type: 'send',
                                amount: parseFloat(amount),
                                symbol: asset?.symbol,
                                targetAddress: address,
                                gasPrice: 20
                            }}
                            onApprove={() => {
                                if (password === '1234') {
                                    onConfirm(parseFloat(amount), 'send', asset.id);
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
                .input-with-icon {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .input-icon {
                    position: absolute;
                    left: 14px;
                    color: var(--text-secondary);
                }
                .security-layer { margin-top: 1rem; }
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
                .signing-field input.error { border-color: #ef4444; }
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

export default SendModal;
