import React from 'react';
import { X, Copy, Check, QrCode } from 'lucide-react';
import './BuySellModal.css';

const ReceiveModal = ({ isOpen, onClose, asset, onConfirm }) => {
    const [copied, setCopied] = React.useState(false);
    const mockAddress = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(mockAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content receive-modal">
                <button className="close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                <div className="modal-header">
                    <div className="icon-circle sell">
                        <QrCode size={24} />
                    </div>
                    <h2>Receive {asset?.name}</h2>
                    <p>Scan the QR code or copy the address below</p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <button
                        onClick={() => onConfirm(0.1, 'receive', asset.id)}
                        className="confirm-btn buy"
                        style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                    >
                        Simulate Arrival of 0.1 {asset?.symbol}
                    </button>
                </div>

                <div className="qr-container">
                    <div className="qr-placeholder">
                        <QrCode size={180} strokeWidth={1} />
                        <div className="qr-overlay-logo">
                            {asset?.symbol?.[0]}
                        </div>
                    </div>
                </div>

                <div className="address-container">
                    <label>Your {asset?.symbol} Address</label>
                    <div className="address-box" onClick={handleCopy}>
                        <span className="address-text">{mockAddress}</span>
                        <button className="copy-btn">
                            {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
                        </button>
                    </div>
                </div>

                <div className="receive-warning">
                    <p>Only send <strong>{asset?.name} ({asset?.symbol})</strong> to this address. Sending any other coin may result in permanent loss.</p>
                </div>
            </div>
            <style jsx>{`
                .receive-modal {
                    text-align: center;
                }
                .qr-container {
                    display: flex;
                    justify-content: center;
                    margin: 2rem 0;
                }
                .qr-placeholder {
                    background: white;
                    padding: 1.5rem;
                    border-radius: 20px;
                    position: relative;
                    color: #0f172a;
                }
                .qr-overlay-logo {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: #0f172a;
                    color: white;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    border: 4px solid white;
                }
                .address-container {
                    text-align: left;
                    margin-bottom: 1.5rem;
                }
                .address-container label {
                    display: block;
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin-bottom: 8px;
                }
                .address-box {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 12px 16px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .address-box:hover {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: var(--primary);
                }
                .address-text {
                    font-family: monospace;
                    font-size: 0.9rem;
                    color: white;
                    word-break: break-all;
                    margin-right: 10px;
                }
                .copy-btn {
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    padding: 4px;
                }
                .receive-warning {
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px solid rgba(245, 158, 11, 0.2);
                    padding: 1rem;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    color: #f59e0b;
                    line-height: 1.4;
                }
            `}</style>
        </div>
    );
};

export default ReceiveModal;
