import jsonFile from 'jsonfile';
import queryString from 'query-string';
import got from 'got';

import config from '../config.js';
import enrich from './enrich.js';
import getLogger from './log.js';
import delay from 'delay';

const {
	updateData,
	interval,
	endpoint,
	stepSize
} = config;

export default async function getCandleData(coinSymbol) {

	const fileName = `./data/${coinSymbol}-${interval}-${stepSize}.json`;

	if (!updateData) return jsonFile.readFile(fileName);

	// get last saved tick by trying to read from file
	let savedData, lastTickCloseTime;
	try {
		savedData = await jsonFile.readFile(fileName);
		lastTickCloseTime = savedData[savedData.length - 1].closeTime;
	} catch (err) {
		// data doesn't exist - fetch everything from the very beginning
		if (err.code === 'ENOENT') return downloadAllCandleData(fileName, coinSymbol, 0);
		throw err;
	}

	return downloadAllCandleData(fileName, coinSymbol, lastTickCloseTime, savedData);

}

export async function downloadAllCandleData(fileName, coinSymbol, startTime, accu = []) {

	const log = getLogger();

	// fetch data
	const rawTicks = (await download(coinSymbol, startTime)).map(tickDataNamer);

	if (!rawTicks.length && accu.length) {
		// some data was gathered and we've reached the end of history
		await jsonFile.writeFile(fileName, accu.slice(0, -1), { spaces: 4 });
		return accu;
	}

	// enrich data
	log('enrichment', 'Enriching data');
	const richTicks = enrich(accu.slice(stepSize * -2).concat(rawTicks), { stepSize, interval })
		.slice(-1 * rawTicks.length);

	// debug enrichment
	log('enrichment', richTicks
			.slice(-20)
			.map(({ humanDate, StochRSI_02_SmoothK, StochRSI_02_D }) => ({ humanDate, StochRSI_02_SmoothK, StochRSI_02_D })),
		{ method: 'table' });

	console.log(`${coinSymbol}\n${richTicks[richTicks.length - 1].humanDate}`);
	return downloadAllCandleData(fileName, coinSymbol, richTicks[richTicks.length - 1].closeTime, accu.concat(richTicks));

	async function download(coinSymbol, startTime = 0) {
		await delay(200);

		const url = `${endpoint}?${queryString.stringify({
			startTime,
			interval,
			symbol: `${coinSymbol}USDT`,
			limit: 1000,
		})}`;

		return got(url)
			.json()
			.catch((err) => {
				debugger;
				throw err;
			});

	}

	function tickDataNamer(tickRaw) {
		return {
			openTime: Number(tickRaw[0]),
			openPrice: Number(tickRaw[1]),
			highPrice: Number(tickRaw[2]),
			lowPrice: Number(tickRaw[3]),
			closePrice: Number(tickRaw[4]),
			closeTime: Number(tickRaw[6])
		};
	}

}
