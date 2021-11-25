import got from 'got';

import defaults from '../../lib/defaults.js';
import getLogger from '../../lib/log.js';

import getCandleData from '../../lib/get-candles.js';

export default async function getCoins() {
	const { apiUrl, intervals } = defaults();
	const log = getLogger();

	const baseCurrency = 'USDT';

	log('fetching', `Downloading latest exchange data from ${apiUrl}`)
	const relevantSymbols = (await got(`${apiUrl}/exchangeInfo`).json())['symbols']
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
		.map((symbolPair) => symbolPair.symbol.slice(0, -1 * baseCurrency.length));

	let coins = [];
	for (const symbol of relevantSymbols) {
		console.log(`Updating ${symbol} (${coins.length + 1} / ${relevantSymbols.length})`);
		await Promise.all(intervals.map((interval) => {
			return getCandleData(symbol, interval).then((ticks) => ({ interval, ticks }));
		})).then((ticksByInterval) => {
			if (ticksByInterval.every(({ ticks }) => ticks.length > 100)) coins.push({
				symbol,
				ticksByInterval: ticksByInterval.reduce((accu, { interval, ticks }) => ({ [interval]: ticks, ...accu }), {})
			});
		});
	}

	return coins;
}