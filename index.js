import jsonFile from 'jsonfile';
import got from 'got';
import queryString from 'query-string';

import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

import {
	getAverage,
	getGainAndLoss,
	getInitialChangeAverages,
	getWeightedChangeAverages,
	getStochRSI
} from './lib/math.js';

import {
	MA as testMA
} from './lib/test.js';

const endpoint = 'https://www.binance.com/api/v1/klines';
const maxBinanceCandles = 1000;
const intervals = ['1d'/*, '3d', '1w'*/];
const stepSize = 14;
const torelatedDowntrends = [0/*, 1, 2*/];
const coins = [
	// 'ATOM',
	// 'BAND',
	'BNB'/*,*/
	// 'BTT',
	// 'KAVA',
	// 'TCT',
	// 'BAT',
	// 'BCH',
	// 'CVC',
	// 'DENT',
	// 'DOGE',
	// 'ETH',
	// 'FUN',
	// 'IOTA',
	// 'LSK',
	// 'NEO',
	// 'REN',
	// 'VITE',
	// 'WIN',
	// 'XMR',
	// 'XRP',
	// 'XTZ',
	// 'ZIL',
	// 'ZRX',
	// 'ADA',
	// 'BTC',
	// 'DUSK',
	// 'LINK',
	// 'MITH',
	// 'NANO',
	// 'NULS',
	// 'OMG',
	// 'ONT',
	// 'QTUM',
	// 'THETA',
	// 'VET',
	// 'XLM'
];

(async () => {
	
	const testData = await jsonFile.readFile('./data/test.json');

	// go through list of coins
	return Promise.all(coins.map(async (coinSymbol) => {

		// go through list of timeframes
		return Promise.all(intervals.map(async (interval) => {

			// if corresponding file exists - only update it with missing data
			// otherwise go for the max data pull

			const rawTicks = await got(getEndpoint(coinSymbol, interval, maxBinanceCandles)).json();
			const richTicks = interpret(rawTicks);

			console.table(richTicks
				.slice(900, 910) // 100-103
				.map(({ humanDate, StochK, StochD, StochRSI }) => ({ humanDate, StochK, StochD, StochRSI }))
			);

			const fileName = `./data/${coinSymbol}-${
				intervals.reduce((accu, stepSize) => accu ? `${accu}-${stepSize}` : `${stepSize}`, '')
			}.json`;

			return jsonFile.writeFile(fileName, richTicks, { spaces: 4 });

		}));

	}));

})();

function getEndpoint(symbol, interval, limit) {
	const qs = queryString.stringify({ symbol: `${symbol}USDT`, interval, limit });
	return `${endpoint}?${qs}`;
}

function interpret(rawTicks) {
	return rawTicks.reduce((accu, tickRaw, index) => {

		const prevTickData = accu[index - 1];

		// init nested refined data object
		// const tickData = {
		// 	humanDate: Object.keys(testData)[index],
		// 	closePrice: testData[Object.keys(testData)[index]]
		// };
		const tickData = {
			openTime: Number(tickRaw[0]),
			openPrice: Number(tickRaw[1]),
			highPrice: Number(tickRaw[2]),
			lowPrice: Number(tickRaw[3]),
			closePrice: Number(tickRaw[4]),
			closeTime: Number(tickRaw[6])
		};

		if (prevTickData) Object.assign(
			tickData,
			getGainAndLoss(tickData.closePrice, prevTickData.closePrice)
		);

		// add human readable date
		const date = new Date(tickData.openTime);
		tickData.humanDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

		// ensure we have enough candles for the next calculations
		if (accu.length < (stepSize - 1)) return next();

		// calc moving average
		tickData.MA = getAverage(accu
			.slice(-1 * (stepSize - 1))
			.concat(tickData)
			.map(({ closePrice }) => closePrice)
		);
		testMA({ date: tickData.humanDate, MA: tickData.MA });

		// calc RSI

		// separately first and rest
		// add zeros back to avg
		// compare with test.js
		// remove zeros from avg
		// try with a existing data set

		// = MA
		// 13 ticks + current
		//
		// = first AvgGain / AvgLoss
		// 13 closes + current
		//
		// = Rest
		// AvgGain / AvgLoss + RS + RSI
		// last
		// AvgGain / AvgLoss + current
		// gain / loss

		// ensure we have enough candles for the next calculations
		if (accu.length < stepSize) return next();

		if (!prevTickData.avgGain) {
			const [avgGain, avgLoss] = getInitialChangeAverages(accu
				.slice(-1 * (stepSize - 1))
				.concat(tickData)
				.map((({ gain, loss }) => ({ gain, loss })))
			);
			Object.assign(tickData, { avgGain, avgLoss });

		} else {
			const { avgGain, avgLoss, rsi } = getWeightedChangeAverages(accu
					.slice(-1)
					.concat(tickData),
				stepSize);
			Object.assign(tickData, { avgGain, avgLoss, RSI: rsi });
		}

		// ensure we have enough candles for the next calculations
		// const lastPeriodRSIs = accu
		// 	.slice(-1 * (stepSize))
		// 	.concat(tickData)
		// 	.map(({ highPrice, lowPrice, closePrice, StochK }) => ({ highPrice, lowPrice, closePrice, StochK }));
		// if (!lastPeriodRSIs.every((RSI) => !!RSI)) return next();
		// Object.assign(tickData, getStochRSI(lastPeriodRSIs));

		if (!tickData.RSI) return next();
		const lastPeriodRSIs = accu
			.slice(-1 * (stepSize - 1))
			.concat(tickData)
			.map(({ RSI }) => RSI);
		if (!lastPeriodRSIs.every((RSI) => !!RSI)) return next();
		Object.assign(tickData, { StochRSI: getStochRSI(lastPeriodRSIs) });

		return next();

		function next() {
			accu.push(tickData);
			return accu;
		}

	}, []);
}