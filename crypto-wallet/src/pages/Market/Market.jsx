import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCoinsMarkets } from '../../services/cryptoApi';
import './Market.css';

const Market = () => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const data = await getCoinsMarkets();
        setCoins(data);
      } catch (error) {
        console.error("Error fetching market data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
  }, []);

  const filteredCoins = coins.filter(coin =>
    coin.name.toLowerCase().includes(search.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="market-page">
      <header className="market-header">
        <h1>Market Overview</h1>
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search coins..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="market-table-container">
        {loading ? (
          <div className="loading-state">Loading market data...</div>
        ) : (
          <table className="market-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>24h Change</th>
                <th className="hide-mobile">Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {filteredCoins.map(coin => (
                <tr key={coin.id} onClick={() => navigate(`/coin/${coin.id}`)}>
                  <td className="coin-name-cell">
                    <img src={coin.image} alt={coin.name} />
                    <div className="name-info">
                      <span className="font-bold">{coin.name}</span>
                      <span className="text-muted">{coin.symbol.toUpperCase()}</span>
                    </div>
                  </td>
                  <td>${coin.current_price.toLocaleString()}</td>
                  <td>
                    <span className={`change-text ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                      {coin.price_change_percentage_24h?.toFixed(2)}%
                    </span>
                  </td>
                  <td className="hide-mobile">${coin.market_cap.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Market;