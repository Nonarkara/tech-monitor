import axios from 'axios';

const CRYPTO_SYMBOLS = ['BTCUSDT', 'ETHUSDT'];
const FOREX_API = 'https://open.er-api.com/v6/latest/USD';
const REFERENCE_COMMODITIES = {
    'Gold Ref': 2345.5,
    'Silver Ref': 28.4
};

const previousQuotes = new Map();

const getDelta = (key, value) => {
    const previous = previousQuotes.get(key);
    previousQuotes.set(key, value);

    if (!previous || previous === 0) {
        return {
            changePerc: '0.00%',
            isPositive: true
        };
    }

    const delta = ((value - previous) / previous) * 100;

    return {
        changePerc: `${delta >= 0 ? '+' : ''}${delta.toFixed(2)}%`,
        isPositive: delta >= 0
    };
};

export const fetchMarketPayload = async () => {
    const results = [];
    let rates = null;
    let thbRate = 35;

    const forexResponse = await axios.get(FOREX_API, { timeout: 15000 });
    rates = forexResponse.data?.rates || null;
    thbRate = rates?.THB || thbRate;

    if (!rates) {
        throw new Error('Forex feed unavailable');
    }

    try {
        const cryptoResponses = await Promise.all(
            CRYPTO_SYMBOLS.map((symbol) => axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, { timeout: 15000 }))
        );

        cryptoResponses.forEach((response) => {
            const data = response.data;
            const changeValue = parseFloat(data.priceChangePercent);

            results.push({
                symbol: data.symbol.replace('USDT', ''),
                price: parseFloat(data.lastPrice).toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
                changePerc: `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(2)}%`,
                isPositive: changeValue >= 0
            });
        });
    } catch (error) {
        console.warn('Server crypto feed failed', error.message);
    }

    [
        { id: 'USD', name: 'USD/THB' },
        { id: 'EUR', name: 'EUR/THB' },
        { id: 'JPY', name: 'JPY/THB' },
        { id: 'CNY', name: 'CNY/THB' },
        { id: 'SGD', name: 'SGD/THB' }
    ].forEach((cross) => {
        if (!rates[cross.id]) return;

        const priceInThb = thbRate / rates[cross.id];
        const delta = getDelta(cross.name, priceInThb);

        results.push({
            symbol: cross.name,
            price: priceInThb.toLocaleString('th-TH', {
                style: 'currency',
                currency: 'THB',
                minimumFractionDigits: cross.id === 'JPY' ? 4 : 2
            }),
            changePerc: delta.changePerc,
            isPositive: delta.isPositive
        });
    });

    Object.entries(REFERENCE_COMMODITIES).forEach(([symbol, usdPrice]) => {
        const priceInThb = usdPrice * thbRate;
        const delta = getDelta(symbol, priceInThb);

        results.push({
            symbol: `${symbol} (THB)`,
            price: priceInThb.toLocaleString('th-TH', { style: 'currency', currency: 'THB' }),
            changePerc: delta.changePerc,
            isPositive: delta.isPositive
        });
    });

    return results;
};
