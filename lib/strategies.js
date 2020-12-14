import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

export const stoch_2080_one_position = {
	definition: [
		{
			priority: 0.9,
			isTriggering: (ticks, positions) => {
				if (ticks.length < 2 || positions.filter(({ tradedBack, coinsBought }) => tradedBack !== coinsBought).length > 0) return false;
				const currentStochRSI = ticks[ticks.length - 1].StochRSI;
				const previousStochRSI = ticks[ticks.length - 2].StochRSI;
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
};

export const stoch_2080_infinite_positions = {
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
				const totalPriceInUSD = new Decimal(wallet.USD).div(10).toNumber();
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
};
