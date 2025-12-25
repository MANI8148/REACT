import React from 'react';
import { AlertTriangle, Info, ShieldCheck, Zap } from 'lucide-react';

const TransactionSimulator = ({ tx, onApprove, onCancel }) => {
    // Only show contract warnings for send transactions
    const isUnknownContract = tx.type === 'send' && tx.targetAddress?.startsWith('0x3c');
    const isHighGas = tx.gasPrice > 50;

    // For buy/sell, show simple balance impact
    const isBuyOrSell = tx.type === 'buy' || tx.type === 'sell';

    return (
        <div className="simulation-container">
            <div className="simulation-header">
                <h3>Transaction Review</h3>
                <p>Review the details of this transaction.</p>
            </div>

            <div className="simulation-summary">
                <div className="summary-item">
                    <span className="label">Action</span>
                    <span className="value">{tx.type.toUpperCase()}</span>
                </div>
                <div className="summary-item">
                    <span className="label">Amount</span>
                    <span className="value">{tx.amount} {tx.symbol}</span>
                </div>
                <div className="summary-item">
                    <span className="label">{tx.type === 'buy' ? 'Total Cost' : 'You Receive'}</span>
                    <span className="value">${tx.costUsd || '0.00'}</span>
                </div>
                {tx.type === 'buy' && (
                    <div className="summary-item">
                        <span className="label">Balance Impact</span>
                        <span className="value negative">-${tx.costUsd || '0.00'} USD</span>
                    </div>
                )}
                {tx.type === 'sell' && (
                    <div className="summary-item">
                        <span className="label">Balance Impact</span>
                        <span className="value positive">+${tx.costUsd || '0.00'} USD</span>
                    </div>
                )}
            </div>

            {!isBuyOrSell && (
                <div className="risk-analysis">
                    {isUnknownContract && (
                        <div className="risk-item warning">
                            <AlertTriangle size={20} />
                            <div>
                                <strong>Unknown Address</strong>
                                <p>This address has no reputation. Proceed with caution.</p>
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
                    {!isUnknownContract && (
                        <div className="risk-item safe">
                            <ShieldCheck size={20} />
                            <div>
                                <strong>Safe to Proceed</strong>
                                <p>No major risks detected.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {isBuyOrSell && (
                <div className="risk-analysis">
                    <div className="risk-item safe">
                        <ShieldCheck size={20} />
                        <div>
                            <strong>Transaction Ready</strong>
                            <p>Review the details above and confirm to proceed.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="simulation-actions">
                <button className="cancel-btn" onClick={onCancel}>Cancel</button>
                <button className="approve-btn" onClick={onApprove}>Confirm Transaction</button>
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
                .summary-item .value.positive {
                    color: #10b981;
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
