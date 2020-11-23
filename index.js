import jsonFile from 'jsonfile';
import got from 'got';
import queryString from 'query-string';

import TradingSignals from 'trading-signals';
const { RSI } = TradingSignals;

import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

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
	// go through list of coins
	return Promise.all(coins.map(async (coinSymbol) => {

		// go through list of timeframes
		return Promise.all(intervals.map(async (interval) => {

			// if corresponding file exists - only update it with missing data
			// otherwise go for the max data pull

			const response = await got(getEndpoint(coinSymbol, interval, maxBinanceCandles)).json();

			// backtest with different levels of downtrend tolerance
			return Promise.all(torelatedDowntrends.map((toleratedDowntrend) => {

				const result = response.reduce((accu, tickRaw) => {

					// init nested refined data object
					const tickData = {
						openTime: Number(tickRaw[0]),
						closeTime: Number(tickRaw[6]),
						openPrice: Number(tickRaw[1]),
						closePrice: Number(tickRaw[4])
					};

					// add human readable date
					const date = new Date(tickData.openTime);
					tickData.humanDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

					// ensure we have enough candles for the next calculations
					if (accu.length < stepSize) return next();

					const filteredAccu = accu.slice(-1 * (stepSize - 1));
					const filteredAccuWithCurrentTick = filteredAccu.concat(tickData);

					// correct so-called MeanAverage calculation
					const closePricesOfFilteredAccuWithCurrentTick = filteredAccuWithCurrentTick.map(({ closePrice }) => closePrice);
					tickData[`MA${stepSize}`] = avg(closePricesOfFilteredAccuWithCurrentTick);

					tickData[`RSI${stepSize}`] = rsi(filteredAccuWithCurrentTick);

					function rsi(ticks) {

					}

					// function rsi01() {
					// 	const [avgGain, avgLoss] = filteredAccu
					// 		.map(({ openPrice, closePrice }, index, arr) => {
					// 			if (index === 0) return null;
					// 			const previousClosePrice = arr[index - 1].closePrice;
					// 			return new Decimal(100).div(
					// 				new Decimal(previousClosePrice).div(
					// 					new Decimal(closePrice).minus(
					// 						previousClosePrice
					// 					)
					// 				)
					// 			).toNumber();
					// 		})
					// 		.reduce((movementsByDirection, percentageMovement) => {
					// 			if (!percentageMovement) return movementsByDirection;
					// 			movementsByDirection[percentageMovement > 0 ? 0 : 1].push(percentageMovement);
					// 			return movementsByDirection;
					// 		}, [[], []])
					// 		.map((movementsInDirection) => avg(movementsInDirection));
					//
					// 	tickData.avgs = [avgGain, avgLoss];
					// 	return new Decimal(100).minus(new Decimal(100).div(new Decimal(1).add(new Decimal(avgGain).div(new Decimal(avgLoss).abs()))));
					// }

					// let prevPosition = accu.length - filteredAccu.length - 1;
					// if (prevPosition < 0) return next();
					// tickData[`RSI${stepSize}`] = rsi02(filteredAccuWithCurrentTick, accu[prevPosition].closePrice);
					// function rsi02(ticks) {
					// 	let previousClosePrice = ticks[0].closePrice;
					//
					// 	let gains = new Decimal(0);
					// 	let losses = new Decimal(0);
					//
					// 	for (let i = 0, n = ticks.length; i < n; i++) {
					// 		const tick = ticks[i];
					//
					// 		if (i < 14) {
					// 			if (tick.closePrice < previousClosePrice) {
					// 				losses = losses.add(new Decimal(previousClosePrice).minus(tick.closePrice));
					// 			} else if (tick.closePrice > previousClosePrice) {
					// 				gains = gains.add(new Decimal(tick.closePrice).minus(previousClosePrice));
					// 			}
					//
					// 			if (i === 13) {
					// 				losses = losses.div(14);
					// 				gains = gains.div(14);
					// 			}
					// 		} else {
					// 			let gain = 0;
					// 			let loss = 0;
					// 			if (tick.closePrice < previousClosePrice) {
					// 				loss = new Decimal(previousClosePrice).minus(tick.closePrice).toNumber();
					// 			} else if (tick.closePrice > previousClosePrice) {
					// 				gain = new Decimal(tick.closePrice).minus(previousClosePrice);
					// 			}
					// 			losses = losses.times(13).add(loss).div(14);
					// 			gains = gains.times(13).add(gain).div(14);
					// 		}
					//
					// 		previousClosePrice = tick.closePrice;
					// 	}
					//
					// 	const rs = gains.div(losses);
					// 	return new Decimal(100).minus(new Decimal(100).div(new Decimal(1).add(rs))).toNumber();
					// }

					// calc StochRSI

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

	}));

	function getEndpoint(symbol, interval, limit) {
		const qs = queryString.stringify({ symbol: `${symbol}USDT`, interval, limit });
		return `${endpoint}?${qs}`;
	}

	function avg(arr) {
		return arr.reduce((accu, num) => accu.add(num), new Decimal(0)).div(arr.length).toNumber();
	}

})();

// Binance charts show the initials MA, but they present an average, not a mean average
// tickData[`MA${stepSize}`] = avg(filteredAccu.reduce(([ smallest, largest ], { closePrice }) => [
// 	Math.min(closePrice, smallest), Math.max(closePrice, largest)
// ], [Infinity, 0]));

// This calculation is RSI based on Open and Close differences, not a Close comparison
// const [avgGain, avgLoss] = filteredAccu
// 	.map(({ openPrice, closePrice }) => 100 / (openPrice / (closePrice - openPrice)))
// 	.reduce((movementsByDirection, percentageMovement) => {
// 		movementsByDirection[percentageMovement > 0 ? 0 : 1].push(percentageMovement);
// 		return movementsByDirection;
// 	}, [[], []])
// 	.map((movementsInDirection) => avg(movementsInDirection));