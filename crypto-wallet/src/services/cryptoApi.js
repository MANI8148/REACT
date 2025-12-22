import axios from "axios";

const api = axios.create({
    baseURL: "https://api.coingecko.com/api/v3",
    timeout: 10000,
});

const API_KEY = "CG-9DDyY4HZPMf8UR12SK62cY2P";


export const getSimplePrice = async (coinIds, currency = "usd") => {
    const response = await api.get("/simple/price", {
        params: {
            ids: coinIds.join(","),
            vs_currencies: currency,
            x_cg_demo_api_key: API_KEY,
        },
    });
    return response.data;
};

export const getCoinsMarkets = async (currency = "usd") => {
    const response = await api.get("/coins/markets", {
        params: {
            vs_currency: currency,
            order: "market_cap_desc",
            per_page: 50,
            page: 1,
            sparkline: false,
            x_cg_demo_api_key: API_KEY,
        },
    });
    return response.data;
};

export const getMarketChart = async (coinId, days = 365, currency = "usd") => {
    const response = await api.get(`/coins/${coinId}/market_chart`, {
        params: {
            vs_currency: currency,
            days: days,
            x_cg_demo_api_key: API_KEY,
        },
    });
    return response.data;
};

export const getCoinDetail = async (coinId) => {
    const response = await api.get(`/coins/${coinId}`, {
        params: {
            localization: false,
            tickers: false,
            market_data: true,
            community_data: false,
            developer_data: false,
            sparkline: false,
            x_cg_demo_api_key: API_KEY,
        },
    });
    return response.data;
};