import Decimal from 'decimal.js';

import defaults from '../lib/defaults.js';
import getLogger from '../lib/log.js';

import getCandleData from '../lib/get-candles.js';
import strategies from '../strategies/index.js';
import evaluate from '../lib/evaluate.js';

const INTERVAL = '1h';
const MAX_HOLD_TIME = 24 * 5; // 5 days
const HIGH_ENOUGH_MODIFIER = 1.1;

(async ({ coins, logTypes }) => {
	const log = getLogger(logTypes);

	await Promise.all(coins.map(async (coinSymbol, index) => {

		// coin by coin - get enriched relevant ticks
		const richTicks = await getCandleData(coinSymbol, INTERVAL);

		// simulate coin history on chosen strategies
		return strategies.forEach((strategy) => evaluate({
			strategy,
			coinSymbol,
			interval: INTERVAL,
			ticks: richTicks
		}));

		function getOpportunities({ anti = false, filterFn = () => true } = {}) {
			return richTicks.filter(filterFn)
				.filter((tick) => tick.hasOwnProperty('StochRSI_02_SmoothK'))
				.reduce((accu, currentTick, index, array) => {

					const sellOpportunity = array
						.slice(index + 1, index + 1 + MAX_HOLD_TIME)
						.find((itteratedTick) => (new Decimal(currentTick.lowPrice).times(HIGH_ENOUGH_MODIFIER).lessThan(itteratedTick.highPrice)));

					if (anti) {
						if (!sellOpportunity) accu.push(currentTick);
						return accu;
					}

					if (sellOpportunity) accu.push({
						buyTick: currentTick,
						sellTick: sellOpportunity,
						RSIs: [currentTick.RSI, sellOpportunity.RSI, new Decimal(sellOpportunity.RSI).minus(currentTick.RSI).toNumber()],
						hoursHeld: new Decimal(sellOpportunity.closeTime).minus(currentTick.closeTime).div(3600000).toNumber()
					});
					return accu;
				}, []);
		}

		const opportunities = getOpportunities();

		const distributionOfRsiOnset = opportunities
			.reduce((accu, opportunity) => {
				const onset = Math.round(opportunity.RSIs[0]) + '';

				let existingCounter = accu.find((counter) => counter.onset === onset);

				if (!existingCounter) {
					accu.push({ onset, count: 1 });
					return accu;
				}

				return accu.map((counter) => {
					if (counter.onset !== onset) return counter;
					counter.count++;
					return counter;
				});
			}, [])
			.sort((a, b) => b.count - a.count);

		const nonOpportunities = getOpportunities({
			anti: true,
			filterFn: (tick) => tick.RSI < 40
		});

		const percisionOfRsiOffset = getPercisionOfRsiOffset(40);

		debugger;

		function getNumberOfCorrelatingOpportunities(offset) {

			const offsetAbove = distributionOfRsiOnset.reduce((accu, counter) => {
				accu[counter.onset < offset ? 'above' : 'below'] += counter.count;
				return accu;
			}, { above: 0, below: 0 });

			return new Decimal(100).minus(new Decimal(100).div(new Decimal(offsetAbove.above).div(offsetAbove.below))).toNumber();
		}

		function getOverallPercisionOfRsiOffset(offset) {



		}

		function getPercisionOfRsiOffset(offset) {

			const offsetAbove = distributionOfRsiOnset.reduce((accu, counter) => {
				accu[counter.onset < offset ? 'above' : 'below'] += counter.count;
				return accu;
			}, { above: 0, below: 0 });

			return new Decimal(100).minus(new Decimal(100).div(new Decimal(offsetAbove.above).div(offsetAbove.below))).toNumber();
		}

		debugger;

		// const distributionOfRsiOffset = opportunities
		// 	.reduce((accu, opportunity) => {
		// 		const offset = Math.round(opportunity.RSIs[2]) + '';
		//
		// 		let existingCounter = accu.find((counter) => counter.offset === offset);
		//
		// 		if (!existingCounter) {
		// 			accu.push({ offset, count: 1 });
		// 			return accu;
		// 		}
		//
		// 		return accu.map((counter) => {
		// 			if (counter.offset !== offset) return counter;
		// 			counter.count++;
		// 			return counter;
		// 		});
		// 	}, [])
		// 	.sort((a, b) => b.count - a.count);
		//
		// const offsetAbove = distributionOfRsiOffset.reduce((accu, counter) => {
		// 	accu[counter.offset > 5 ? 'above' : 'below'] += counter.count;
		// 	return accu;
		// }, { above: 0, below: 0 });

	}));
})(defaults({
	isUpdatingHistory: false,
	logTypes: { 'fetching': true }
}));