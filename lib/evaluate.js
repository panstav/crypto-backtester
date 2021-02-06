import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

import getLogger from './log.js';
import { getAverage } from './math.js';
import humanizeDate from './humanize-date.js';

import config from '../config.js';

export default function evaluate({ name: strategyName, advices }, { coinSymbol, ticks, initialCapital, numTicksToEvaluate, percentageToRisk, percentageToGrab }) {
	if (!numTicksToEvaluate) numTicksToEvaluate = ticks.length;

	const log = getLogger();

	const positions = [];
	const trades = [];
	const wallet = {
		USD: initialCapital,
		[coinSymbol]: 0
	};

	simulate_history_onto_strategy();
	log_strategyXcoin_results();

	return { positions, trades, ticks, wallet };

	function simulate_history_onto_strategy() {

		ticks
			.slice(-1 * numTicksToEvaluate)
			.reduce((ticksHistory, tick) => {

				// have the strategy utilize "today's" tickData as well
				ticksHistory.push(tick);

				// avoid the first few ticks if we start from beginning of history
				if (tick.closeTime < config.tradingStartTime || (numTicksToEvaluate === ticks.length && ticksHistory.length < (config.stepSize * 2))) return ticksHistory;

				if (advices.buy.every((term) => term(ticksHistory, positions))) trade(buy, tick, percentageToRisk);

				const hasOpenPositions = positions.some(({ resolved }) => !resolved);
				if (hasOpenPositions && advices.sell.every((term) => term(ticksHistory, positions))) trade(sell, tick, percentageToGrab);

				log('tick-summary', `\n${tick.humanDate} 1${coinSymbol} == $${tick.closePrice}`);
				log('tick-summary', { USD: wallet.USD, [coinSymbol]: wallet[coinSymbol] });

				return ticksHistory;
			}, []);

		function trade(direction, tick, percentage) {
			const totalPriceInUSD = new Decimal(wallet.USD).div(100).times(percentage).toNumber();
			const atPrice = getAverage([tick.openPrice, tick.closePrice]);
			direction(new Decimal(totalPriceInUSD).div(atPrice).toNumber(), atPrice, tick.humanDate);
		}

	}

	function log_strategyXcoin_results() {
		log('final-strategy-summary', `\n${coinSymbol} => ${strategyName}`, { style: 'bold' });

		const summerizedTrades = summerizeTrades(trades);
		log('strategy-summary', summerizedTrades, { method: 'table' });

		const unresolvePositions = positions.filter(({ resolved }) => !resolved);
		log('strategy-summary', (unresolvePositions.length ? unresolvePositions : 'No unresolved positions'), { method: unresolvePositions.length ? 'table' : 'log' })

		const finalWalletWorth = new Decimal(wallet[coinSymbol]).times(ticks[ticks.length - 1].closePrice).add(wallet.USD).toNumber();
		log('final-strategy-summary', `Wallet total value: $${finalWalletWorth}`);
		log('final-strategy-summary', `${new Decimal(100).div(new Decimal(initialCapital).div(finalWalletWorth)).minus(100).toDecimalPlaces(1).toNumber()}% within ${numTicksToEvaluate} ticks`);

		return { summerizedTrades, positions };
	}

	function buy(numberOfCoins, buyPrice, humanDate) {
		wallet.USD = new Decimal(wallet.USD).minus(new Decimal(buyPrice).times(numberOfCoins)).toNumber();
		wallet[coinSymbol] = new Decimal(wallet[coinSymbol]).add(numberOfCoins).toNumber();
		positions.push({ buyTime: humanDate, buyPrice, coinsBought: numberOfCoins, tradedBack: 0 });
		log('action', `${'BUY'.bold}: ${coinSymbol}${numberOfCoins} for $${buyPrice} each`);

		if (humanDate.includes('9/1/2021')) {
			debugger;
		}

	}

	function sell(coinsToSell, sellPrice, humanDate) {
		coinsToSell = Decimal.min(coinsToSell, wallet[coinSymbol]).toNumber();

		// sell on all relevant positions and retrieve a number of coins that
		const coinsLeft = positions
			.reduce((coinsLeftToSell, { buyPrice, buyTime, coinsBought, tradedBack, resolved }, index) => {
				if (resolved || coinsLeftToSell === 0) return coinsLeftToSell;

				// get number of coins to sell under current position
				const untradedCoinsInPosition = Decimal.min(coinsLeftToSell, new Decimal(coinsBought).minus(tradedBack).toNumber()).toNumber();

				// update position
				positions[index].tradedBack = new Decimal(tradedBack).add(untradedCoinsInPosition).toNumber();
				if (positions[index].tradedBack === positions[index].coinsBought) positions[index].resolved = true;

				// mark trade
				trades.push({ coinsTraded: untradedCoinsInPosition, buyPrice, sellPrice, buyTime, sellTime: humanDate, change$: new Decimal(sellPrice).times(untradedCoinsInPosition).minus(new Decimal(buyPrice).times(untradedCoinsInPosition)).toDecimalPlaces(2).toNumber() });

				// set accumolator to coins yet to be traded if any were left
				return new Decimal(coinsLeftToSell).minus(untradedCoinsInPosition).toNumber();
			}, coinsToSell);

		const coinsBeingSold = new Decimal(coinsToSell).minus(coinsLeft);

		wallet.USD = new Decimal(wallet.USD).add(new Decimal(coinsBeingSold).times(sellPrice)).toNumber();
		wallet[coinSymbol] = new Decimal(wallet[coinSymbol]).minus(coinsBeingSold).toNumber();
		log('action', `${'SELL'.bold}: ${coinSymbol}${coinsBeingSold} for $${sellPrice} each`);
	}

	function summerizeTrades(trades) {
		return trades.map(({ coinsTraded, buyPrice, sellPrice, buyTime, sellTime, change$ }) => {
			const change = new Decimal(100).div(new Decimal(buyPrice).div(sellPrice)).minus(100);
			return {
				coinsTraded,
				gain: Decimal.max(0, change).toDecimalPlaces(1).toNumber(),
				loss: Decimal.min(0, change).abs().toDecimalPlaces(1).toNumber(),
				buyPrice,
				sellPrice,
				change$,
				buyTime: humanizeDate(buyTime, withHours),
				sellTime: humanizeDate(sellTime, withHours)
			};
		});
	}

}