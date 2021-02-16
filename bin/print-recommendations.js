import got from 'got';

import getCandleData from '../lib/get-candles.js';
import evaluate from '../lib/evaluate.js';

import getLogger from '../lib/log.js';
const log = getLogger({ 'fetching': true });

import config from '../config.js';
const {
	apiUrl,
	endpoint,
	stepSize,
	percentageToRisk,
	percentageToGrab,
	initialCapital,
	intervals,
	ticksPerBatch
} = config;

import { Pandit001 as strategy } from '../strategies/index.js';

(async () => {

	const recommendations = await getRecommendations();

	intervals.forEach((interval) => {
		console.log(`--------------------------------------------------
Recommended Crypto to buy ${{ '1d': 'today', '1h': 'at this hour' }[interval]}:`);
		console.table(recommendations[interval].length ? recommendations[interval].sort((a, b) => a.Timestamp - b.Timestamp) : 'None.'.bold);
	});

})();

async function getRecommendations() {

	return (await getCoins()).reduce((accu, coin) => {
		intervals.forEach((interval) => {

			const { positions, trades } = evaluate(strategy, {
				interval,
				ticks: coin.ticksByInterval[interval],
				coinSymbol: coin.symbol,
				numTicksToEvaluate: false,
				tradingStartTime: 0,
				initialCapital,
				percentageToRisk,
				percentageToGrab,
				stepSize
			});

			if (positions.length
				&& positions[positions.length - 1].buyTime > new Date().getTime() - (3600000 * ({ '1h': 2, '1d': 24 * 1.5 }[interval]))
			) accu[interval].push({
				Symbol: coin.symbol,
				Link: `https://www.binance.com/en/trade/${coin.symbol}_USDT`,
				Timing: positions[positions.length - 1].humanDate,
				Timestamp: positions[positions.length - 1].buyTime,
				...(!interval.includes('h')
					? {
						'Historical Profitability': `${trades.filter((trade) => trade.change$ > 0).length} / ${trades.length}`,
						'Effective Volatility': `<3 ${heldFor('less', 4)} <45 ${heldFor('less', 46)} >45 ${heldFor('more', 45)}`
					}
					: {}
				)
			});

			function heldFor(moreOrLess, days) {
				return trades.filter((trade) => moreOrLess === 'more'
					? (trade.holdDuration / 24 / 60 / 60 / 1000) > days
					: (trade.holdDuration / 24 / 60 / 60 / 1000) < days
				).length;
			}

		});

		return accu;
	}, intervals.reduce((accu, interval) => ({ [interval]: [], ...accu }), {}));

}

async function getCoins() {
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
		await Promise.all(intervals.map((interval) => {
			return getCandleData(symbol, {
				interval,
				endpoint,
				stepSize,
				ticksPerBatch,
				updateData: true,
				logTypes: {
					'fetching-detail': true,
					'fetching': true,
					'final-strategy-summary': true
				}
			}).then((ticks) => ({ interval, ticks }));
		})).then((ticksByInterval) => {
			if (ticksByInterval.every(({ ticks }) => ticks.length > 100)) coins.push({
				symbol,
				ticksByInterval: ticksByInterval.reduce((accu, { interval, ticks }) => ({ [interval]: ticks, ...accu }), {})
			});
		});
	}

	return coins;
}