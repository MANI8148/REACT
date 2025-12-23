import React from 'react';
import { AlertTriangle, Info, ShieldCheck, Zap } from 'lucide-react';

const TransactionSimulator = ({ tx, onApprove, onCancel }) => {
    // Simulated risk analysis
    const isUnknownContract = tx.targetAddress?.startsWith('0x3c'); // Mock check
    const isHighGas = tx.gasPrice > 50; // Mock check
    const isUnlimitedApproval = tx.type === 'approval' && tx.amount === 'unlimited';

    return (
        <div className="simulation-container">
            <div className="simulation-header">
                <h3>Transaction Simulation</h3>
                <p>Review the predicted outcome of this transaction.</p>
            </div>

            <div className="simulation-summary">
                <div className="summary-item">
                    <span className="label">Action</span>
                    <span className="value">{tx.type.toUpperCase()}</span>
                </div>
                <div className="summary-item">
                    <span className="label">Estimated Cost</span>
                    <span className="value">${tx.costUsd || '0.00'}</span>
                </div>
                <div className="summary-item">
                    <span className="label">Network Impact</span>
                    <span className="value negative">-{tx.amount} {tx.symbol}</span>
                </div>
            </div>

            <div className="risk-analysis">
                {isUnlimitedApproval && (
                    <div className="risk-item critical">
                        <AlertTriangle size={20} />
                        <div>
                            <strong>Unlimited Approval</strong>
                            <p>This allow the contract to spend ALL your {tx.symbol}.</p>
                        </div>
                    </div>
                )}
                {isUnknownContract && (
                    <div className="risk-item warning">
                        <AlertTriangle size={20} />
                        <div>
                            <strong>Unknown Contract</strong>
                            <p>This address has no reputation. Proceed with extreme caution.</p>
                        </div>
                    </div>
                )}
                {isHighGas && (
                    <div className="risk-item info">
                        <Zap size={20} />
                        <div>
                            <strong>High Gas Fee</strong>
                            <p>Network is congested. You might want to wait.</p>
                        </div>
                    </div>
                )}
                {!isUnlimitedApproval && !isUnknownContract && (
                    <div className="risk-item safe">
                        <ShieldCheck size={20} />
                        <div>
                            <strong>Safe to Proceed</strong>
                            <p>No major risks detected in this simulation.</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="simulation-actions">
                <button className="cancel-btn" onClick={onCancel}>Decline</button>
                <button className="approve-btn" onClick={onApprove}>Authorize Transaction</button>
            </div>

            <style jsx>{`
                .simulation-container {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin: 1rem 0;
                }
                .simulation-header h3 {
                    margin: 0;
                    color: white;
                }
                .simulation-header p {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin: 4px 0 1rem 0;
                }
                .simulation-summary {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 1.5rem;
                    background: rgba(0, 0, 0, 0.2);
                    padding: 1rem;
                    border-radius: 12px;
                }
                .summary-item {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.9rem;
                }
                .summary-item .label {
                    color: var(--text-secondary);
                }
                .summary-item .value.negative {
                    color: #ef4444;
                    font-weight: 600;
                }
                .risk-analysis {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 1.5rem;
                }
                .risk-item {
                    display: flex;
                    gap: 12px;
                    padding: 12px;
                    border-radius: 12px;
                    font-size: 0.85rem;
                }
                .risk-item strong {
                    display: block;
                    margin-bottom: 2px;
                }
                .risk-item p {
                    margin: 0;
                    opacity: 0.8;
                }
                .risk-item.critical {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }
                .risk-item.warning {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                    border: 1px solid rgba(245, 158, 11, 0.2);
                }
                .risk-item.info {
                    background: rgba(59, 130, 246, 0.1);
                    color: #3b82f6;
                    border: 1px solid rgba(59, 130, 246, 0.2);
                }
                .risk-item.safe {
                    background: rgba(16, 185, 129, 0.1);
                    color: #10b981;
                    border: 1px solid rgba(16, 185, 129, 0.2);
                }
                .simulation-actions {
                    display: flex;
                    gap: 12px;
                }
                .simulation-actions button {
                    flex: 1;
                    padding: 12px;
                    border-radius: 10px;
                    font-weight: 600;
                    cursor: pointer;
                }
                .cancel-btn {
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .approve-btn {
                    background: var(--primary);
                    color: white;
                }
            `}</style>
        </div>
    );
};

export default TransactionSimulator;
