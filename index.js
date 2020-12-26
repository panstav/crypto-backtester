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
	coins
} = config;

const log = getLogger(logTypes);

(async () => {
	await evaluate_all_cases();
})();

async function evaluate_all_cases() {

	// TODO: Add order-book tracking and strategizing for range bidding, etc.

	// coin by coin
	return Promise.all(coins.map(async (coinSymbol) => {

		// get enriched relevant ticks
		const richTicks = await getCandleData(coinSymbol);

		// TODO: validate strategies

		runStrategies(coinSymbol, richTicks);

	}));

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
		const rawTicks = await got(url).json();

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
		const richTicks = enrich(normalizedTicks, { stepSize });

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

	strategies
		// .filter((strategy) => strategy.name === 'Stoch - Infinite positions')
		.forEach((strategy) => evaluate(strategy, {
			initialCapital,
			coinSymbol,
			numTicksToEvaluate,
			ticks: richTicks
		}));

}

