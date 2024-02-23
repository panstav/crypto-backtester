import Decimal from 'decimal.js';

import getLogger from '../../lib/log.js';

export default function backtestStrategy(ticksByInterval, strategy, variant) {

	const log = getLogger();

	const trades = [];

	ticksByInterval['1h'].reduce((accu, tick) => {

		log('tick', `${tick.humanDate} ${(trades.filter(({ open }) => open).length + '').padStart(3, '0')} open trades, ${(trades.filter(({ open }) => !open).length + '').padStart(3, '0')} closed trades`);

		const openTrades = trades.filter((trade) => trade.open);

		const firstDegreeTicksHistory = accu.slice(-1 * 24);
		firstDegreeTicksHistory.push(tick);
		if (firstDegreeTicksHistory.length < 24) return firstDegreeTicksHistory;

		const latestTicksByInterval = {};

		if (variant.behaviourByInterval['1h']) latestTicksByInterval['1h'] = firstDegreeTicksHistory;

		if (variant.behaviourByInterval['1d']) {
			const indexOfLateDayTick = ticksByInterval['1d'].findIndex((tick) => tick.closeTime > firstDegreeTicksHistory[firstDegreeTicksHistory.length - 1].closeTime);
			if (indexOfLateDayTick < 25) return firstDegreeTicksHistory;

			const secondDegreeTicksHistory = ticksByInterval['1d'].slice(indexOfLateDayTick - 23, indexOfLateDayTick + 1);

			if (secondDegreeTicksHistory.length < 24) return firstDegreeTicksHistory;
			latestTicksByInterval['1d'] = secondDegreeTicksHistory;
		}

		if (variant.behaviourByInterval['1w']) {
			const indexOfLateWeekTick = ticksByInterval['1w'].findIndex((tick) => tick.closeTime > firstDegreeTicksHistory[firstDegreeTicksHistory.length - 1].closeTime);
			if (indexOfLateWeekTick < 25) return firstDegreeTicksHistory;

			const thirdDegreeTicksHistory = ticksByInterval['1w'].slice(indexOfLateWeekTick - 23, indexOfLateWeekTick + 1);

			if (thirdDegreeTicksHistory.length < 24) return firstDegreeTicksHistory;
			latestTicksByInterval['1w'] = thirdDegreeTicksHistory;

		}

		// iterate through open trades and check whether they should be closed
		if (openTrades.length) {
			openTrades.forEach((position) => {

				// check whether there's a selling setup according to the strategy
				if (strategy.sell(latestTicksByInterval, position)) {
					position.sellTick = tick;
					position.sellPrice = new Decimal(tick.closePrice).minus(tick.openPrice).abs().div(2).add(Math.min(tick.openPrice, tick.closePrice)).toNumber();
					position.sellTime = tick.closeTime;
					position.sellHumanDate = tick.humanDate;
					position.open = false;
					position.profitPercentage = new Decimal(position.sellPrice).minus(position.buyPrice).div(position.buyPrice).times(100).toNumber();
					position.durationDays = new Decimal(position.sellTime).minus(position.buyTime).div(1000).div(60).div(60).div(24).toNumber();
				}
			});
		}

		// check whether there's a buying setup according to the strategy
		if (strategy.buy(latestTicksByInterval, !!openTrades.length)) {
			trades.push({
				buyTick: tick,
				buyPrice: new Decimal(tick.closePrice).minus(tick.openPrice).abs().div(2).add(Math.min(tick.openPrice, tick.closePrice)).toNumber(),
				buyTime: tick.closeTime,
				buyHumanDate: tick.humanDate,
				open: true
			});
		};

		return firstDegreeTicksHistory;
	}, []);

	return trades;

}