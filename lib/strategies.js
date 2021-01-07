import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

function close_price_rises_in_one_tick(ticks) {
	if (ticks.length < 3) return false;
	const lastClosePrice = ticks[ticks.length - 2].closePrice;
	const previousClosePrice = ticks[ticks.length - 3].closePrice;
	return lastClosePrice > previousClosePrice;
}

function close_price_falls_in_one_tick(ticks) {
	if (ticks.length < 3) return false;
	const lastClosePrice = ticks[ticks.length - 2].closePrice;
	const previousClosePrice = ticks[ticks.length - 3].closePrice;
	return lastClosePrice < previousClosePrice;
}

function close_price_lowest_in_n_ticks(n) {
	return (ticks) => {
		if (ticks.length < n) return false;
		return Decimal.min(...ticks.slice(-1 * n).map(({ closePrice }) => closePrice)).toNumber() === ticks[ticks.length - 1].closePrice;
	}
}

function close_price_highest_in_n_ticks(n) {
	return (ticks) => {
		if (ticks.length < n) return false;
		return Decimal.max(...ticks.slice(-1 * n).map(({ closePrice }) => closePrice)).toNumber() === ticks[ticks.length - 1].closePrice;
	}
}

function one_position_only(ticks, positions) {
	return !positions.filter(({ resolved }) => !resolved).length;
}

function trending(direction, { MA7, MA14, MA28, continiously = 1 }) {
	if (direction !== 'up' && direction !== 'down') throw new Error('Direction can be either \'up\' or \'down\'');
	const isUp = direction === 'up';

	return (ticks) => {

		// ensure there's enough to calculate average
		if ((MA7 && ticks.length < 7)
			|| MA14 && ticks.length < 14
			|| MA28 && ticks.length < 28) return false;

		const results = ticks
			.slice(-1 * (continiously + 2))
			.map((tick, index, array) => {
				if (index >= array.length - 2) return true;

				const greaterTick = isUp ? array[index + 1] : tick;
				const lesserTick = isUp ? tick : array[index + 1];

				if (MA7 && new Decimal(lesserTick.MA7).greaterThan(greaterTick.MA7)) return false;
				if (MA14 && new Decimal(lesserTick.MA14).greaterThan(greaterTick.MA14)) return false;
				if (MA28 && new Decimal(lesserTick.MA28).greaterThan(greaterTick.MA28)) return false;
				return true;
			});

		return results.every((result) => !!result);

	}
}

function prevalent(changeToClosePrice, timesToAppear, numOfLastTicks) {
	return (ticks) => {
		if (numOfLastTicks > ticks.length) return false;
		const atPrice = new Decimal(ticks[ticks.length - 1].closePrice).times(new Decimal(100).add(changeToClosePrice)).div(100).toNumber();
		return ticks
			.slice(-1 * numOfLastTicks)
			.filter(({ highPrice }) => highPrice > atPrice)
			.length >= timesToAppear;
	}
}

function grab_on_profit(percentage) {
	return (ticks, positions) => {
    return new Decimal(positions[positions.length - 1].buyPrice).times(new Decimal(100).add(percentage)).div(100).lessThan(ticks[ticks.length - 2].closePrice);
	}
}

function stochKnD_bottom_cross(ticks) {
	if (ticks.length < 3 || ticks.slice(-3).some(({ StochRSI_02_D }) => !StochRSI_02_D && StochRSI_02_D !== 0)) return false;

	const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
	const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
	const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
	const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;

	return (
		// cross happen between the previous tick and the one before that
		previousSrk > previousSrd
		&& oneBeforeSrk < oneBeforeSrd
		// one of these is lower than 20
		&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi < 20)
	);

}

function stochKnD_generous_bottom_cross(ticks) {
	if (ticks.length < 3 || ticks.slice(-3).some(({ StochRSI_02_D }) => !StochRSI_02_D && StochRSI_02_D !== 0)) return false;

	const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
	const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
	const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
	const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;

	return (
		// cross happen between the previous tick and the one before that
		previousSrk > previousSrd
		&& oneBeforeSrk <= oneBeforeSrd
		// one of these is lower than 20
		&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi < 20)
	);

}

