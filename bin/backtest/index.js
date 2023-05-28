import config from '../../config.js';
import fetchTradableSymbols from '../../lib/fetch-tradable-coins.js';
import fetchSymbolCandles from '../../lib/get-candles.js';
import evaluateStrategy from '../../lib/evaluate.js';

import * as strategies from './strategies.js';

const { logTypes, apiUrl, baseCurrency, coinsCountLimit, intervals, minimumTicksPerInterval, timeTillRecommendationExpires } = config;

fetchTradableSymbols()
	.then(evaluateSymbols)
	.then((res) => {
		debugger;
	});

async function evaluateSymbols(symbols) {
	return asyncForEach(symbols, async (symbol, index) => {

		console.log(`\nFetching ${symbol} (${index + 1} / ${symbols.length})`);

		const coinData = await getCandlesByInterval(symbol);
		debugger;

		
		return strategies.map((strategy) => evaluateStrategy({ strategy, ticks, coinSymbol, interval }));
		const { positions, trades } = evaluateStrategy({ strategy, ticks, coinSymbol, interval })

		return coinData;
	});
}

async function getCandlesByInterval(symbol) {

	const ticksByInterval = await Promise.all(intervals.map(async (interval) => {
		const ticks = await fetchSymbolCandles(symbol, interval);
		return { ticks, interval };
	}));

	// filter coins that have even a single interval type with less than minimum ticks
	if (ticksByInterval.some(({ ticks }) => ticks.length < minimumTicksPerInterval)) return;

	return ticksByInterval.reduce((accu, { interval, ticks }) => {
		accu[interval] = ticks;
		return accu;
	}, {});

}

function asyncForEach(arr, fn) {
	return arr.map((symbol, index) => () => fn(symbol, index))
		.reduce((accu, job) => accu.then(() => new Promise(job)), Promise.resolve());
}