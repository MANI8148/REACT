import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, RefreshCw } from 'lucide-react';
import { getCoinsMarkets } from '../../services/cryptoApi';
import BuySellModal from '../../components/wallet/BuySellModal';
import Carousel from '../../components/ui/Carousel/Carousel';
import './Wallet.css';



const Wallet = () => {
    const navigate = useNavigate();
    const [assets, setAssets] = useState([
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', amount: 0.45, value: 0, change: 0, image: '' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', amount: 3.2, value: 0, change: 0, image: '' },
        { id: 'solana', name: 'Solana', symbol: 'SOL', amount: 145, value: 0, change: 0, image: '' },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA', amount: 5000, value: 0, change: 0, image: '' },
    ]);
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'buy', asset: null });

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                // Fetch market data to get real prices
                const marketData = await getCoinsMarkets();

                setAssets(prevAssets => prevAssets.map(asset => {
                    const marketCoin = marketData.find(c => c.id === asset.id);
                    if (marketCoin) {
                        return {
                            ...asset,
                            value: marketCoin.current_price * asset.amount,
                            price: marketCoin.current_price, // Store unit price
                            change: marketCoin.price_change_percentage_24h,
                            image: marketCoin.image
                        };
                    }
                    return asset;
                }));

            } catch (error) {
                console.error("Error updating wallet prices:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();
    }, []);

    const totalBalance = assets.reduce((acc, asset) => acc + (asset.value || 0), 0);

    const openModal = (type, assetId = 'bitcoin') => {
        const asset = assets.find(a => a.id === assetId) || assets[0];
        setModalConfig({ isOpen: true, type, asset });
    };

    const handleTransaction = (amount, type) => {
        setAssets(prev => prev.map(a => {
            if (a.id === modalConfig.asset.id) {
                const newAmount = type === 'buy' ? a.amount + amount : a.amount - amount;
                return {
                    ...a,
                    amount: newAmount,
                    value: newAmount * a.price // Update total value based on new amount
                };
            }
            return a;
        }));
        setModalConfig({ ...modalConfig, isOpen: false });
    };

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
                    <h2 className="amount">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                    <div className="change positive">
                        <ArrowUpRight size={16} />
                        <span>+2.4% (24h)</span>
                    </div>
                </div>
                <div className="actions">
                    <button className="action-btn send">
                        <div className="icon"><ArrowUpRight size={24} /></div>
                        <span>Send</span>
                    </button>
                    <button className="action-btn receive">
                        <div className="icon"><ArrowDownLeft size={24} /></div>
                        <span>Receive</span>
                    </button>
                    <button className="action-btn buy" onClick={() => openModal('buy')}>
                        <div className="icon"><WalletIcon size={24} /></div>
                        <span>Buy</span>
                    </button>
                    <button className="action-btn sell" onClick={() => openModal('sell')}>
                        <div className="icon"><RefreshCw size={24} /></div>
                        <span>Sell</span>
                    </button>
                </div>
            </section>

            <section className="assets-section">
                <div className="section-header">
                    <h3>Your Assets Portfolio</h3>
                </div>

                <div className="assets-carousel-wrapper">
                    <Carousel
                        items={assets.filter(a => a.amount > 0).map(asset => ({
                            id: asset.id,
                            title: asset.name,
                            description: `Available: ${asset.amount} ${asset.symbol}`,
                            icon: <img src={asset.image} alt={asset.name} className="carousel-crypto-icon" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                        }))}
                        baseWidth={350}
                        autoplay={true}
                        loop={true}
                        onItemClick={(item) => navigate(`/coin/${item.id}`)}
                    />
                </div>

                <div className="assets-stagnant-list">
                    {assets
                        .sort((a, b) => b.value - a.value)
                        .map((asset) => (
                            <div key={asset.id} className="asset-row-card" onClick={() => navigate(`/coin/${asset.id}`)}>
                                <div className="asset-row-left">
                                    <img src={asset.image} alt={asset.name} className="asset-row-img" />
                                    <div className="asset-row-info">
                                        <span className="asset-row-name">{asset.name}</span>
                                        <span className="asset-row-symbol">{asset.symbol}</span>
                                    </div>
                                </div>
                                <div className="asset-row-right">
                                    <div className="asset-row-holdings">
                                        <span className="asset-row-amount">{asset.amount.toLocaleString()} {asset.symbol}</span>
                                        <span className="asset-row-value">${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className={`asset-row-change ${asset.change >= 0 ? 'positive' : 'negative'}`}>
                                        {asset.change >= 0 ? '+' : ''}{asset.change?.toFixed(2)}%
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
            </section>

            <BuySellModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                type={modalConfig.type}
                asset={modalConfig.asset}
                currentPrice={modalConfig.asset?.price || 0}
                onConfirm={handleTransaction}
            />
        </div>
    );
};

export default Wallet;

