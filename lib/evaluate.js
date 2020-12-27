import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

import getLogger from './log.js';

export default function evaluate({ name: strategyName, definition, requirements }, options) {
	const log = getLogger();
	const { coinSymbol, ticks, initialCapital, numTicksToEvaluate } = options;

	// set default trigger
	definition.push({
		isTriggering: () => true, setEffect: () => {
		}, priority: 0
	});

	const positions = [];
	const trades = [];

	const wallet = {
		USD: initialCapital,
		[coinSymbol]: 0,
		buy: (coinsToBuy, { buyPrice, humanDate }) => {
			log('action', `BUY: ${coinSymbol}${coinsToBuy} for $${buyPrice} each`);
			positions.push({ buyTime: humanDate, buyPrice, coinsBought: coinsToBuy, tradedBack: 0 });
			wallet.USD = new Decimal(wallet.USD).minus(new Decimal(buyPrice).times(coinsToBuy)).toNumber();
			wallet[coinSymbol] = new Decimal(wallet[coinSymbol]).add(coinsToBuy).toNumber();
		},
		sell: (coinsToSell, { sellPrice, humanDate }) => {
			log('action', `SELL: ${coinSymbol}${coinsToSell} for $${sellPrice} each`);
			const coinsLeft = positions.reduce((coinsLeftForSell, {
				buyPrice,
				buyTime,
				coinsBought,
				tradedBack
			}, index) => {
				if (coinsLeftForSell === 0 || coinsBought === tradedBack) return coinsLeftForSell;
				const coinsToMarkTrade = Decimal.min(coinsLeftForSell, new Decimal(coinsBought).minus(tradedBack).toNumber()).toNumber();

				positions[index].tradedBack = new Decimal(tradedBack).add(coinsToMarkTrade).toNumber();
				if (positions[index].tradedBack === positions[index].coinsBought) positions[index].resolved = true;

				trades.push({ coinsTraded: coinsToMarkTrade, buyPrice, sellPrice, buyTime, sellTime: humanDate });

				return new Decimal(coinsLeftForSell).minus(coinsToMarkTrade).toNumber();
			}, coinsToSell);

			const coinsBeingSold = new Decimal(coinsToSell).minus(coinsLeft);
			wallet.USD = new Decimal(wallet.USD).add(new Decimal(coinsBeingSold).times(sellPrice)).toNumber();
			wallet[coinSymbol] = new Decimal(wallet[coinSymbol]).minus(coinsBeingSold).toNumber();
		}
	};

	ticks
		.slice(-1 * numTicksToEvaluate)
		.reduce((accuBackTicks, tick) => {
			accuBackTicks.push(tick);

			definition
				.filter(({ isTriggering }) => isTriggering(accuBackTicks, positions))
				.sort((a, b) => b.priority - a.priority)[0]
				.setEffect(wallet, coinSymbol, tick);

			log('tick-summary', `${tick.humanDate} 1${coinSymbol} == $${tick.closePrice}`);
			log('tick-summary', { USD: wallet.USD, [coinSymbol]: wallet[coinSymbol] });
			return accuBackTicks;
		}, []);

	log('final-strategy-summary', `\n${coinSymbol} => ${strategyName}`, { style: 'bold' });

	log('strategy-summary', trades.map(({ coinsTraded, buyPrice, sellPrice, buyTime, sellTime }) => {
		const change = new Decimal(100).div(new Decimal(buyPrice).div(sellPrice)).minus(100);
		return {
			coinsTraded,
			gain: Decimal.max(0, change).toDecimalPlaces(1).toNumber(),
			loss: Decimal.min(0, change).abs().toDecimalPlaces(1).toNumber(),
			buyPrice,
			sellPrice,
			buyTime,
			sellTime
		};
	}), { method: 'table' });

	const unresolvePositions = positions.filter(({ resolved }) => !resolved);
	if (unresolvePositions.length) {
		log('strategy-summary', unresolvePositions, { method: 'table' });
	} else {
		log('strategy-summary', 'No unresolved positions');
	}

	const finalWalletWorth = new Decimal(wallet[coinSymbol]).times(ticks[ticks.length - 1].closePrice).add(wallet.USD).toNumber();
	log('final-strategy-summary', `Wallet total value: $${finalWalletWorth}`);
	log('final-strategy-summary', `${new Decimal(100).div(new Decimal(initialCapital).div(finalWalletWorth)).minus(100).toDecimalPlaces(1).toNumber()}% within ${numTicksToEvaluate} ticks`);

}