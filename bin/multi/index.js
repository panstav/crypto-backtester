import jsonFile from 'jsonfile';

import getDefaults from '../../lib/defaults.js';
import getCandleData from '../../lib/get-candles.js';

import getStrategyTemplate from './get-strategy-template.js';
import backtestStrategy from './backtest-strategy.js';
import getStrategyVariants from './get-strategy-variants.js';

import getLogger from '../../lib/log.js';

const intervals = ['1h', '1d', '1w'];

let maxCoins;
maxCoins = 1;

const strategyTemplate = getStrategyTemplate();

(async (config) => {

	const log = getLogger(config.logTypes);

	// limit coins to maxCoins
	const coins = config.coins.slice(0, maxCoins);

	// go coin by coin
	await forEachAsync(coins, async (symbol) => {

		// get all strategy variants by using the same strategy template with different values
		const strategyVariants = getStrategyVariants(strategyTemplate);
		const coin = { ticks: {} };

		// go interval by interval
		await forEachAsync(intervals, async (interval) => {
			log('fetching', `fetching ${symbol} ${interval}`);
			// enrich ticks
			coin.ticks[interval] = await getCandleData(symbol, interval);
		});

		await forEachAsync(strategyVariants, async ({ name, strategy, variant }, index) => {
			const trades = backtestStrategy(coin.ticks, strategy, variant);
			// qaTrades(trades);

			const variantSummary = {
				variant: name,
				openTrades: trades.filter(({ open }) => open).length,
				closedTrades: trades.filter(({ open }) => !open).length,
				config: variant
			};

			await jsonFile.writeFile(`./bin/multi/reports/${symbol}.json`, variantSummary, { spaces: 2, flag: 'a' });
			log('variant', `${symbol} variant ${(index+1+'').padStart(3, 0)}/${(strategyVariants.length+'').padStart(3, 0)}`);
		});

	});

	debugger;

})(getDefaults({
	isUpdatingHistory: true,
	logTypes: {
		fetching: true,
		variant: true,
		tick: false
	}
}));

function forEachAsync(array, callback) {
	return array.reduce((promise, item, index) => {
		return promise.then(() => callback(item, index));
	}, Promise.resolve());
}

function qaTrades(trades) {

	const qa = getHighestAndLowestPerDay();
	debugger;

	function getHighestAndLowestPerDay() {
		return trades.reduce((accu, trade) => {
			const buyDate = dateKey(trade.buyHumanDate);
			const buysAtDay = accu.buys[buyDate] || [];
			accu.buys[buyDate] = smallestAndBiggest(buysAtDay.concat(trade.buyPrice));
			if (trade.open) return accu;
			const sellDate = dateKey(trade.sellHumanDate);
			const sellsAtDay = accu.sells[sellDate] || [];
			accu.sells[sellDate] = smallestAndBiggest(sellsAtDay.concat(trade.sellPrice));
			return accu;
		}, { buys: {}, sells: {} });
	}

	function smallestAndBiggest(arr) {
		return [Math.min(...arr), Math.max(...arr)];
	}
	function dateKey(date) {
		return flipDate(noHours(date));
		function noHours(date) {
			return date.split(' ')[0];
		}
		function flipDate(date) {
			return date.split('/').reverse().join('/');
		}
	}

}