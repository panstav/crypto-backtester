import {
	one_position_only,
	stochKnD,
	trending,
	keeper,
	stepsAwayFromPeak,
	either,
	optimist,
	daysPast
} from './indicators.js';

export const Pandit001 = {
	name: 'Pandit',
	advices: {
		buy: [
			stochKnD({ cross: 'bottom', bottom: 15, kOverD: 1.75 }),
			trending('up', { MA28: true, factor: 0.0000007 }),
			stepsAwayFromPeak(100)
		],
		sell: [
			keeper(3)
		]
	}
};

export const Pandit002 = {
	name: 'Pandit Prev',
	advices: {
		buy: [
			// one_position_only,
			stochKnD({ cross: 'bottom', bottom: 15, kOverD: 4.125 }),
			trending('up', { MA28: true, factor: 0.0000007 }),
			stepsAwayFromPeak(200)
		],
		sell: [
			keeper(3)
		]
	}
};

export const Pandit003 = {
	name: 'Pandit Next',
	advices: {
		buy: [
			// one_position_only,
			stochKnD({ cross: 'bottom', bottom: 15, kOverD: 4.125 }),
			trending('up', { MA28: true, factor: 0.0000007 }),
			(ticks) => ticks[ticks.length - 1].RSI < 41
		],
		sell: [
			keeper(1)
		]
	}
};

export const Base = {
	name: 'Test 001',
	advices: {
		buy: [
			one_position_only,
			stochKnD({ cross: 'bottom', bottom: 20, kOverD: 2.5 }),
			(ticks) => ticks[ticks.length - 1].RSI < 45
		],
		sell: [
			// optimist(10),
			either(
				optimist(10),
				daysPast(25)
			)
		]
	}
};

export default [ Base ];