function stochKnD_touched_bottom(ticks) {
	if (ticks.length < 3 || ticks.slice(-3).some(({ StochRSI_02_D }) => !StochRSI_02_D && StochRSI_02_D !== 0)) return false;

	const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
	const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
	const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
	const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;

	return (
		// one of these is lower than 20
		[previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi < 20)
	);

}

function stochKnD_touched_top(ticks) {
	if (ticks.length < 3 || ticks.slice(-3).some(({ StochRSI_02_D }) => !StochRSI_02_D && StochRSI_02_D !== 0)) return false;

	const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
	const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
	const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
	const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;

	return (
		// one of these is higher than 80
		[previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi > 80)
	);

}

function stochKnD_top_cross(ticks) {
	if (ticks.length < 3 || ticks.slice(-3).some(({ StochRSI_02_D }) => !StochRSI_02_D && StochRSI_02_D !== 0)) return false;

	const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
	const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
	const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
	const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;

	return (
		// cross happen between the previous tick and the one before that
		previousSrk < previousSrd
		&& oneBeforeSrk > oneBeforeSrd
		// one of these is higher than 80
		&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochThing) => stochThing > 80)
	);

}

function stochKnD_generous_top_cross(ticks) {
	if (ticks.length < 3 || ticks.slice(-3).some(({ StochRSI_02_D }) => !StochRSI_02_D && StochRSI_02_D !== 0)) return false;

	const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
	const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
	const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
	const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;

	return (
		// cross happen between the previous tick and the one before that
		previousSrk < previousSrd
		&& oneBeforeSrk >= oneBeforeSrd
		// one of these is higher than 80
		&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochThing) => stochThing > 80)
	);

}

function either(...fns) {
	return (ticks, positions) => {
		return fns.some((fn) => fn(ticks, positions));
	}
}

