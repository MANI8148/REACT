import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, RefreshCw, Smartphone, ShieldCheck, Lock } from 'lucide-react';
import { getCoinsMarkets } from '../../services/cryptoApi';
import BuySellModal from '../../components/wallet/BuySellModal';
import SecurityModal from '../../components/wallet/SecurityModal';
import Carousel from '../../components/ui/Carousel/Carousel';
import './Wallet.css';



const Wallet = () => {
    const navigate = useNavigate();
    const FALLBACK_IMAGE = 'https://cryptologos.cc/logos/bitcoin-btc-logo.png';

    const [assets, setAssets] = useState([
        { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', amount: 0.45, value: 0, change: 0, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
        { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', amount: 3.2, value: 0, change: 0, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
        { id: 'solana', name: 'Solana', symbol: 'SOL', amount: 145, value: 0, change: 0, image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png' },
        { id: 'cardano', name: 'Cardano', symbol: 'ADA', amount: 5000, value: 0, change: 0, image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png' },
    ]);
    const [offlineAssets, setOfflineAssets] = useState([
        { id: 'bitcoin', name: 'Cold BTC', symbol: 'BTC', amount: 1.2, value: 0, change: 0, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
        { id: 'ethereum', name: 'Cold ETH', symbol: 'ETH', amount: 10, value: 0, change: 0, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
    ]);
    const [isOffline, setIsOffline] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
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

                // Also update offline assets prices if available
                setOfflineAssets(prev => prev.map(asset => {
                    const marketCoin = marketData.find(c => c.id === asset.id);
                    if (marketCoin) {
                        return {
                            ...asset,
                            value: marketCoin.current_price * asset.amount,
                            price: marketCoin.current_price,
                            change: marketCoin.price_change_percentage_24h,
                            image: marketCoin.image || asset.image
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

    const currentAssets = isOffline ? offlineAssets : assets;
    const totalBalance = currentAssets.reduce((acc, asset) => acc + (asset.value || 0), 0);

    const toggleMode = () => {
        if (!isOffline) {
            // Trying to enter offline mode (cold wallet)
            setShowSecurityModal(true);
        } else {
            // Going back to online
            setIsOffline(false);
        }
    };

    const handleUnlock = () => {
        setIsOffline(true);
        setShowSecurityModal(false);
    };

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
                <div className="header-title">
                    <h1>My Wallet</h1>
                    <div className={`wallet-status-badge ${isOffline ? 'offline' : 'online'}`}>
                        {isOffline ? <ShieldCheck size={14} /> : <Smartphone size={14} />}
                        <span>{isOffline ? 'Cold Storage' : 'Hot Wallet'}</span>
                    </div>
                </div>
                <div className="header-right">
                    <button className={`mode-toggle-btn ${isOffline ? 'to-online' : 'to-offline'}`} onClick={toggleMode}>
                        {isOffline ? <Smartphone size={18} /> : <Lock size={18} />}
                        <span>{isOffline ? 'Online Mode' : 'Cold Storage'}</span>
                    </button>
                    <div className="user-profile">
                        <span className="user-initials">MP</span>
                    </div>
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
                        items={currentAssets.filter(a => a.amount > 0).map(asset => ({
                            id: asset.id,
                            title: asset.name,
                            description: `Available: ${asset.amount} ${asset.symbol}`,
                            icon: <img src={asset.image || FALLBACK_IMAGE} alt={asset.name} className="carousel-crypto-icon" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                        }))}
                        baseWidth={350}
                        autoplay={!isOffline}
                        loop={true}
                        round={false}
                        onItemClick={(item) => navigate(`/coin/${item.id}`)}
                    />
                </div>

                <div className="assets-stagnant-list">
                    {currentAssets
                        .sort((a, b) => b.value - a.value)
                        .map((asset) => (
                            <div key={asset.id} className="asset-row-card" onClick={() => navigate(`/coin/${asset.id}`)}>
                                <div className="asset-row-left">
                                    <img src={asset.image || FALLBACK_IMAGE} alt={asset.name} className="asset-row-img" />
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

            <SecurityModal
                isOpen={showSecurityModal}
                onClose={() => setShowSecurityModal(false)}
                onVerify={handleUnlock}
                title="Cold Storage Access"
                description="Please enter your 4-digit PIN to access your offline cold wallet."
            />
        </div>
    );
};

export default Wallet;

