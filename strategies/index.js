import {
	close_price_rises_in_one_tick,
	close_price_falls_in_one_tick,
	close_price_lowest_in_n_ticks,
	one_position_only,
	stochKnD_bottom_cross,
	stochKnD_top_cross,
	grab_on_profit,
	prevalent,
	stochKnD_generous_top_cross,
	stochKnD_generous_bottom_cross,
	stochKnD_touched_top,
	trending
} from './indicators.js';

export default [

	{
		name: 'Pandit',
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross,
				prevalent(5, 1, 10),
				prevalent(5, 10, 100)
			],
			sell: [
				grab_on_profit(5)
			]
		}
	}

]