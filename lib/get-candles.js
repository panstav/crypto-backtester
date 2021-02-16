import fs from 'fs';

import got from 'got';
import jsonFile from 'jsonfile';
import queryString from 'query-string';
import delay from 'delay';

import enrich from './enrich.js';
import getLogger from './log.js';
import humanizeDate from './humanize-date.js';

const now = new Date().getTime();

export default async function getCandleData(coinSymbol, options) {

	const {
		updateData,
		interval,
		endpoint,
		stepSize,
		logTypes,
		ticksPerBatch
	} = options;

	const log = getLogger(logTypes);

	const fileName = `./data/${coinSymbol}-${interval}-${stepSize}.json`;

	try {
		const { mtimeMs } = fs.statSync(fileName);
		const buffer = { '1d': 3600000, '1h': 900000 }[interval];
		if (!updateData || now - buffer < mtimeMs) {
			log('fetching-detail', `Using ${'only'.bold} available data for ${coinSymbol}-${interval}`);
			return jsonFile.readFile(fileName);
		}
	} catch (err) {
		return handleErr(err);
	}

	// get last saved tick by trying to read from file
	let savedData, lastTickCloseTime;
	try {
		savedData = await jsonFile.readFile(fileName);
	} catch (err) {
		return handleErr(err);
	}
	if (!savedData || !savedData.length) {
		log('fetching-detail', `Available data for ${coinSymbol} seems corrupt`);
		return downloadFromStart();
	}

	lastTickCloseTime = savedData[savedData.length - 2].closeTime;
	return downloadAllCandleData(fileName, coinSymbol, lastTickCloseTime, savedData);

	function handleErr(err) {
		if (err.code !== 'ENOENT') throw err;
		// data doesn't exist - fetch everything from the very beginning
		return downloadFromStart();
	}

	function downloadFromStart() {
		return downloadAllCandleData(fileName, coinSymbol, 0);
	}

	async function downloadAllCandleData(fileName, coinSymbol, startTime, accu = []) {

		// fetch data
		const rawTicks = (await download(coinSymbol, startTime)).map(tickDataNamer);

		// some data was gathered and there's no more right now
		if (!rawTicks.length && accu.length) return save(accu);

		// enrich data
		log('enrichment', 'Enriching data');
		const richTicks = enrich(accu.slice(stepSize * -2).concat(rawTicks), { stepSize, interval })
			.slice(-1 * rawTicks.length);

		// debug enrichment
		log('enrichment', richTicks
				.slice(-20)
				.map(({ humanDate, StochRSI_02_SmoothK, StochRSI_02_D }) => ({ humanDate, StochRSI_02_SmoothK, StochRSI_02_D })),
			{ method: 'table' });

		if (rawTicks.length < ticksPerBatch) return save(accu.slice(0, -1).concat(richTicks));

		return downloadAllCandleData(fileName, coinSymbol, richTicks[richTicks.length - 1].closeTime, accu.slice(0, -1).concat(richTicks));

		async function download(coinSymbol, startTime) {
			await delay(100);

			const url = `${endpoint}?${queryString.stringify({
				startTime,
				interval,
				symbol: `${coinSymbol}USDT`,
				limit: ticksPerBatch,
			})}`;

			log('fetching', `Fetching ${coinSymbol} for ${humanizeDate(startTime, { '1h': true, '1d': false }[interval])}`)
			return got(url).json();
		}

		async function save(accu) {
			await jsonFile.writeFile(fileName, accu, { spaces: 4 });
			return accu;
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

}