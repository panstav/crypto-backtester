import jsonFile from 'jsonfile';
import got from 'got';
import queryString from 'query-string';

import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

import strategies from './lib/strategies.js';
import getLogger from './lib/log.js';
import enrich from './lib/enrich.js';
import evaluate from './lib/evaluate.js';

import config from './config.js';
const {
	logTypes,
	maxCandles,
	numTicksToEvaluate,
	interval,
	endpoint,
	initialCapital,
	stepSize,
	coins,
	percentageToRisk,
	percentageToGrab
} = config;

const log = getLogger(logTypes);

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

async function getCandleData(coinSymbol) {
	const fileName = `./data/${coinSymbol}-${interval}-${stepSize}.json`;

	// only download when developing data enrichment
	// return await downloadCandleData();

	try {
		// get saved data
		return await jsonFile.readFile(fileName);
	} catch (err) {
		// if data doesn't exist - fetch it
		if (err.code === 'ENOENT') return await downloadCandleData();
	}

	async function downloadCandleData() {

		// fetch data
		const url = `${endpoint}?${queryString.stringify({ symbol: `${coinSymbol}USDT`, interval, limit: maxCandles })}`;
		log('enrichment', 'Downloading data from Binance');
		const rawTicks = await got(url).json().catch((err) => {
			throw err;
		});

		// normalize data
		const normalizedTicks = rawTicks.map((tickRaw) => ({
			openTime: Number(tickRaw[0]),
			openPrice: Number(tickRaw[1]),
			highPrice: Number(tickRaw[2]),
			lowPrice: Number(tickRaw[3]),
			closePrice: Number(tickRaw[4]),
			closeTime: Number(tickRaw[6])
		}));

		// enrich data
		log('enrichment', 'Enriching data');
		const richTicks = enrich(normalizedTicks, { stepSize, interval });

		// debug enrichment
		log('enrichment', richTicks
				.slice(-20)
				.map(({ humanDate, StochRSI_02_SmoothK, StochRSI_02_D }) => ({ humanDate, StochRSI_02_SmoothK, StochRSI_02_D })),
			{ method: 'table' });

		// save it locally
		await jsonFile.writeFile(fileName, richTicks, { spaces: 4 });

		return richTicks;
	}

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

