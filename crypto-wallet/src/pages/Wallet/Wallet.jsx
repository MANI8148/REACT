import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, RefreshCw, Smartphone, ShieldCheck, Lock } from 'lucide-react';
import { getCoinsMarkets } from '../../services/cryptoApi';
import BuySellModal from '../../components/wallet/BuySellModal';
import SecurityModal from '../../components/wallet/SecurityModal';
import SendModal from '../../components/wallet/SendModal';
import ReceiveModal from '../../components/wallet/ReceiveModal';
import Carousel from '../../components/ui/Carousel/Carousel';
import './Wallet.css';



const Wallet = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const FALLBACK_IMAGE = 'https://cryptologos.cc/logos/bitcoin-btc-logo.png';

    const [assets, setAssets] = useState([]);
    const [offlineAssets, setOfflineAssets] = useState([
        { id: 'bitcoin', name: 'Cold BTC', symbol: 'BTC', amount: 1.2, value: 0, change: 0, image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png' },
        { id: 'ethereum', name: 'Cold ETH', symbol: 'ETH', amount: 10, value: 0, change: 0, image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png' },
    ]);
    const [marketCoins, setMarketCoins] = useState([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const [isOffline, setIsOffline] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'buy', asset: null });
    const [isSendModalOpen, setIsSendModalOpen] = useState(false);
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [activeAsset, setActiveAsset] = useState(null);

    useEffect(() => {
        const fetchWalletData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await axios.get('http://localhost:5001/api/wallet/data', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setWalletBalance(response.data.walletBalance);
                const userAssets = response.data.assets;

                // Fetch real-time market data
                const marketData = await getCoinsMarkets();
                setMarketCoins(marketData);

                const updatedAssets = userAssets.map(asset => {
                    const marketCoin = marketData.find(c => c.id === asset.id);
                    return {
                        ...asset,
                        price: marketCoin?.current_price || 0,
                        value: (marketCoin?.current_price || 0) * asset.amount,
                        change: marketCoin?.price_change_percentage_24h || 0,
                        image: marketCoin?.image || asset.image || FALLBACK_IMAGE
                    };
                });

                setAssets(updatedAssets);

                // Update offline assets prices
                setOfflineAssets(prev => prev.map(asset => {
                    const marketCoin = marketData.find(c => c.id === asset.id);
                    return {
                        ...asset,
                        price: marketCoin?.current_price || 0,
                        value: (marketCoin?.current_price || 0) * asset.amount,
                        change: marketCoin?.price_change_percentage_24h || 0,
                        image: marketCoin?.image || asset.image || FALLBACK_IMAGE
                    };
                }));

            } catch (error) {
                console.error("Error fetching wallet data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWalletData();
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

    const handleAssetChange = (newAsset) => {
        // Find existing owned asset or use market coin
        const owned = currentAssets.find(a => a.id === newAsset.id);
        const market = marketCoins.find(a => a.id === newAsset.id);

        const mergedAsset = {
            ...newAsset,
            ...(owned || {}),
            price: market?.current_price || newAsset.price || 0,
            image: market?.image || newAsset.image || FALLBACK_IMAGE
        };

        if (modalConfig.isOpen) {
            setModalConfig(prev => ({ ...prev, asset: mergedAsset }));
        }
        if (isSendModalOpen || isReceiveModalOpen) {
            setActiveAsset(mergedAsset);
        }
    };

    const openModal = (type, assetId = 'bitcoin') => {
        let asset;
        if (type === 'buy') {
            asset = marketCoins.find(a => a.id === assetId) || marketCoins[0];
        } else {
            asset = currentAssets.find(a => a.id === assetId) || currentAssets[0];
        }
        setModalConfig({ isOpen: true, type, asset });
    };

    const handleTransaction = async (amount, type, assetId) => {
        const targetAsset = assetId ? currentAssets.find(a => a.id === assetId) : modalConfig.asset;
        const totalValue = amount * (targetAsset?.price || 0);

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5001/api/wallet/transaction', {
                type,
                assetId: targetAsset.id,
                amount,
                totalValue,
                symbol: targetAsset.symbol,
                name: targetAsset.name,
                image: targetAsset.image
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setWalletBalance(response.data.walletBalance);

            // Re-fetch market prices to update the new user assets
            const marketData = await getCoinsMarkets();
            const updatedAssets = response.data.assets.map(asset => {
                const marketCoin = marketData.find(c => c.id === asset.id);
                return {
                    ...asset,
                    price: marketCoin?.current_price || 0,
                    value: (marketCoin?.current_price || 0) * asset.amount,
                    change: marketCoin?.price_change_percentage_24h || 0,
                    image: marketCoin?.image || asset.image || FALLBACK_IMAGE
                };
            });
            setAssets(updatedAssets);

            setModalConfig({ ...modalConfig, isOpen: false });
            setIsSendModalOpen(false);
            setIsReceiveModalOpen(false);
        } catch (error) {
            console.error("Transaction failed:", error);
            alert(error.response?.data?.message || "Transaction failed");
        }
    };

    const handleTransferToCold = (assetId, amount) => {
        setAssets(prev => prev.map(a => {
            if (a.id === assetId) {
                return { ...a, amount: a.amount - amount, value: (a.amount - amount) * a.price };
            }
            return a;
        }));
        setOfflineAssets(prev => {
            const existing = prev.find(a => a.id === assetId);
            if (existing) {
                return prev.map(a => a.id === assetId ? { ...a, amount: a.amount + amount, value: (a.amount + amount) * a.price } : a);
            } else {
                const asset = assets.find(a => a.id === assetId);
                return [...prev, { ...asset, amount: amount, value: amount * asset.price }];
            }
        });
    };

    const handleTransferToHot = (assetId, amount) => {
        setOfflineAssets(prev => prev.map(a => {
            if (a.id === assetId) {
                return { ...a, amount: a.amount - amount, value: (a.amount - amount) * a.price };
            }
            return a;
        }));
        setAssets(prev => prev.map(a => {
            if (a.id === assetId) {
                return { ...a, amount: a.amount + amount, value: (a.amount + amount) * a.price };
            }
            return a;
        }));
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
                    <span className="label">USD Balance</span>
                    <h2 className="amount">${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
                    <div className="change positive">
                        <ArrowUpRight size={16} />
                        <span>Ready to Trade</span>
                    </div>
                </div>
                <div className="actions">
                    <button className="action-btn send" onClick={() => {
                        setActiveAsset(currentAssets[0]);
                        setIsSendModalOpen(true);
                    }}>
                        <div className="icon"><ArrowUpRight size={24} /></div>
                        <span>Send</span>
                    </button>
                    <button className="action-btn receive" onClick={() => {
                        setActiveAsset(currentAssets[0]);
                        setIsReceiveModalOpen(true);
                    }}>
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
                        onItemClick={(item) => {
                            const asset = currentAssets.find(a => a.id === item.id);
                            setActiveAsset(asset);
                            // Open context menu or direct action? Let's open Sell for now if clicked in carousel
                            openModal('sell', item.id);
                        }}
                    />
                </div>

                <div className="assets-stagnant-list">
                    {currentAssets
                        .sort((a, b) => b.value - a.value)
                        .map((asset) => (
                            <div key={asset.id} className="asset-row-card">
                                <div className="asset-row-left" onClick={() => navigate(`/coin/${asset.id}`)}>
                                    <img src={asset.image || FALLBACK_IMAGE} alt={asset.name} className="asset-row-img" />
                                    <div className="asset-row-info">
                                        <span className="asset-row-name">{asset.name}</span>
                                        <span className="asset-row-symbol">{asset.symbol}</span>
                                    </div>
                                </div>
                                <div className="asset-row-right">
                                    <div className="asset-row-holdings" onClick={() => navigate(`/coin/${asset.id}`)}>
                                        <span className="asset-row-amount">{asset.amount.toLocaleString()} {asset.symbol}</span>
                                        <span className="asset-row-value">${asset.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="asset-row-actions">
                                        <div className={`asset-row-change ${asset.change >= 0 ? 'positive' : 'negative'}`}>
                                            {asset.change >= 0 ? '+' : ''}{asset.change?.toFixed(2)}%
                                        </div>
                                        <button
                                            className="transfer-mini-btn"
                                            title={isOffline ? "Move to Hot Wallet" : "Move to Cold Storage"}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const amountToMove = asset.amount; // For demo, move everything
                                                if (isOffline) {
                                                    handleTransferToHot(asset.id, amountToMove);
                                                } else {
                                                    handleTransferToCold(asset.id, amountToMove);
                                                }
                                            }}
                                        >
                                            {isOffline ? <Smartphone size={14} /> : <Lock size={14} />}
                                        </button>
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
                currentPrice={modalConfig.asset?.price || (modalConfig.type === 'buy' ? modalConfig.asset?.current_price : 0) || 0}
                availableAssets={modalConfig.type === 'buy' ? marketCoins : currentAssets}
                onAssetChange={handleAssetChange}
                onConfirm={handleTransaction}
            />

            <SecurityModal
                isOpen={showSecurityModal}
                onClose={() => setShowSecurityModal(false)}
                onVerify={handleUnlock}
                title="Cold Storage Access"
                description="Please enter your 4-digit PIN to access your offline cold wallet."
            />

            <SendModal
                isOpen={isSendModalOpen}
                onClose={() => setIsSendModalOpen(false)}
                asset={activeAsset}
                availableAssets={currentAssets}
                onAssetChange={handleAssetChange}
                onConfirm={handleTransaction}
            />

            <ReceiveModal
                isOpen={isReceiveModalOpen}
                onClose={() => setIsReceiveModalOpen(false)}
                asset={activeAsset}
                availableAssets={currentAssets}
                onAssetChange={handleAssetChange}
                onConfirm={handleTransaction}
            />
        </div>
    );
};

export default Wallet;

