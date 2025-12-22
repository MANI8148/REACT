const CoinCard = ({ coin }) => {
  return (
    <div className="card">
      <img src={coin.image} alt={coin.name} width={30} />
      <h3>{coin.name}</h3>
      <p>${coin.current_price}</p>
    </div>
  );
};

export default CoinCard;