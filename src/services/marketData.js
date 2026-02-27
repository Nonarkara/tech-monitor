import axios from 'axios';

// Crypto from Binance
const CRYPTO_SYMBOLS = ['BTCUSDT', 'ETHUSDT'];

// Forex from open.er-api.com (base USD). We need JPY, CNY, EUR, SGD.
const FOREX_API = 'https://open.er-api.com/v6/latest/USD';

// Simple mock for Gold/Silver prices to ensure stable UI without relying on paid/flaky commodity APIs.
// We will jitter them slightly every 15 seconds to simulate live changes.
let mockCommodities = {
    'Gold (XAU)': { price: 2345.50, change: 0.12 },
    'Silver (XAG)': { price: 28.40, change: -0.05 }
};

const updateMockCommodities = () => {
    Object.keys(mockCommodities).forEach(key => {
        const jitter = (Math.random() - 0.5) * 0.001; // Tiny percentage jitter
        mockCommodities[key].price *= (1 + jitter);
        mockCommodities[key].change += (jitter * 100);
    });
};

export const fetchMarketRadar = async () => {
    try {
        let results = [];

        // 1. Fetch Crypto
        try {
            const cryptoPromises = CRYPTO_SYMBOLS.map(sym =>
                axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`)
            );
            const cryptoRes = await Promise.all(cryptoPromises);

            cryptoRes.forEach(res => {
                const data = res.data;
                results.push({
                    symbol: data.symbol.replace('USDT', ''),
                    price: parseFloat(data.lastPrice).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                    changePerc: parseFloat(data.priceChangePercent).toFixed(2) + '%',
                    isPositive: parseFloat(data.priceChangePercent) >= 0
                });
            });
        } catch (e) {
            console.warn("Crypto API failed", e);
        }

        // 2. Fetch Forex (Base THB)
        try {
            const forexRes = await axios.get(FOREX_API);
            const rates = forexRes.data.rates;
            const thbRate = rates['THB'] || 35.0; // Fallback to 35 if THB is missing

            // We want to see how much 1 unit of foreign currency costs in THB
            // For example, 1 USD = THB. 1 EUR = (THB/EUR) THB.
            const targetCrosses = [
                { id: 'USD', name: 'USD/THB' },
                { id: 'EUR', name: 'EUR/THB' },
                { id: 'JPY', name: 'JPY/THB' },
                { id: 'CNY', name: 'CNY/THB' },
                { id: 'SGD', name: 'SGD/THB' }
            ];

            targetCrosses.forEach(cross => {
                if (rates[cross.id]) {
                    // 1 unit of cross.id in USD is (1 / rates[cross.id])
                    // 1 unit of cross.id in THB is (1 / rates[cross.id]) * thbRate
                    const priceInThb = thbRate / rates[cross.id];
                    const mockChange = (Math.random() * 0.4 - 0.2);

                    // Format appropriately. JPY often has 2 decimals, USD/EUR have 2.
                    const fractionDigits = cross.id === 'JPY' ? 4 : 2;
                    results.push({
                        symbol: cross.name,
                        price: priceInThb.toLocaleString('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: fractionDigits }),
                        changePerc: mockChange.toFixed(2) + '%',
                        isPositive: mockChange >= 0
                    });
                }
            });
        } catch (e) {
            console.warn("Forex API failed", e);
        }

        // 3. Add Commodities (Live Simulation, converted to THB)
        updateMockCommodities();
        try {
            // Re-fetch Forex just for the THB base (if we wanted true precision, we'd cache the rate from Step 2)
            const forexRes = await axios.get(FOREX_API);
            const thbRate = forexRes.data.rates['THB'] || 35.0;

            Object.keys(mockCommodities).forEach(sym => {
                const data = mockCommodities[sym];
                // mockCommodities price is in USD representing 1 Troy Ounce. Convert to THB.
                const priceThb = data.price * thbRate;
                results.push({
                    symbol: `${sym} (THB)`,
                    price: priceThb.toLocaleString('th-TH', { style: 'currency', currency: 'THB' }),
                    changePerc: data.change.toFixed(2) + '%',
                    isPositive: data.change >= 0
                });
            });
        } catch (e) {
            console.warn("Commodities mock failed", e);
        }

        return results;
    } catch (error) {
        console.warn("Market Radar entirely failed, using fallback:", error);
        return [
            { symbol: 'BTC', price: '$62,450.00', changePerc: '+2.40%', isPositive: true },
            { symbol: 'ETH', price: '$3,420.15', changePerc: '-0.85%', isPositive: false },
            { symbol: 'Gold (XAU)', price: '$2,345.50', changePerc: '+0.12%', isPositive: true },
            { symbol: 'USD/JPY', price: '155.40', changePerc: '-0.10%', isPositive: false }
        ];
    }
};
