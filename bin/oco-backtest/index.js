import config from '../../config.js';

import fetchTradableSymbols from '../../lib/fetch-tradable-coins.js';
import fetchSymbolCandles from '../../lib/get-candles.js';

import evaluateStrategy from './evaluate.js';
import { Daily_2Percent } from './strategies.js';
// import * as strategies from './strategies.js';

const { logTypes, apiUrl, baseCurrency, coinsCountLimit, intervals, minimumTicksPerInterval, timeTillRecommendationExpires } = config;

fetchTradableSymbols()
	.then(evaluateSymbols)
	.then((res) => {
		debugger;
	});

async function evaluateSymbols(symbols) {
	return asyncSeries(symbols, async (symbol, index) => {

		console.log(`\nFetching ${symbol} (${index + 1} / ${symbols.length})`);

		const ticks = await getCandles(symbol);

		const results = [Daily_2Percent].map((strategy) => evaluateStrategy({ strategy, symbol, ticks }));
debugger;

		// return coinData;
	});
}

async function getCandles(symbol) {

	const ticksByInterval = await Promise.all(intervals.map(async (interval) => {
		const ticks = await fetchSymbolCandles(symbol, interval);
		return { ticks, interval };
	}));

	// avoid coins that have even a single interval type with less than the minimum amount of ticks
	if (ticksByInterval.some(({ ticks }) => ticks.length < minimumTicksPerInterval)) return;

	return ticksByInterval.reduce((accu, { interval, ticks }) => {
		accu[interval] = ticks;
		return accu;
	}, {});

}

function asyncSeries(arr, fn) {
	return arr.map((symbol, index) => () => fn(symbol, index))
		.reduce((accu, job) => accu.then(() => new Promise(job)), Promise.resolve());
}