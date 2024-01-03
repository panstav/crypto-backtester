export const Daily_2Percent = {
	name: 'Daily 2%',

	entry: (ticks) => {
		return ticks[ticks.length - 1].RSI < 25;
	},

	exit: (ticks, { buyPrice }) => {
		return buyPrice * 1.02 < ticks[ticks.length - 1].openPrice
			|| buyPrice * 0.99 > ticks[ticks.length - 1].openPrice;
	}
};

export const RSI_BUY_LOW_SELL_HIGH = {
	name: 'RSI Buy Low Sell High',
	percentageToRisk: 100,
	percentageToGrab: 100,

	entry: (ticks, positions) => {
		debugger;

		return positions.length === 0
			&& ticks[ticks.length - 1].RSI < 25;
	},
	exit: (ticks) => {
		debugger;

		return ticks[ticks.length - 1].RSI > 75;
	}
};