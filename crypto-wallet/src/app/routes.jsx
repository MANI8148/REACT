import React from 'react';
import { Route } from 'react-router-dom';
import Layout from '../components/Layout';
import Wallet from '../pages/Wallet/Wallet';
import Market from '../pages/Market/Market';
import CoinDetails from '../pages/CoinDetails/CoinDetails';
import Login from '../pages/Login/Login';

const AppRoutes = (
    <>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Layout />}>
            <Route index element={<Wallet />} />
            <Route path="market" element={<Market />} />
            <Route path="coin/:id" element={<CoinDetails />} />
        </Route>
    </>
);


export default AppRoutes;
