import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

import { getAverage } from './math.js';

export default [

	{
		name: 'Simple Climber',
		isActive: false,
		indicators: ['closePrice'],
		definition: [
			{
				priority: 0.9,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 3) return false;
					// current close price is higher than previous
					return (ticks[ticks.length - 2].closePrice > ticks[ticks.length - 3].closePrice);
				},
				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
					// buy coin for 10% of total liquid assets
					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
					const buyPrice = getAverage([closePrice, openPrice]);
					wallet.buy(new Decimal(totalPriceInUSD).div(buyPrice).toNumber(), { buyPrice, humanDate });
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 14) return false;
					// trigger if current close is lowest for a streak of 14 ticks
					return Decimal.min(...ticks.slice(-15, -1).map(({ closePrice }) => closePrice)).toNumber() === ticks[ticks.length - 2].closePrice;
				},
				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
					wallet.sell(wallet[coinSymbol], { sellPrice: getAverage([closePrice, openPrice]), humanDate });
				}
			}
		]
	},

	{
		name: 'Careful Climber',
		isActive: false,
		indicators: ['closePrice'],
		definition: [
			{
				priority: 0.9,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 2) return false;
					// current close price is higher than previous
					return (ticks[ticks.length - 1].closePrice > ticks[ticks.length - 2].closePrice);
				},
				setEffect: (wallet, coinSymbol, tick) => {
					// buy coin for 10% of total liquid assets
					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
					wallet.buy(new Decimal(totalPriceInUSD).div(tick.closePrice).toNumber(), tick);
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 14) return false;
					// trigger if current close is lowest for a streak of 14 ticks
					return Decimal.min(...ticks.slice(-21).map(({ closePrice }) => closePrice)).toNumber() === ticks[ticks.length - 1].closePrice;
				},
				setEffect: (wallet, coinSymbol, tick) => {
					wallet.sell(wallet[coinSymbol], tick);
				}
			}
		]
	},

	{
		name: 'Stoch01 - One position',
		isActive: false,
		definition: [
			{
				priority: 0.9,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 2 || positions.find(({ tradedBack, coinsBought }) => tradedBack !== coinsBought)) return false;
					const currentStochRSI = ticks[ticks.length - 1].StochRSI_01;
					const previousStochRSI = ticks[ticks.length - 2].StochRSI_01;
					if (!currentStochRSI || (!previousStochRSI && previousStochRSI !== 0)) return false;
					return ((previousStochRSI < 20) && (currentStochRSI > 20));
				},
				setEffect: (wallet, coinSymbol, tick) => {
					// buy coin for 10% of total liquid assets
					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
					wallet.buy(new Decimal(totalPriceInUSD).div(tick.closePrice).toNumber(), tick);
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 2) return false;
					const currentStochRSI = ticks[ticks.length - 1].StochRSI_01;
					const previousStochRSI = ticks[ticks.length - 2].StochRSI_01;
					if (!currentStochRSI || !previousStochRSI) return false;
					return ((previousStochRSI > 80) && (currentStochRSI < 80));
				},
				setEffect: (wallet, coinSymbol, tick) => {
					if (wallet[coinSymbol] === 0) return;
					wallet.sell(wallet[coinSymbol], tick);
				}
			}
		]
	},

	{
		name: 'Stoch01 - Infinite positions',
		isActive: false,
		definition: [
			{
				priority: 0.9,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 2) return false;
					const currentStochRSI = ticks[ticks.length - 1].StochRSI_01;
					const previousStochRSI = ticks[ticks.length - 2].StochRSI_01;
					if (!currentStochRSI || (!previousStochRSI && previousStochRSI !== 0)) return false;
					return ((previousStochRSI < 20) && (currentStochRSI > 20));
				},
				setEffect: (wallet, coinSymbol, tick) => {
					// buy coin for 10% of total liquid assets
					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
					wallet.buy(new Decimal(totalPriceInUSD).div(tick.closePrice).toNumber(), tick);
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 2) return false;
					const currentStochRSI = ticks[ticks.length - 1].StochRSI_01;
					const previousStochRSI = ticks[ticks.length - 2].StochRSI_01;
					if (!currentStochRSI || !previousStochRSI) return false;
					return ((previousStochRSI > 80) && (currentStochRSI < 80));
				},
				setEffect: (wallet, coinSymbol, tick) => {
					if (wallet[coinSymbol] === 0) return;
					wallet.sell(wallet[coinSymbol], tick);
				}
			}
		]
	},

	{
		name: 'Stoch01 - Uptrend - Infinite positions',
		isActive: false,
		definition: [
			{
				priority: 0.9,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 2) return false;
					const currentStochRSI = ticks[ticks.length - 1].StochRSI_01;
					const previousStochRSI = ticks[ticks.length - 2].StochRSI_01;
					if (!currentStochRSI || (!previousStochRSI && previousStochRSI !== 0)) return false;
					const currentMA = ticks[ticks.length - 1].MA;
					const previousMA = ticks[ticks.length - 2].MA;
					return ((previousStochRSI < 20) && (currentStochRSI > 20) && (currentMA > previousMA));
				},
				setEffect: (wallet, coinSymbol, tick) => {
					// buy coin for 10% of total liquid assets
					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
					wallet.buy(new Decimal(totalPriceInUSD).div(tick.closePrice).toNumber(), tick);
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 2) return false;
					const currentStochRSI = ticks[ticks.length - 1].StochRSI_01;
					const previousStochRSI = ticks[ticks.length - 2].StochRSI_01;
					if (!currentStochRSI || !previousStochRSI) return false;
					return ((previousStochRSI > 80) && (currentStochRSI < 80));
				},
				setEffect: (wallet, coinSymbol, tick) => {
					if (wallet[coinSymbol] === 0) return;
					wallet.sell(wallet[coinSymbol], tick);
				}
			}
		]
	},

	{
		name: 'Stoch02 - One position',
		isActive: false,
		definition: [
			{
				priority: 0.9,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 2 || positions.find(({ tradedBack, coinsBought }) => tradedBack !== coinsBought)) return false;

					const currentSrk = ticks[ticks.length - 1].StochRSI_02_SmoothK;
					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
					return (previousSrk && currentSrk > 20 && previousSrk < 20);
				},
				setEffect: (wallet, coinSymbol, tick) => {
					// buy coin for 10% of total liquid assets
					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
					wallet.buy(new Decimal(totalPriceInUSD).div(tick.closePrice).toNumber(), tick);
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 2) return false;
					const currentSrk = ticks[ticks.length - 1].StochRSI_02_SmoothK;
					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
					return (previousSrk && currentSrk < 80 && previousSrk > 80);
				},
				setEffect: (wallet, coinSymbol, tick) => {
					if (wallet[coinSymbol] === 0) return;
					wallet.sell(wallet[coinSymbol], tick);
				}
			}
		]
	},

	{
		name: 'Stoch02 - Infinite position',
		isActive: false,
		definition: [
			{
				priority: 0.9,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 2) return false;

					const currentSrk = ticks[ticks.length - 1].StochRSI_02_SmoothK;
					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
					return (previousSrk && currentSrk > 20 && previousSrk < 20);
				},
				setEffect: (wallet, coinSymbol, tick) => {
					// buy coin for 10% of total liquid assets
					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
					wallet.buy(new Decimal(totalPriceInUSD).div(tick.closePrice).toNumber(), tick);
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 2) return false;
					const currentSrk = ticks[ticks.length - 1].StochRSI_02_SmoothK;
					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
					return (previousSrk && currentSrk < 80 && previousSrk > 80);
				},
				setEffect: (wallet, coinSymbol, tick) => {
					if (wallet[coinSymbol] === 0) return;
					wallet.sell(wallet[coinSymbol], tick);
				}
			}
		]
	},

	{
		name: 'Stoch02 - K&D Cross on Uptrend - One position',
		isActive: true,
		definition: [
			{
				priority: 0.9,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 3 || positions.find(({ tradedBack, coinsBought }) => tradedBack !== coinsBought)) return false;

					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
					const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
					const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
					const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;
					const previousMA14 = ticks[ticks.length - 2].MA;
					const oneBeforeMA14 = ticks[ticks.length - 3].MA;

					return (
						// we're in an uptrend
						previousMA14 > oneBeforeMA14
						// cross happen between the previous tick and the one before that
						&& previousSrk > previousSrd
						&& oneBeforeSrk < oneBeforeSrd
						// one of these is lower than 20
						&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi < 20)
					);
				},
				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
					// buy coin for 10% of total liquid assets
					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
					const buyPrice = getAverage([closePrice, openPrice]);
					wallet.buy(new Decimal(totalPriceInUSD).div(buyPrice).toNumber(), { buyPrice, humanDate });
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 3) return false;

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

				},
				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
					if (wallet[coinSymbol] === 0) return;
					wallet.sell(wallet[coinSymbol], { sellPrice: getAverage([closePrice, openPrice]), humanDate });
				}
			}
		]
	},

	{
		name: 'Stoch02 - Patient K&D Cross on Uptrend - One position',
		isActive: false,
		definition: [
			{
				priority: 0.9,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 3 || positions.find(({ tradedBack, coinsBought }) => tradedBack !== coinsBought)) return false;

					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
					const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
					const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
					const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;
					const previousMA14 = ticks[ticks.length - 2].MA;
					const oneBeforeMA14 = ticks[ticks.length - 3].MA;

					return (
						// we're in an uptrend
						previousMA14 > oneBeforeMA14
						// cross happen between the previous tick and the one before that
						&& previousSrk > previousSrd
						&& oneBeforeSrk < oneBeforeSrd
						// one of these is lower than 20
						&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi < 20)
					);
				},
				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
					// buy coin for 10% of total liquid assets
					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
					const buyPrice = getAverage([closePrice, openPrice]);
					wallet.buy(new Decimal(totalPriceInUSD).div(buyPrice).toNumber(), { buyPrice, humanDate });
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 3 || !positions.length) return false;

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
						// buyPrice is lower than guesstimated sellPrice
						&& positions[positions.length - 1].buyPrice < getAverage([ticks[ticks.length - 1].closePrice, ticks[ticks.length - 1].openPrice])
					);

				},
				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
					if (wallet[coinSymbol] === 0) return;
					wallet.sell(wallet[coinSymbol], { sellPrice: getAverage([closePrice, openPrice]), humanDate });
				}
			}
		]
	},

	{
		name: 'Stoch02 - K&D Cross on Uptrend - Infinite positions',
		isActive: false,
		definition: [
			{
				priority: 0.9,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 3) return false;

					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
					const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
					const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
					const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;
					const previousMA14 = ticks[ticks.length - 2].MA;
					const oneBeforeMA14 = ticks[ticks.length - 3].MA;

					return (
						// we're in an uptrend
						previousMA14 > oneBeforeMA14
						// cross happen between the previous tick and the one before that
						&& previousSrk > previousSrd
						&& oneBeforeSrk < oneBeforeSrd
						// one of these is lower than 20
						&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi < 20)
					);
				},
				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
					// buy coin for 10% of total liquid assets
					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
					const buyPrice = getAverage([closePrice, openPrice]);
					wallet.buy(new Decimal(totalPriceInUSD).div(buyPrice).toNumber(), { buyPrice, humanDate });
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 3) return false;

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

				},
				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
					if (wallet[coinSymbol] === 0) return;
					wallet.sell(wallet[coinSymbol], { sellPrice: getAverage([closePrice, openPrice]), humanDate });
				}
			}
		]
	},

	{
		name: 'Stoch02 - K&D Cross on Uptrend QuickSell - Infinite positions',
		isActive: false,
		definition: [
			{
				priority: 0.9,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 3) return false;

					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
					const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
					const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
					const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;
					const previousMA14 = ticks[ticks.length - 2].MA;
					const oneBeforeMA14 = ticks[ticks.length - 3].MA;

					return (
						// we're in an uptrend
						previousMA14 > oneBeforeMA14
						// cross happen between the previous tick and the one before that
						&& previousSrk > previousSrd
						&& oneBeforeSrk < oneBeforeSrd
						// one of these is lower than 20
						&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi < 20)
					);
				},
				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
					// buy coin for 10% of total liquid assets
					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
					const buyPrice = getAverage([closePrice, openPrice]);
					wallet.buy(new Decimal(totalPriceInUSD).div(buyPrice).toNumber(), { buyPrice, humanDate });
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 3) return false;

					if (Decimal.max(...ticks.slice(-15, -1).map(({ closePrice }) => closePrice)).eq(ticks[ticks.length - 2].closePrice)) return true;

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

				},
				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
					if (wallet[coinSymbol] === 0) return;
					wallet.sell(wallet[coinSymbol], { sellPrice: getAverage([closePrice, openPrice]), humanDate });
				}
			}
		]
	},

	{
		name: 'Stoch02 - K&D Cross - Infinite positions',
		isActive: false,
		definition: [
			{
				priority: 0.9,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 3) return false;

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
				},
				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
					// buy coin for 10% of total liquid assets
					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
					const buyPrice = getAverage([closePrice, openPrice]);
					wallet.buy(new Decimal(totalPriceInUSD).div(buyPrice).toNumber(), { buyPrice, humanDate });
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 3) return false;

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

				},
				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
					if (wallet[coinSymbol] === 0) return;
					wallet.sell(wallet[coinSymbol], { sellPrice: getAverage([closePrice, openPrice]), humanDate });
				}
			}
		]
	},

	{
		name: 'Stoch02 - K&D Cross QuickSell - Infinite positions',
		isActive: false,
		definition: [
			{
				priority: 0.9,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 3) return false;

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
				},
				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
					// buy coin for 10% of total liquid assets
					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
					const buyPrice = getAverage([closePrice, openPrice]);
					wallet.buy(new Decimal(totalPriceInUSD).div(buyPrice).toNumber(), { buyPrice, humanDate });
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 3) return false;

					if (Decimal.max(...ticks.slice(-15, -1).map(({ closePrice }) => closePrice)).eq(ticks[ticks.length - 2].closePrice)) return true;

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

				},
				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
					if (wallet[coinSymbol] === 0) return;
					wallet.sell(wallet[coinSymbol], { sellPrice: getAverage([closePrice, openPrice]), humanDate });
				}
			}
		]
	},

	{
		name: 'Stoch02 - Climbs on Uptrend - Infinite positions',
		isActive: false,
		definition: [
			{
				priority: 0.9,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 3) return false;

					const currentSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
					const previousSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
					const currentMA = ticks[ticks.length - 2].MA;
					const previousMA = ticks[ticks.length - 3].MA;
					return (previousSrk && currentMA > previousMA && currentSrk > 20 && previousSrk < 20);
				},
				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
					// buy coin for 10% of total liquid assets
					const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
					const buyPrice = getAverage([closePrice, openPrice]);
					wallet.buy(new Decimal(totalPriceInUSD).div(buyPrice).toNumber(), { buyPrice, humanDate });
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 3) return false;
					const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
					const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
					return (oneBeforeSrk && previousSrk < 80 && oneBeforeSrk > 80);
				},
				setEffect: (wallet, coinSymbol, { closePrice, openPrice, humanDate }) => {
					if (wallet[coinSymbol] === 0) return;
					wallet.sell(wallet[coinSymbol], { sellPrice: getAverage([closePrice, openPrice]), humanDate });
				}
			}
		]
	}

];