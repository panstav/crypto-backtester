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
	getWeightedChangeAverages
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

			const response = await got(getEndpoint(coinSymbol, interval, maxBinanceCandles)).json();

			const result = response.reduce((accu, tickRaw, index) => {

				const prevTickData = accu[index - 1];

				// init nested refined data object
				// const tickData = {
				// 	humanDate: Object.keys(testData)[index],
				// 	closePrice: testData[Object.keys(testData)[index]]
				// };
				const tickData = {
					openTime: Number(tickRaw[0]),
					closeTime: Number(tickRaw[6]),
					openPrice: Number(tickRaw[1]),
					closePrice: Number(tickRaw[4])
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
					const [ avgGain, avgLoss ] = getInitialChangeAverages(accu
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

				return next();

				function next() {
					accu.push(tickData);
					return accu;
				}

			}, []);

			debugger;

			// const fileName = `./data/${coinSymbol}-${
			// 	stepSize.reduce((accu, stepSize) => accu ? `${accu}-${stepSize}` : `${stepSize}`, '')
			// }.json`;
			//
			// return jsonFile.writeFile(fileName, data, { spaces: 4 });

		}));

	}));

	function getEndpoint(symbol, interval, limit) {
		const qs = queryString.stringify({ symbol: `${symbol}USDT`, interval, limit });
		return `${endpoint}?${qs}`;
	}

	function smaRsi(closes, prevTickData) {

		const changeModifier = 0.07142857;
		const latestClose = closes[closes.length - 1];

		const [avgGain, avgLoss] = prevTickData[`RSI${stepSize}`]

			? [
				new Decimal(latestClose).times(changeModifier).add(new Decimal(prevTickData[`RSI${stepSize}`].avgGain).times(new Decimal(1).minus(changeModifier))),
				new Decimal(latestClose).times(changeModifier).add(new Decimal(prevTickData[`RSI${stepSize}`].avgLoss).times(new Decimal(1).minus(changeModifier)))
			]

			: closes.reduce((accu, close, index, closes) => {
				const previousClose = closes[index - 1];
				if (!previousClose) return accu;
				const change = Decimal.max(new Decimal(close).minus(previousClose));
				accu[change.toNumber() > 0 ? 0 : 1].push(change.abs().toNumber());
				// accu[0].push(Decimal.max(new Decimal(close).minus(previousClose), 0).toNumber());
				// accu[1].push(Decimal.max(new Decimal(previousClose).minus(close), 0).toNumber());
				return accu;
			}, [[], []])
			.reduce((changes, changeArr) => [...changes, getAverage(changeArr)], []);

		const rs = new Decimal(avgGain).div(avgLoss).toNumber();

		const rsi = (avgLoss === 0) ? 100 : new Decimal(100).minus(new Decimal(100).div(1 + rs)).toNumber();

		return { avgGain, avgLoss, rsi };


			// .map(({ closePrice }) => 100 / (openPrice / (closePrice - openPrice)))
			// .reduce((movementsByDirection, percentageMovement) => {
			// 	movementsByDirection[percentageMovement > 0 ? 0 : 1].push(percentageMovement);
			// 	return movementsByDirection;
			// }, [[], []])
			// .map((movementsInDirection) => avg(movementsInDirection));

	}

	// function ema(arr, stepSize) {
	// 	debugger;
	// 	const multiplier = new Decimal(2).div(stepSize + 1);
	// 	return arr.reduce((accu, num, index) => {
	// 		if (index === 0) return accu;
	// 		accu.push(multiplier.times(num).add(new Decimal(1).minus(multiplier)).times(accu.slice(-1)[0]).toNumber());
	// 		return accu;
	// 	}, []);
	// }

})();

// Binance charts show the initials MA, but they present an average, not a mean average
// tickData[`MA${stepSize}`] = avg(filteredAccu.reduce(([ smallest, largest ], { closePrice }) => [
// 	Math.min(closePrice, smallest), Math.max(closePrice, largest)
// ], [Infinity, 0]));

// function rsi(data, len) {
// 	var length = (!len) ? 13 : len - 1;
// 	var pl = [], arrsi = [];
// 	for (var i = 1; i < data.length; i++) {
// 		var diff = (data[i] - data[i - 1]) / data[i] * 100;
// 		pl.push(diff);
// 		if (pl.length >= length) {
// 			var gain = 0, loss = 0;
// 			for (let q in pl) {
// 				if (pl[q] < 0) loss += pl[q];
// 				if (pl[q] >= 0) gain += pl[q];
// 			}
// 			gain /= length;
// 			loss = (Math.abs(loss)) / length;
// 			let result = Number(100 - 100 / (1 + (gain / loss)));
// 			arrsi.push(result);
// 			var diff = (data[i] - data[i - 1]) / data[i] * 100;
// 			pl.push(diff);
// 			pl.splice(0, 1);
// 		}
// 	}
// 	return arrsi;
// }