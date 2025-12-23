import React, { useEffect, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCoinsMarkets, searchCoins } from '../../services/cryptoApi';
import Loading from '../../components/loading/Loading';
import AnimatedList from '../../components/ui/AnimatedList/AnimatedList';
import './Market.css';



// Debounce helper
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const FALLBACK_IMAGE = 'https://cryptologos.cc/logos/bitcoin-btc-logo.png';

const Market = () => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const navigate = useNavigate();

  const fetchCoins = async () => {
    setLoading(true);
    try {
      const data = await getCoinsMarkets();
      setCoins(data);
    } catch (error) {
      console.error("Error fetching market data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query) {
      fetchCoins();
      return;
    }
    setLoading(true);
    try {
      const results = await searchCoins(query);
      // Transform search results to match market data structure roughly or handle separately
      // The search API returns a different structure.
      // For consistency, we might want to just show the search results differently 
      // OR try to fetch market data for the found IDs.
      // Here, we'll map the search results to a displayable format for the table.
      const formattedResults = results.map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        image: coin.large || coin.thumb || FALLBACK_IMAGE,
        current_price: 0, // Search API doesn't return price
        price_change_percentage_24h: 0, // Search API doesn't return change
        market_cap: coin.market_cap_rank || 0, // Use rank as proxy or 0
        is_search_result: true
      }));
      setCoins(formattedResults);

    } catch (error) {
      console.error("Error searching coins:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debouncedSearch) {
      handleSearch(debouncedSearch);
    } else {
      fetchCoins();
    }
  }, [debouncedSearch]);


  if (loading && !coins.length) return <Loading />;

  return (
    <div className="market-page">
      <header className="market-header">
        <h1>Market Overview</h1>
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search coins (e.g. Bitcoin)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="market-stack-container" style={{ height: '80vh', overflow: 'hidden' }}>
        {loading ? (
          <div className="table-loading"><Loading /></div>
        ) : (
          <div style={{ height: '100%' }}>
            <AnimatedList
              items={coins.map((coin, index) => ({
                content: (
                  <div className="coin-card-row">
                    <div className="coin-rank">#{coin.market_cap_rank || index + 1}</div>
                    <div className="coin-main">
                      <img src={coin.image || FALLBACK_IMAGE} alt={coin.name} className="coin-img" />
                      <div>
                        <h3>{coin.name}</h3>
                        <span className="symbol">{coin.symbol.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="coin-price">
                      ${coin.current_price?.toLocaleString()}
                    </div>
                    <div className={`coin-change ${coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}`}>
                      {coin.price_change_percentage_24h?.toFixed(2)}%
                    </div>
                  </div>
                ),
                id: coin.id
              }))}
              onItemSelect={(item) => navigate(`/coin/${item.id}`)}
              itemClassName="market-list-item"
              showGradients={true}
            />
          </div>
        )}
      </div>


    </div>
  );
};

export default Market;