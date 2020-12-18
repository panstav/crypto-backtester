import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

export default [

	{
		name: 'Simple Climber',
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
					const totalPriceInUSD = new Decimal(wallet.USD).div(5).toNumber();
					wallet.buy(new Decimal(totalPriceInUSD).div(tick.closePrice).toNumber(), tick);
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 14) return false;
					// trigger if current close is lowest for a streak of 14 ticks
					return Decimal.min(...ticks.slice(-14).map(({ closePrice }) => closePrice)).toNumber() === ticks[ticks.length - 1].closePrice;
				},
				setEffect: (wallet, coinSymbol, tick) => {
					// sell 100% of coin TODO: Limit trade size or randomize a spread
					wallet.sell(wallet[coinSymbol], tick);
				}
			}
		]
	},

	{
		name: 'Careful Climber',
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
					const totalPriceInUSD = new Decimal(wallet.USD).div(5).toNumber();
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
					// sell 100% of coin TODO: Limit trade size or randomize a spread
					wallet.sell(wallet[coinSymbol], tick);
				}
			}
		]
	},

	{
		name: 'Stoch - One position',
		definition: [
			{
				priority: 0.9,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 2 || positions.filter(({
						                                          tradedBack,
						                                          coinsBought
					                                          }) => tradedBack !== coinsBought).length > 0) return false;
					const currentStochRSI = ticks[ticks.length - 1].StochRSI;
					const previousStochRSI = ticks[ticks.length - 2].StochRSI;
					if (!currentStochRSI || (!previousStochRSI && previousStochRSI !== 0)) return false;
					return ((previousStochRSI < 20) && (currentStochRSI > 20));
				},
				setEffect: (wallet, coinSymbol, tick) => {
					// buy coin for 10% of total liquid assets
					const totalPriceInUSD = new Decimal(wallet.USD).div(5).toNumber();
					wallet.buy(new Decimal(totalPriceInUSD).div(tick.closePrice).toNumber(), tick);
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 2) return false;
					const currentStochRSI = ticks[ticks.length - 1].StochRSI;
					const previousStochRSI = ticks[ticks.length - 2].StochRSI;
					if (!currentStochRSI || !previousStochRSI) return false;
					return ((previousStochRSI > 80) && (currentStochRSI < 80));
				},
				setEffect: (wallet, coinSymbol, tick) => {
					if (wallet[coinSymbol] === 0) return;
					// sell 100% of coin TODO: Limit trade size or randomize a spread
					wallet.sell(wallet[coinSymbol], tick);
				}
			}
		]
	},

	{
		name: 'Stoch - Infinite positions',
		definition: [
			{
				priority: 0.9,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 2) return false;
					const currentStochRSI = ticks[ticks.length - 1].StochRSI;
					const previousStochRSI = ticks[ticks.length - 2].StochRSI;
					if (!currentStochRSI || (!previousStochRSI && previousStochRSI !== 0)) return false;
					return ((previousStochRSI < 20) && (currentStochRSI > 20));
				},
				setEffect: (wallet, coinSymbol, tick) => {
					// buy coin for 10% of total liquid assets
					const totalPriceInUSD = new Decimal(wallet.USD).div(5).toNumber();
					wallet.buy(new Decimal(totalPriceInUSD).div(tick.closePrice).toNumber(), tick);
				}
			}, {
				priority: 1,
				isTriggering: (ticks, positions) => {
					if (ticks.length < 2) return false;
					const currentStochRSI = ticks[ticks.length - 1].StochRSI;
					const previousStochRSI = ticks[ticks.length - 2].StochRSI;
					if (!currentStochRSI || !previousStochRSI) return false;
					return ((previousStochRSI > 80) && (currentStochRSI < 80));
				},
				setEffect: (wallet, coinSymbol, tick) => {
					if (wallet[coinSymbol] === 0) return;
					// sell 100% of coin TODO: Limit trade size or randomize a spread
					wallet.sell(wallet[coinSymbol], tick);
				}
			}
		]
	}

];