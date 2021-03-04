import Decimal from 'decimal.js';

import {
	close_price_rises_in_one_tick,
	close_price_falls_in_one_tick,
	close_price_lowest_in_n_ticks,
	one_position_only,
	stochKnD,
	stochKnD_bottom_cross,
	stochKnD_top_cross,
	grab_on_profit,
	prevalent,
	stochKnD_generous_top_cross,
	stochKnD_generous_bottom_cross,
	stochKnD_touched_top,
	trending,
	keeper,
	stepsAwayFromPeak,
	either
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

export default [ Pandit003 ];