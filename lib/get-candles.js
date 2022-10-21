import fs from 'fs';

import got from 'got';
import jsonFile from 'jsonfile';
import queryString from 'query-string';
import delay from 'delay';
import get from 'lodash.get';

import defaults from './defaults.js';

import enrich from './enrich.js';
import getLogger from './log.js';
import humanizeDate from './humanize-date.js';

export default async function getCandleData(coinSymbol, interval) {

	const { endpointUrl, ticksPerResultsFragment, stepSize, isUpdatingHistory } = defaults();

	const log = getLogger();

	const fileName = `./data/${coinSymbol}-${interval}-${stepSize}.json`;

	const now = new Date().getTime();

	// avoid if ordered to only load available data
	if (!isUpdatingHistory) return avoidDownloading();

	// avoid if data is recent enough
	try {
		const { mtimeMs } = fs.statSync(fileName);
		const buffer = { '1d': 14400000, '1h': 3600000 }[interval];
		if (now - buffer < mtimeMs) return avoidDownloading();
	} catch (err) {
		return handleErr(err);
	}

	// get last saved tick by trying to read from file
	let savedData, lastTickCloseTime;
	try {
		savedData = await jsonFile.readFile(fileName).catch(handleErr);
	} catch (err) {
		return handleErr(err);
	}
	if (!savedData || !savedData.length) {
		log('fetching-detail', `Available data for ${coinSymbol} seems corrupt`);
		return downloadFromStart();
	}

	if (savedData.length < 2) return [];
	lastTickCloseTime = savedData[savedData.length - 2].closeTime;
	return downloadAllCandleData(fileName, coinSymbol, lastTickCloseTime, savedData);

	function avoidDownloading() {
		log('fetching-detail', `Using ${'only'.bold} available data for ${coinSymbol}-${interval}`);
		return jsonFile.readFile(fileName).catch(handleErr);
	}

	function handleErr(err) {
		const message = get(err, 'message', '');

		if (
			// error message includes something about bad json
			(message && (
				(message.includes('Unexpected token') && message.includes('in JSON at position'))
				|| message.includes('Unexpected end of JSON input')
			))
			// data doesn't exist
			|| get(err, 'code', '') === 'ENOENT'
		) {
			// fetch everything from the very beginning
			return downloadFromStart();
		}

		throw err;
	}

	function downloadFromStart() {
		return downloadAllCandleData(fileName, coinSymbol, 0);
	}

	async function downloadAllCandleData(fileName, coinSymbol, startTime, accu = []) {

		// fetch data
		const rawTicks = (await download(coinSymbol, startTime)).map(tickDataNamer);

		// this batch is empty so if we have some from previous batches - save them
		if (!rawTicks.length && accu.length) return save(accu);

		// enrich data
		// adds some of the previously handled ticks for reference then slices just the new ticks
		log('enrichment', 'Enriching data');
		const richTicks = enrich(accu.slice(stepSize * -2).concat(rawTicks), interval)
			.slice(-1 * rawTicks.length);

		// debug enrichment
		log('enrichment', richTicks
				.slice(-20)
				.map(({ humanDate, StochRSI_02_SmoothK, StochRSI_02_D }) => ({ humanDate, StochRSI_02_SmoothK, StochRSI_02_D })),
			{ method: 'table' });

		// if we didn't get a full batch, it must mean that this one's the last
		if (rawTicks.length < ticksPerResultsFragment) return save(accu.slice(0, -1).concat(richTicks));

		return downloadAllCandleData(fileName, coinSymbol, richTicks[richTicks.length - 1].closeTime, accu.slice(0, -1).concat(richTicks));

		async function download(coinSymbol, startTime) {
			await delay(100);

			const url = `${endpointUrl}?${queryString.stringify({
				startTime,
				interval,
				symbol: `${coinSymbol}USDT`,
				limit: ticksPerResultsFragment,
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