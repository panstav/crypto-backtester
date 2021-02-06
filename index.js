import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

import strategies from './strategies/index.js';

import getLogger from './lib/log.js';
import evaluate from './lib/evaluate.js';
import getCandleData from './lib/get-candles.js';

import config from './config.js';
const {
	numTicksToEvaluate,
	initialCapital,
	coins,
	percentageToRisk,
	percentageToGrab
} = config;

(async () => {
	await evaluate_all_cases();
})();

async function evaluate_all_cases() {

	// coin by coin
	const results = await Promise.all(coins.map(async (coinSymbol) => {

		// get enriched relevant ticks
		const richTicks = await getCandleData(coinSymbol);

		// simulate coin history on chosen strategies
		return runStrategies(coinSymbol, richTicks);

	}));

}

function runStrategies(coinSymbol, richTicks) {
	return strategies
		.reduce((accu, strategy) => evaluate(strategy, {
			initialCapital,
			coinSymbol,
			numTicksToEvaluate,
			ticks: richTicks,
			percentageToRisk,
			percentageToGrab
		}), {});
}

