import got from 'got';

import getDefaults from "./defaults.js";
import getLogger from "./log.js";

const log = getLogger();

const { apiUrl, baseCurrency, coinsCountLimit } = getDefaults();

export default async function fetchTradableCoins() {
	
	log('fetching', `Downloading latest exchange data from ${apiUrl}`);
	const res = await got(`${apiUrl}/exchangeInfo`).json();

	return res['symbols']
		.filter((coin) => (
			// the currency we use should be the base, not the quote
			coin.quoteAsset === baseCurrency
			// no trading against another dollar-like currency
			&& !coin.baseAsset.includes('USD')
			// is actively trading
			&& coin.status === 'TRADING'
			// at the spot level, regardless of other options
			&& coin.permissions.includes('SPOT')
		))
		.map((symbolPair) => symbolPair.symbol.slice(0, -1 * baseCurrency.length))
		.reverse().slice(coinsCountLimit * -1).reverse()
}