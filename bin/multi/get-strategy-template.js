import Decimal from 'decimal.js';

import behaviours from './behaviours.js';

const intervalCombinations = ['1w,1d,1h']; // ['1w,1d', '1w,1d,1h', '1d,1h', '1d', '1h'];

export default function getStrategyTemplate() {

	const variedProperties = {
		profitPercentageGrab: [5],
		stochThreshold: [10],
		topLevelPatience: [0, 1, 2, 3, 4, 5],
	};

	variedProperties.behaviourByInterval = intervalCombinations.reduce((accu, intervalStr) => {

		const intervals = intervalStr.split(',');

		for (let j = 0; j < Object.keys(behaviours).length; j++) {

			const firstDegreeCombination = {};
			const firstBehaviour = Object.keys(behaviours)[j];

			firstDegreeCombination[intervals[0]] = firstBehaviour;

			if (intervals.length === 1) {
				accu.push(firstDegreeCombination);
				continue;
			}

			for (let k = 0; k < Object.keys(behaviours).length; k++) {

				const secondDegreeCombination = Object.assign({}, firstDegreeCombination);
				const secondBehaviour = Object.keys(behaviours)[k];

				secondDegreeCombination[intervals[1]] = secondBehaviour;

				if (intervals.length === 2) {
					accu.push(secondDegreeCombination);
					continue;
				}

				for (let l = 0; l < Object.keys(behaviours).length; l++) {

					const thirdDegreeCombination = Object.assign({}, secondDegreeCombination);
					const thirdBehaviour = Object.keys(behaviours)[l];

					thirdDegreeCombination[intervals[2]] = thirdBehaviour;

					accu.push(thirdDegreeCombination);
				}
			}
		}

		return accu;
	}, []);

	return {
		name: 'DeepStoch',
		strategy: ({ profitPercentageGrab, behaviourByInterval, stochThreshold, topLevelPatience }) => {

			return {
				buy: (ticksByInterval, position) => {

					// if (position) {
					// 	return false;
					// }

					let buy;
					const consideredIntervals = Object.keys(ticksByInterval);

					if (consideredIntervals.includes('1w')) {

						if (!consideredIntervals.includes('1d') && !consideredIntervals.includes('1h')) {
							return behaviours[behaviourByInterval['1w']](ticksByInterval['1w'], stochThreshold);
						}

						for (let i = 0; i <= topLevelPatience; i++) {
							if (behaviours[behaviourByInterval['1w']](ticksByInterval['1w'].slice(i), stochThreshold)) {
								buy = true;
								break;
							}
						}

						if (!buy) {
							return false;
						}

					}

					if (consideredIntervals.includes('1d')) {

						if (!consideredIntervals.includes('1h')) {
							return behaviours[behaviourByInterval['1d']](ticksByInterval['1d'], stochThreshold);
						}

						for (let i = 0; i <= topLevelPatience; i++) {
							if (behaviours[behaviourByInterval['1d']](ticksByInterval['1d'].slice(i), stochThreshold)) {
								buy = true;
								break;
							}
						}

						if (!buy) {
							return false;
						}

					}

					if (consideredIntervals.includes('1h')) {
						return behaviours[behaviourByInterval['1h']](ticksByInterval['1h'], stochThreshold);
					}

					return true;

				},

				sell: (ticksByInterval, position) => {
					const lastTick = getLastTickOfSmallestInterval(ticksByInterval);
					const aimPrice = new Decimal(position.buyPrice).times(new Decimal(profitPercentageGrab).div(100)).add(position.buyPrice).toNumber();

					return aimPrice < lastTick.openPrice && aimPrice < lastTick.closePrice;
				}
			}

		},

		variedProperties
	};
}

function getLastTickOfSmallestInterval (ticksByInterval) {

	const intervalsConsidered = Object.keys(ticksByInterval).sort((a, b) => {
		// 1h before 1d before 1w
		// 1w after 1d after 1h
		if (a === '1h') return -1;
		if (b === '1h') return 1;
		if (a === '1d') return -1;
		if (b === '1d') return 1;
		if (a === '1w') return -1;
		if (b === '1w') return 1;
	});

	return ticksByInterval[intervalsConsidered[0]][ticksByInterval[intervalsConsidered[0]].length - 1];
}