import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import './WalletForm.css';

const WalletForm = ({ onAddAsset }) => {
    const [coinId, setCoinId] = useState('bitcoin');
    const [amount, setAmount] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount) return;

        // In a real app, we'd fetch the coin details. 
        // Here we just pass the basic info up.
        onAddAsset({
            id: coinId,
            amount: parseFloat(amount)
        });
        setAmount('');
    };

    return (
        <form className="wallet-form" onSubmit={handleSubmit}>
            <h3>Add Asset</h3>
            <div className="form-row">
                <div className="input-group">
                    <label>Coin</label>
                    <select value={coinId} onChange={(e) => setCoinId(e.target.value)}>
                        <option value="bitcoin">Bitcoin (BTC)</option>
                        <option value="ethereum">Ethereum (ETH)</option>
                        <option value="solana">Solana (SOL)</option>
                        <option value="cardano">Cardano (ADA)</option>
                        <option value="ripple">XRP (XRP)</option>
                        <option value="dogecoin">Dogecoin (DOGE)</option>
                    </select>
                </div>
                <div className="input-group">
                    <label>Amount</label>
                    <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </div>
                <button type="submit" className="add-btn">
                    <Plus size={20} />
                </button>
            </div>
        </form>
    );
};

export default WalletForm;