export default [

	{
		name: 'Simple Climber',
		isActive: false,
		advices: {
			buy: [
				close_price_rises_in_one_tick
			],
			sell: [
				close_price_falls_in_one_tick
			]
		}
	},

	{
		name: 'Careful Climber',
		isActive: false,
		advices: {
			buy: [
				close_price_rises_in_one_tick
			],
			sell: [
				close_price_lowest_in_n_ticks(14)
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross
			],
			sell: [
				stochKnD_top_cross
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross SellFor2 - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross
			],
			sell: [
				grab_on_profit(5)
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross SellFor5 - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross
			],
			sell: [
				grab_on_profit(5)
			]
		}
	},

	{
		name: 'Stoch02 - Prevalent K&D Cross SellFor5 - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross,
				prevalent(5, 10, 100)
			],
			sell: [
				grab_on_profit(5)
			]
		}
	},

	{
		name: 'Stoch02 - Prevalent K&D Cross SellFor5 on Uptrend - One position',
		isActive: true,
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
	},

	{
		name: 'Stoch02 - Prevalent K&D Cross SellFor3 on Uptrend - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross,
				prevalent(3, 1, 10),
				prevalent(3, 10, 100)
			],
			sell: [
				grab_on_profit(3)
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross SellFor10 - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross
			],
			sell: [
				grab_on_profit(10)
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross SellFor2 - Infinite positions',
		isActive: false,
		advices: {
			buy: [
				stochKnD_bottom_cross
			],
			sell: [
				grab_on_profit(2)
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross SellFor5 - Infinite positions',
		isActive: false,
		advices: {
			buy: [
				stochKnD_bottom_cross
			],
			sell: [
				grab_on_profit(5)
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross SellFor10 - Infinite positions',
		isActive: false,
		advices: {
			buy: [
				stochKnD_bottom_cross
			],
			sell: [
				grab_on_profit(10)
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross Uptrend7 - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross,
				trending('up', { MA7: true })
			],
			sell: [
				stochKnD_top_cross
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross Uptrend714 - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross,
				trending('up', { MA7: true, MA14: true })
			],
			sell: [
				stochKnD_top_cross
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross Uptrend14 - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross,
				trending('up', { MA14: true })
			],
			sell: [
				stochKnD_top_cross
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross Uptrend14x2 - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross,
				trending('up', { MA14: true, continiously: 2 })
			],
			sell: [
				stochKnD_top_cross
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross Uptrend14x3 - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross,
				trending('up', { MA14: true, continiously: 3 })
			],
			sell: [
				stochKnD_top_cross
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross Uptrend714x2 - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross,
				trending('up', { MA7: true, MA14: true, continiously: 2 })
			],
			sell: [
				stochKnD_top_cross
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross Uptrend714x3 - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross,
				trending('up', { MA7: true, MA14: true, continiously: 3 })
			],
			sell: [
				stochKnD_top_cross
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross Uptrend728 - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross,
				trending('up', { MA7: true, MA28: true })
			],
			sell: [
				stochKnD_top_cross
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross Uptrend1428 - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross,
				trending('up', { MA14: true, MA28: true })
			],
			sell: [
				stochKnD_top_cross
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross Uptrend28 - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross,
				trending('up', { MA28: true })
			],
			sell: [
				stochKnD_top_cross
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross on Uptrend - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross,
				trending('up', { MA14: true })
			],
			sell: [
				stochKnD_top_cross
			]
		}
	},

	{
		name: 'Stoch02 - Generous K&D Cross on Uptrend - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_generous_bottom_cross,
				trending('up', { MA14: true })
			],
			sell: [
				stochKnD_generous_top_cross
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross on Uptrend and Touch Top - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_generous_bottom_cross,
				trending('up', { MA14: true })
			],
			sell: [
				stochKnD_touched_top
			]
		}
	},

	{
		name: 'Stoch02 - Anxious K&D Cross on Uptrend - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_top_cross,
				trending('up', { MA7: true, MA14: true, MA28: true })
			],
			sell: [
				stochKnD_top_cross
			]
		}
	},

	{
		name: 'Stoch02 - Confident Rebel K&D Cross on Uptrend - One position',
		isActive: false,
		advices: {
			buy: [
				one_position_only,
				stochKnD_bottom_cross,
				trending('up', { MA7: true, MA14: true })
			],
			sell: [
				stochKnD_top_cross
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross on Uptrend - Infinite positions',
		isActive: false,
		advices: {
			buy: [
				stochKnD_top_cross,
				trending('up', { MA14: true })
			],
			sell: [
				stochKnD_top_cross
			]
		}
	},

	{
		name: 'Stoch02 - K&D Cross - Infinite positions',
		isActive: false,
		advices: {
			buy: [
				stochKnD_bottom_cross
			],
			sell: [
				stochKnD_top_cross
			]
		}
	}

];

//	{
// 		name: 'Stoch01 - One position',
// 		isActive: false,
// 		definition: [
// 			{
// 				priority: 0.9,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 2 || positions.find(({ tradedBack, coinsBought }) => tradedBack !== coinsBought)) return false;
// 					const currentStochRSI = ticks[ticks.length - 1].StochRSI_01;
// 					const previousStochRSI = ticks[ticks.length - 2].StochRSI_01;
// 					if (!currentStochRSI || (!previousStochRSI && previousStochRSI !== 0)) return false;
// 					return ((previousStochRSI < 20) && (currentStochRSI > 20));
// 				},
// 				setEffect: (wallet, coinSymbol, tick) => {
// 					// buy coin for 10% of total liquid assets
// 					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
// 					wallet.buy(new Decimal(totalPriceInUSD).div(tick.closePrice).toNumber(), tick);
// 				}
// 			}, {
// 				priority: 1,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 2) return false;
// 					const currentStochRSI = ticks[ticks.length - 1].StochRSI_01;
// 					const previousStochRSI = ticks[ticks.length - 2].StochRSI_01;
// 					if (!currentStochRSI || !previousStochRSI) return false;
// 					return ((previousStochRSI > 80) && (currentStochRSI < 80));
// 				},
// 				setEffect: (wallet, coinSymbol, tick) => {
// 					if (wallet[coinSymbol] === 0) return;
// 					wallet.sell(wallet[coinSymbol], tick);
// 				}
// 			}
// 		]
// 	},
//
// 	{
// 		name: 'Stoch02 - K&D Cross QuickSell - Infinite positions',
// 		isActive: false,
// 		definition: [
// 			{
// 				priority: 0.9,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 3) return false;
//
// 					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
// 					const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
// 					const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
// 					const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;
//
// 					return (
// 						// cross happen between the previous tick and the one before that
// 						previousSrk > previousSrd
// 						&& oneBeforeSrk < oneBeforeSrd
// 						// one of these is lower than 20
// 						&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi < 20)
// 					);
// 				},
// 				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
// 					// buy coin for 10% of total liquid assets
// 					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
// 					const buyPrice = getAverage([closePrice, openPrice]);
// 					wallet.buy(new Decimal(totalPriceInUSD).div(buyPrice).toNumber(), { buyPrice, humanDate });
// 				}
// 			}, {
// 				priority: 1,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 3) return false;
//
// 					if (Decimal.max(...ticks.slice(-15, -1).map(({ closePrice }) => closePrice)).eq(ticks[ticks.length - 2].closePrice)) return true;
//
// 					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
// 					const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
// 					const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
// 					const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;
//
// 					return (
// 						// cross happen between the previous tick and the one before that
// 						previousSrk < previousSrd
// 						&& oneBeforeSrk > oneBeforeSrd
// 						// one of these is higher than 80
// 						&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochThing) => stochThing > 80)
// 					);
//
// 				},
// 				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
// 					if (wallet[coinSymbol] === 0) return;
// 					wallet.sell(wallet[coinSymbol], { sellPrice: getAverage([closePrice, openPrice]), humanDate });
// 				}
// 			}
// 		]
// 	},
//
// 	{
// 		name: 'Stoch02 - Climbs on Uptrend - Infinite positions',
// 		isActive: false,
// 		definition: [
// 			{
// 				priority: 0.9,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 3) return false;
//
// 					const currentSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
// 					const previousSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
// 					const currentMA = ticks[ticks.length - 2].MA;
// 					const previousMA = ticks[ticks.length - 3].MA;
// 					return (previousSrk && currentMA > previousMA && currentSrk > 20 && previousSrk < 20);
// 				},
// 				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
// 					// buy coin for 10% of total liquid assets
// 					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
// 					const buyPrice = getAverage([closePrice, openPrice]);
// 					wallet.buy(new Decimal(totalPriceInUSD).div(buyPrice).toNumber(), { buyPrice, humanDate });
// 				}
// 			}, {
// 				priority: 1,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 3) return false;
// 					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
// 					const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
// 					return (oneBeforeSrk && previousSrk < 80 && oneBeforeSrk > 80);
// 				},
// 				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
// 					if (wallet[coinSymbol] === 0) return;
// 					wallet.sell(wallet[coinSymbol], { sellPrice: getAverage([closePrice, openPrice]), humanDate });
// 				}
// 			}
// 		]
// 	},
//
// 	{
// 		name: 'Stoch02 - K&D Cross on Uptrend QuickSell - Infinite positions',
// 		isActive: false,
// 		definition: [
// 			{
// 				priority: 0.9,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 3) return false;
//
// 					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
// 					const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
// 					const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
// 					const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;
// 					const previousMA14 = ticks[ticks.length - 2].MA;
// 					const oneBeforeMA14 = ticks[ticks.length - 3].MA;
//
// 					return (
// 						// we're in an uptrend
// 						previousMA14 > oneBeforeMA14
// 						// cross happen between the previous tick and the one before that
// 						&& previousSrk > previousSrd
// 						&& oneBeforeSrk < oneBeforeSrd
// 						// one of these is lower than 20
// 						&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi < 20)
// 					);
// 				},
// 				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
// 					// buy coin for 10% of total liquid assets
// 					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
// 					const buyPrice = getAverage([closePrice, openPrice]);
// 					wallet.buy(new Decimal(totalPriceInUSD).div(buyPrice).toNumber(), { buyPrice, humanDate });
// 				}
// 			}, {
// 				priority: 1,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 3) return false;
//
// 					if (Decimal.max(...ticks.slice(-15, -1).map(({ closePrice }) => closePrice)).eq(ticks[ticks.length - 2].closePrice)) return true;
//
// 					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
// 					const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
// 					const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
// 					const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;
//
// 					return (
// 						// cross happen between the previous tick and the one before that
// 						previousSrk < previousSrd
// 						&& oneBeforeSrk > oneBeforeSrd
// 						// one of these is higher than 80
// 						&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochThing) => stochThing > 80)
// 					);
//
// 				},
// 				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
// 					if (wallet[coinSymbol] === 0) return;
// 					wallet.sell(wallet[coinSymbol], { sellPrice: getAverage([closePrice, openPrice]), humanDate });
// 				}
// 			}
// 		]
// 	},
//
// 	{
// 		name: 'Stoch02 - Patient K&D Cross on Uptrend - One position',
// 		isActive: false,
// 		definition: [
// 			{
// 				priority: 0.9,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 3 || positions.find(({ tradedBack, coinsBought }) => tradedBack !== coinsBought)) return false;
//
// 					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
// 					const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
// 					const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
// 					const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;
// 					const previousMA14 = ticks[ticks.length - 2].MA;
// 					const oneBeforeMA14 = ticks[ticks.length - 3].MA;
//
// 					return (
// 						// we're in an uptrend
// 						previousMA14 > oneBeforeMA14
// 						// cross happen between the previous tick and the one before that
// 						&& previousSrk > previousSrd
// 						&& oneBeforeSrk < oneBeforeSrd
// 						// one of these is lower than 20
// 						&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi < 20)
// 					);
// 				},
// 				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
// 					// buy coin for 10% of total liquid assets
// 					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
// 					const buyPrice = getAverage([closePrice, openPrice]);
// 					wallet.buy(new Decimal(totalPriceInUSD).div(buyPrice).toNumber(), { buyPrice, humanDate });
// 				}
// 			}, {
// 				priority: 1,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 3 || !positions.length) return false;
//
// 					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
// 					const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
// 					const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
// 					const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;
//
// 					return (
// 						// cross happen between the previous tick and the one before that
// 						previousSrk < previousSrd
// 						&& oneBeforeSrk > oneBeforeSrd
// 						// one of these is higher than 80
// 						&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochThing) => stochThing > 80)
// 						// buyPrice is lower than guesstimated sellPrice
// 						&& positions[positions.length - 1].buyPrice < getAverage([ticks[ticks.length - 1].closePrice, ticks[ticks.length - 1].openPrice])
// 					);
//
// 				},
// 				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
// 					if (wallet[coinSymbol] === 0) return;
// 					wallet.sell(wallet[coinSymbol], { sellPrice: getAverage([closePrice, openPrice]), humanDate });
// 				}
// 			}
// 		]
// 	},
//
// 	{
// 		name: 'Stoch01 - Infinite positions',
// 		isActive: false,
// 		definition: [
// 			{
// 				priority: 0.9,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 2) return false;
// 					const currentStochRSI = ticks[ticks.length - 1].StochRSI_01;
// 					const previousStochRSI = ticks[ticks.length - 2].StochRSI_01;
// 					if (!currentStochRSI || (!previousStochRSI && previousStochRSI !== 0)) return false;
// 					return ((previousStochRSI < 20) && (currentStochRSI > 20));
// 				},
// 				setEffect: (wallet, coinSymbol, tick) => {
// 					// buy coin for 10% of total liquid assets
// 					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
// 					wallet.buy(new Decimal(totalPriceInUSD).div(tick.closePrice).toNumber(), tick);
// 				}
// 			}, {
// 				priority: 1,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 2) return false;
// 					const currentStochRSI = ticks[ticks.length - 1].StochRSI_01;
// 					const previousStochRSI = ticks[ticks.length - 2].StochRSI_01;
// 					if (!currentStochRSI || !previousStochRSI) return false;
// 					return ((previousStochRSI > 80) && (currentStochRSI < 80));
// 				},
// 				setEffect: (wallet, coinSymbol, tick) => {
// 					if (wallet[coinSymbol] === 0) return;
// 					wallet.sell(wallet[coinSymbol], tick);
// 				}
// 			}
// 		]
// 	},
//
// 	{
// 		name: 'Stoch01 - Uptrend - Infinite positions',
// 		isActive: false,
// 		definition: [
// 			{
// 				priority: 0.9,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 2) return false;
// 					const currentStochRSI = ticks[ticks.length - 1].StochRSI_01;
// 					const previousStochRSI = ticks[ticks.length - 2].StochRSI_01;
// 					if (!currentStochRSI || (!previousStochRSI && previousStochRSI !== 0)) return false;
// 					const currentMA = ticks[ticks.length - 1].MA;
// 					const previousMA = ticks[ticks.length - 2].MA;
// 					return ((previousStochRSI < 20) && (currentStochRSI > 20) && (currentMA > previousMA));
// 				},
// 				setEffect: (wallet, coinSymbol, tick) => {
// 					// buy coin for 10% of total liquid assets
// 					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
// 					wallet.buy(new Decimal(totalPriceInUSD).div(tick.closePrice).toNumber(), tick);
// 				}
// 			}, {
// 				priority: 1,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 2) return false;
// 					const currentStochRSI = ticks[ticks.length - 1].StochRSI_01;
// 					const previousStochRSI = ticks[ticks.length - 2].StochRSI_01;
// 					if (!currentStochRSI || !previousStochRSI) return false;
// 					return ((previousStochRSI > 80) && (currentStochRSI < 80));
// 				},
// 				setEffect: (wallet, coinSymbol, tick) => {
// 					if (wallet[coinSymbol] === 0) return;
// 					wallet.sell(wallet[coinSymbol], tick);
// 				}
// 			}
// 		]
// 	},
//
// 	{
// 		name: 'Stoch02 - One position',
// 		isActive: false,
// 		definition: [
// 			{
// 				priority: 0.9,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 2 || positions.find(({ tradedBack, coinsBought }) => tradedBack !== coinsBought)) return false;
//
// 					const currentSrk = ticks[ticks.length - 1].StochRSI_02_SmoothK;
// 					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
// 					return (previousSrk && currentSrk > 20 && previousSrk < 20);
// 				},
// 				setEffect: (wallet, coinSymbol, tick) => {
// 					// buy coin for 10% of total liquid assets
// 					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
// 					wallet.buy(new Decimal(totalPriceInUSD).div(tick.closePrice).toNumber(), tick);
// 				}
// 			}, {
// 				priority: 1,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 2) return false;
// 					const currentSrk = ticks[ticks.length - 1].StochRSI_02_SmoothK;
// 					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
// 					return (previousSrk && currentSrk < 80 && previousSrk > 80);
// 				},
// 				setEffect: (wallet, coinSymbol, tick) => {
// 					if (wallet[coinSymbol] === 0) return;
// 					wallet.sell(wallet[coinSymbol], tick);
// 				}
// 			}
// 		]
// 	},
//
// 	{
// 		name: 'Stoch02 - Infinite position',
// 		isActive: false,
// 		definition: [
// 			{
// 				priority: 0.9,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 2) return false;
//
// 					const currentSrk = ticks[ticks.length - 1].StochRSI_02_SmoothK;
// 					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
// 					return (previousSrk && currentSrk > 20 && previousSrk < 20);
// 				},
// 				setEffect: (wallet, coinSymbol, tick) => {
// 					// buy coin for 10% of total liquid assets
// 					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
// 					wallet.buy(new Decimal(totalPriceInUSD).div(tick.closePrice).toNumber(), tick);
// 				}
// 			}, {
// 				priority: 1,
// 				isTriggering: (ticks, positions) => {
// 					if (ticks.length < 2) return false;
// 					const currentSrk = ticks[ticks.length - 1].StochRSI_02_SmoothK;
// 					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
// 					return (previousSrk && currentSrk < 80 && previousSrk > 80);
// 				},
// 				setEffect: (wallet, coinSymbol, tick) => {
// 					if (wallet[coinSymbol] === 0) return;
// 					wallet.sell(wallet[coinSymbol], tick);
// 				}
// 			}
// 		]
// 	},