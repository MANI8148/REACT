import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import Wallet from '../pages/Wallet/Wallet';
import Market from '../pages/Market/Market';
import CoinDetails from '../pages/CoinDetails/CoinDetails';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Wallet />} />
          <Route path="market" element={<Market />} />
          <Route path="coin/:id" element={<CoinDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
