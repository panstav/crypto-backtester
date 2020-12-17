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

import strategies from './lib/strategies.js';
import getLogger from './lib/log.js';

import {
	MA as testMA
} from './lib/test.js';

const log = getLogger(['strategy-summary', 'final-strategy-summary']);
// const log = getLogger(['action', 'tick-summary', 'strategy-summary', 'final-strategy-summary']);

const endpoint = 'https://www.binance.com/api/v1/klines';
const maxBinanceCandles = 1000;
const numTickToEvaluate = 365;
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

	// TODO: Add order-book tracking and strategizing
	// for range bidding, etc.

	// go through list of coins
	return Promise.all(coins.map(async (coinSymbol) => {

		// go through list of timeframes
		return Promise.all(intervals.map(async (interval) => {

			// if corresponding file exists - only update it with missing data
			// otherwise go for the max data pull
			const fileName = `./data/${coinSymbol}-${
				intervals.reduce((accu, stepSize) => accu ? `${accu}-${stepSize}` : `${stepSize}`, '')
			}.json`;

			const richTicks = await jsonFile.readFile(fileName);

			// const rawTicks = await got(getEndpoint(coinSymbol, interval, maxBinanceCandles)).json();
			// const richTicks = interpret(rawTicks);

			// console.table(richTicks
			// 	.slice(-20) // 100-103
			// 	.map(({ humanDate, RSI, StochRSI }) => ({ humanDate, RSI, StochRSI }))
			// );

			// const fileName = `./data/${coinSymbol}-${
			// 	intervals.reduce((accu, stepSize) => accu ? `${accu}-${stepSize}` : `${stepSize}`, '')
			// }.json`;
			//
			// await jsonFile.writeFile(fileName, richTicks, { spaces: 4 });

			// const strategy = {
			// 	indicators: ['closePrice'],
			// 	definition: [
			// 		{
			// 			priority: 0.9,
			// 			isTriggering: (ticks, positions) => {
			// 				if (ticks.length < 2) return false;
			// 				// current close price is higher than previous
			// 				return (ticks[ticks.length - 1].closePrice > ticks[ticks.length - 2].closePrice);
			// 			},
			// 			setEffect: (wallet, tick) => {
			// 				// buy coin for 10% of total liquid assets
			// 				const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
			// 				wallet.buy(new Decimal(totalPriceInUSD).div(tick.closePrice).toNumber(), tick);
			// 			}
			// 		},{
			// 			priority: 1,
			// 			isTriggering: (ticks, positions) => {
			// 				if (ticks.length < 14) return false;
			// 				// trigger if current close is lowest for a streak of 14 ticks
			// 				return Decimal.min(...ticks.slice(-14).map(({ closePrice }) => closePrice)).toNumber() === ticks[ticks.length - 1].closePrice;
			// 			},
			// 			setEffect: (wallet, tick) => {
			// 				// sell 100% of coin TODO: Limit trade size or randomize a spread
			// 				wallet.sell(wallet[coinSymbol], tick);
			// 			}
			// 		}
			// 	]
			// };
			//
			// const strategies = [stragegy];
			//
			// strategies.forEach((stragegy) => {
			// 	// validate strategies
			// 	// no duplicate priorities
			// });
			//
			Object.keys(strategies).forEach(((strategyName) => evaluate(strategies[strategyName], richTicks, strategyName)));

			function evaluate({ definition, requirements }, ticks, strategyName) {
				definition.push({ isTriggering: () => true, setEffect: () => {}, priority: 0 });

				const positions = [];
				const trades = [];
				const wallet = {
					USD: 10000,
					[coinSymbol]: 0,
					buy: (coinsToBuy, { closePrice, closeTime }) => {
						log('action', `BUY: $${closePrice} => ${coinSymbol}${coinsToBuy}\n`);
						positions.push({ buyTime: closeTime, buyPrice: closePrice, coinsBought: coinsToBuy, tradedBack: 0 });
						wallet.USD = new Decimal(wallet.USD).minus(new Decimal(closePrice).times(coinsToBuy)).toNumber();
						wallet[coinSymbol] = new Decimal(wallet[coinSymbol]).add(coinsToBuy).toNumber();
					},
					sell: (coinsToSell, { closePrice: sellPrice, closeTime }) => {
						log('action', `SELL: ${coinSymbol}${coinsToSell} => $${sellPrice}\n`);
						const coinsLeft = positions.reduce((coinsLeftForSell, { buyPrice, buyTime, coinsBought, tradedBack }, index) => {
							if (coinsLeftForSell === 0 || coinsBought === tradedBack) return coinsLeftForSell;
							const coinsToMarkTrade = Decimal.min(coinsLeftForSell, new Decimal(coinsBought).minus(tradedBack).toNumber()).toNumber();

							positions[index].tradedBack = new Decimal(tradedBack).add(coinsToMarkTrade).toNumber();
							if (positions[index].tradedBack === positions[index].coinsBought) positions[index].resolved = true;

							trades.push({ coinsTraded: coinsToMarkTrade, buyPrice, sellPrice, buyTime, sellTime: closeTime });

							return new Decimal(coinsLeftForSell).minus(coinsToMarkTrade).toNumber();
						}, coinsToSell);

						const coinsBeingSold = new Decimal(coinsToSell).minus(coinsLeft);
						wallet.USD = new Decimal(wallet.USD).add(new Decimal(coinsBeingSold).times(sellPrice)).toNumber();
						wallet[coinSymbol] = new Decimal(wallet[coinSymbol]).minus(coinsBeingSold).toNumber();
					}
				};

				ticks
					.slice(-1 * numTickToEvaluate)
					.reduce((accuBackTicks, tick) => {
						accuBackTicks.push(tick);

						// TODO: interpret only previous ticks
						// TODO: buy / sell price should be half way previous and current close
						definition
							.filter(({ isTriggering }) => isTriggering(accuBackTicks, positions))
							.sort((a, b) => b.priority - a.priority)[0]
							.setEffect(wallet, coinSymbol, tick);

						log('tick-summary', { USD: wallet.USD, [coinSymbol]: wallet[coinSymbol] });
						log('tick-summary', `${tick.humanDate} 1${coinSymbol} $${tick.closePrice}\n`);
						return accuBackTicks;
					}, []);

				log('strategy-summary', positions.filter(({ resolved }) => !resolved), 'table');
				log('strategy-summary', trades.map(({ buyPrice, sellPrice }) => {
					const change = new Decimal(100).div(new Decimal(buyPrice).div(sellPrice)).minus(100);
					return {
						gain: Decimal.max(0, change).toDecimalPlaces(1).toNumber(),
						loss: Decimal.min(0, change).abs().toDecimalPlaces(1).toNumber(),
						buyPrice,
						sellPrice
					}
				}), 'table');
				log('final-strategy-summary', `${strategyName}\nWallet total value: $${wallet.USD + new Decimal(wallet[coinSymbol]).times(ticks[ticks.length - 1].closePrice).toNumber()}`);

			}
			
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