import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;

import defaults from '../../lib/defaults.js';

import evaluate from '../../lib/evaluate.js';

import { Base as strategy } from '../../strategies/index.js';

export default function calcRecommendations(coins) {
	const { intervals } = defaults();

	return coins.reduce((accu, coin) => {
		intervals.forEach((interval) => {

			const { positions, trades } = evaluate({
				strategy,
				ticks: coin.ticksByInterval[interval],
				coinSymbol: coin.symbol,
				interval
			});

			if (positions.length
				&& positions[positions.length - 1].buyTime > new Date().getTime() - (3600000 * ({
					'1h': 2,
					'1d': 24 * 1.5
				}[interval]))
			) accu[interval].push({
				Symbol: coin.symbol,
				Link: `https://www.binance.com/en/trade/${coin.symbol}_USDT`,
				Timing: positions[positions.length - 1].humanDate,
				Timestamp: positions[positions.length - 1].buyTime,
				'Historical Profitability': new Decimal(trades.filter((trade) => trade.change$ > 0).length).div(trades.length).times(100).toDecimalPlaces(1).toNumber(),
				'Effective Volatility': `<7 ${heldFor('less', 7)} >45 ${heldFor('more', 45)}`
			});

			function heldFor(moreOrLess, days) {
				return trades.filter((trade) => {
						const daysHeld = trade.holdDuration / 24 / 60 / 60 / 1000;
						return moreOrLess === 'more'
							? daysHeld > days
							: daysHeld < days;
					}
				).length;
			}

		});

		return accu;
	}, intervals.reduce((accu, interval) => ({ ...accu, [interval]: [] }), {}));

}