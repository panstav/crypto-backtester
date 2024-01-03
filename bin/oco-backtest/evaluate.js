import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

import getDefaults from '../../lib/defaults.js';
import getLogger from '../../lib/log.js';
import { getAverage } from '../../lib/math.js';

const interval = '1h';

export default function evaluate({ strategy, symbol, ticks }) {

	const {
		timestampToTradeAfter: firstTimestampToEvaluate,
		numTicksToEvaluate: proposedNumTicks,
		initialCapital,
		tradeFractionPercision,
		stepSize
	} = getDefaults();
	const numTicksToEvaluate = proposedNumTicks || ticks[interval].length;

	const log = getLogger();

	const positions = [];
	const trades = [];
	const wallet = {
		USD: initialCapital,
		[symbol]: 0
	};

	simulate_history_onto_strategy();

	return { positions, trades, ticks, wallet };

	function simulate_history_onto_strategy() {

		ticks[interval]
			.slice(-1 * numTicksToEvaluate)
			.reduce((evaluatedTicks, nextTick) => {

				// have the strategy utilize "today's" tickData as well
				evaluatedTicks.push(nextTick);

				// conditions to avoid trading
				if (
					// if current tick is before first tick to evaluate
					nextTick.closeTime < firstTimestampToEvaluate
					// if all history is to be evaluated and we're at the first few
					|| (numTicksToEvaluate > stepSize * 2 && evaluatedTicks.length < (stepSize * 2))
				) return evaluatedTicks;

				if (positions.filter(({ resolved }) => !resolved).length > 1) {
					throw new Error('More than one open position at a time is not supported by this evaluator.');
				}

				const tradingPrice = new Decimal(getAverage([nextTick.highPrice, nextTick.lowPrice])).toNumber();
				const currentTime = new Decimal(nextTick.closeTime).minus(nextTick.openTime).div(2).add(nextTick.openTime).toNumber();
				const openPosition = positions.find(({ resolved }) => !resolved);

				if (!openPosition) {
					if (strategy.entry(evaluatedTicks)) 							buy(tradingPrice, currentTime, nextTick);
				} else {
					if (strategy.exit(evaluatedTicks, openPosition)) 	sell(tradingPrice, currentTime, nextTick);
				}

				return evaluatedTicks;
			}, []);

	}

	function buy(atPrice, atTime, { humanDate }) {
		const numberOfCoins = new Decimal(wallet.USD).div(atPrice).toDecimalPlaces(tradeFractionPercision).toNumber();
		wallet.USD = new Decimal(wallet.USD).minus(new Decimal(atPrice).times(numberOfCoins)).toNumber();
		wallet[symbol] = new Decimal(wallet[symbol]).add(numberOfCoins).toNumber();
		positions.push({ buyTime: atTime, humanBuyTime: humanDate, buyPrice: atPrice, numberOfCoins });
		log('action', `${'BUY'.bold}: ${symbol}${numberOfCoins} for $${atPrice} each`);
	}

	function sell(atPrice, atTime, { humanDate }) {

		const { buyPrice, buyTime, humanBuyTime, numberOfCoins: coinsInPosition } = positions.find(({ resolved }) => !resolved);

		// mark trade
		trades.push({
			coinsTraded: coinsInPosition,
			buyPrice,
			sellPrice: atPrice,
			humanSellTime: humanDate,
			buyTime,
			humanBuyTime,
			sellTime: atTime,
			holdDuration: new Decimal(atTime).minus(buyTime).toNumber(),
			change$: new Decimal(atPrice).times(coinsInPosition).minus(new Decimal(buyPrice).times(coinsInPosition)).toDecimalPlaces(2).toNumber()
		});

		positions.map((position) => {
			position.resolved = true;
			return position;
		});
		wallet.USD = new Decimal(wallet.USD).add(new Decimal(coinsInPosition).times(atPrice)).toNumber();
		wallet[symbol] = wallet[symbol] - coinsInPosition;
		log('action', `${'SELL'.bold}: ${symbol}${coinsInPosition} for $${atPrice} each`);
	}

}