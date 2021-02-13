import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

import strategies from './strategies/index.js';

import evaluate from './lib/evaluate.js';
import getCandleData from './lib/get-candles.js';

import config from './config.js';
const {
	numTicksToEvaluate,
	initialCapital,
	coins,
	percentageToRisk,
	percentageToGrab,
	tradingStartTime,
	stepSize,
	interval,
	updateData,
	endpoint,
	logTypes
} = config;

(async () => {
	await Promise.all(coins.map(async (coinSymbol) => {

		// coin by coin - get enriched relevant ticks
		const richTicks = await getCandleData(coinSymbol, {
			updateData,
			interval,
			endpoint,
			stepSize,
			logTypes
		});

		// simulate coin history on chosen strategies
		return strategies.forEach((strategy) => evaluate(strategy, {
			ticks: richTicks,
			initialCapital,
			coinSymbol,
			numTicksToEvaluate,
			percentageToRisk,
			percentageToGrab,
			tradingStartTime,
			stepSize,
			interval,
			logTypes
		}));

	}));
})();