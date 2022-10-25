import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

import got from 'got';

import defaults from '../lib/defaults.js';
import getLogger from '../lib/log.js';
import getCandleData from '../lib/get-candles.js';
import evaluateStrategy from '../lib/evaluate.js';

import { Base as strategy } from '../strategies/index.js';

const { logTypes, apiUrl, baseCurrency, coinsCountLimit, intervals, minimumTicksPerInterval, timeTillRecommendationExpires } = defaults({
	// force fetching latest data
	isUpdatingHistory: true,
	numTicksToEvaluate: 500,
	logTypes: {
		'fetching': true
	}
});

const log = getLogger(logTypes);

const minNumberOfPreviousWins = 1;

// { 1d: [], 1h: [] }
const recommendations = getInitRecommendations();

await init();
console.log('Done!');

async function init() {
	return getRelevantCoins()
		.then(considerAllCoins)
		.then(printRecommendations)
		.catch(console.error);
}

async function considerAllCoins(relevantSymbols) {
	return relevantSymbols.map((symbol, index) => async (resolve) => {
		const coinData = await getCoinData(symbol, index, relevantSymbols.length);
		if (!coinData) return resolve();

		intervals.forEach((interval) => {
			const recommendation = considerCoin(symbol, coinData[interval], interval);
			if (recommendation) recommendations[interval].push(recommendation);
		});

		resolve();
	}).reduce((accu, job) => accu.then(() => new Promise(job)), Promise.resolve())
}

function considerCoin(coinSymbol, ticks, interval) {

	const { positions, trades } = evaluateStrategy({ strategy, ticks, coinSymbol, interval });

	// ignore coin/interval pairs that don't have any positions
	if (!positions.length
		// ignore coins that have too few winning trades
		|| trades.filter((trade) => trade.change$ > 0).length < minNumberOfPreviousWins
		// ignore positions that are too old to act upon
		|| !tooLateToBuy(positions, interval)) return;

	return buildRecommendation(coinSymbol, positions[positions.length - 1], trades);
}

async function getCoinData(symbol, index, totalSymbols) {
	return new Promise(async (resolve) => {
		console.log(`\nUpdating ${symbol} (${index + 1} / ${totalSymbols})`);

		await Promise.all(intervals.map((interval) => {
			return getCandleData(symbol, interval).then((ticks) => ({ interval, ticks }));
		})).then((ticksByInterval) => {
			// filter coins that have even a single interval with less than 100 ticks
			if (ticksByInterval.some(({ ticks }) => ticks.length < minimumTicksPerInterval)) return resolve();

			resolve(ticksByInterval.reduce((accu, { interval, ticks }) => {
				accu[interval] = ticks;
				return accu;
			}, {}));
		});
	}).catch(console.error);
}

function buildRecommendation(symbol, recommendedPosition, trades) {

	return {
		Symbol: symbol,
		Timing: recommendedPosition.humanDate,
		Timestamp: recommendedPosition.buyTime,
		'Historical Profitability': trades.reduce((accu, trade) => accu.add(trade.change$), new Decimal(0)).toNumber(),
		'Profitability Percentile': calcWinningPercentile(),
		'Total wins': trades.filter((trade) => trade.change$ > 0).length,
		'Effective Volatility': calcVolatility(),
		Link: `https://www.binance.com/en/trade/${symbol}_${baseCurrency}`
	};

	function calcVolatility() {
		return `<7 ${heldFor('less', 7)} >45 ${heldFor('more', 45)}`;
	}

	function calcWinningPercentile() {
		const numberOfWinningTrades = trades.filter((trade) => trade.change$ > 0).length;
		if (!numberOfWinningTrades) return 0;

		return new Decimal(numberOfWinningTrades).div(trades.length).times(100).toDecimalPlaces(1).toNumber();
	}

	function heldFor(moreOrLess, days) {
		return trades.filter((trade) => {
			const daysHeld = trade.holdDuration / 24 / 60 / 60 / 1000;
			return moreOrLess === 'more'
				? daysHeld > days
				: daysHeld < days;
		}
		).length;
	}

}

function printRecommendations() {
	intervals.forEach((interval) => {
		console.log(`--------------------------------------------------
Recommended Crypto to buy ${{ '1d': 'today', '1h': 'at this hour' }[interval]}:`);
		const results = !recommendations[interval].length ? 'None.'.bold
		: recommendations[interval].sort((a, b) => {
			let diff = b.Timestamp - a.Timestamp;
			return diff || b['Profitability Percentile'] - a['Profitability Percentile'];
		})
		.map((recommendation) => {
			// remove irrelevant data (eg. Timestamp)
			delete recommendation.Timestamp;
			return recommendation;
		});
		console.table(results);
	});
}

function tooLateToBuy(positions, interval) {
	const farthest = new Date().getTime() - timeTillRecommendationExpires[interval];
	return positions[positions.length - 1].buyTime > farthest;
}

async function getRelevantCoins () {
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

function getInitRecommendations() {
	return intervals.reduce((accu, interval) => {
		accu[interval] = [];
		return accu;
	}, {});
}