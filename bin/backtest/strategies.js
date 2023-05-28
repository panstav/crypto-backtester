export const RSI_BUY_LOW_SELL_HIGH = {
	name: 'RSI Buy Low Sell High',
	advices: {
		buy: [
			(ticks) => ticks[ticks.length - 1].RSI < 25
		],
		sell: [
			(ticks) => ticks[ticks.length - 1].RSI > 75
		]
	}
};