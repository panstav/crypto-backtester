import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

import strategies from './lib/strategies.js';
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

	console.log('total trades:', results
		.reduce((trades, coinResult) => trades + coinResult.trades.length, 0));

	const todaysDate = new Date();
	const todaysHumanDate = `${todaysDate.getDate()}/${todaysDate.getMonth() + 1}/${todaysDate.getFullYear()}`;
	console.log(results
		.filter((result) => result.ticks.some(({ humanDate }) => humanDate.includes(todaysHumanDate)))
		.filter((result) => result.positions.some(({ resolved, buyTime }) => !resolved && !buyTime.includes('12/2020') && !buyTime.includes('2021')))
		.map(({ positions, wallet }) => Object.keys(wallet).filter((coinSymbol) => coinSymbol !== 'USD')[0]));

}

function runStrategies(coinSymbol, richTicks) {
	return strategies
		.filter((strategy) => strategy.isActive)
		.reduce((accu, strategy) => evaluate(strategy, {
			initialCapital,
			coinSymbol,
			numTicksToEvaluate,
			ticks: richTicks,
			percentageToRisk,
			percentageToGrab
		}), {});
}

