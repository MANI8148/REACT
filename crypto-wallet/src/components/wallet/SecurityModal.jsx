import React, { useState } from 'react';
import { Lock } from 'lucide-react';

const SecurityModal = ({ isOpen, onClose, onVerify, title = "Enter PIN", description = "Accessing sensitive wallet data requires your PIN" }) => {
    const [pin, setPin] = useState(['', '', '', '']);
    const [error, setError] = useState(false);

    if (!isOpen) return null;

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        const newPin = [...pin];
        newPin[index] = value.slice(-1);
        setPin(newPin);

        // Auto-focus next input
        if (value && index < 3) {
            const nextInput = document.getElementById(`pin-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            const prevInput = document.getElementById(`pin-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleSubmit = () => {
        const enteredPin = pin.join('');
        // Real pin would be stored/hashed, using '1234' for demo
        if (enteredPin === '1234') {
            onVerify();
            setPin(['', '', '', '']);
            setError(false);
        } else {
            setError(true);
            setPin(['', '', '', '']);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content security-modal">
                <div className="modal-header">
                    <Lock size={32} className="lock-icon" />
                    <h2>{title}</h2>
                    <p>{description}</p>
                </div>

                <div className="pin-container">
                    {pin.map((p, i) => (
                        <input
                            key={i}
                            id={`pin-${i}`}
                            type="password"
                            maxLength={1}
                            value={p}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            className={error ? 'error' : ''}
                        />
                    ))}
                </div>

                {error && <p className="error-message">Incorrect PIN. Try again.</p>}

                <div className="modal-actions">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="confirm-btn" onClick={handleSubmit}>Unlock</button>
                </div>
            </div>
            <style jsx>{`
                .security-modal {
                    max-width: 400px !important;
                    text-align: center;
                    padding: 2.5rem !important;
                }
                .lock-icon {
                    color: var(--primary);
                    margin-bottom: 1rem;
                }
                .pin-container {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    margin: 2rem 0;
                }
                .pin-container input {
                    width: 50px;
                    height: 60px;
                    text-align: center;
                    font-size: 1.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: white;
                }
                .pin-container input:focus {
                    border-color: var(--primary);
                    outline: none;
                }
                .pin-container input.error {
                    border-color: #ef4444;
                }
                .error-message {
                    color: #ef4444;
                    font-size: 0.9rem;
                    margin-bottom: 1rem;
                }
            `}</style>
        </div>
    );
};

export default SecurityModal;
