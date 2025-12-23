import React from 'react';
import { Wallet } from 'lucide-react';
import './Loading.css';

const Loading = () => {
    return (
        <div className="loading-container">
            <div className="wallet-loader">
                <Wallet size={48} className="wallet-icon" />
                <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
            <p>Loading Wallet...</p>
        </div>
    );
};

export default Loading;
