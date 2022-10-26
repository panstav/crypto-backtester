import fs from 'fs';

import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

import strategies from './strategies.js';
import getSignals from './get-signals.js';

import defaults from '../../lib/defaults.js';

import getCandleData from '../../lib/get-candles.js';

const INTERVAL = '1h';
const MAX_HOLD_HOURS = 24 * 30;
const HIGH_ENOUGH_MODIFIER = 1.025;
const VARIATION_STEPS = 10;

const PRECISION_PERCENTAGE = 70;
const REVENUE_PERCENTAGE = 30;

(async ({ coins }) => {
	await Promise.all(coins.slice(0, 3).map(async (coinSymbol) => {

		// coin by coin - get enriched relevant ticks
		const richTicks = (await getCandleData(coinSymbol, INTERVAL))
			.map((tick, index) => {
				tick.index = index;
				return tick;
			});

		const variedStrategies = strategies.reduce(accumolateStrategyVariations, []);

		const summarizedVariants = variedStrategies
			.map(({ name, strategy, requirements, strategyVariant: settings }, index, variants) => {
				const paddedIndex = (index+1).toString().padStart(variants.length.toString().length, '0');
				process.stdout.write(`Executing strategy: ${paddedIndex}/${variants.length} - ${name}\r`);
				return ({ name, settings, signals: getSignals(richTicks, { strategy, requirements }) });
			})
			.filter((strategyVariant) => strategyVariant.signals.length)
			.map((strategyVariant, index, variants) => {
				const paddedIndex = (index + 1).toString().padStart(variants.length.toString().length, '0');
				process.stdout.write(`Evaluating signals: ${paddedIndex}/${variants.length} - ${strategyVariant.signals.length.toString().padStart(strategyVariant.signals.length.toString().length)} signals - ${strategyVariant.name}\r`);
				return Object.assign(strategyVariant, { verifiedSignals: strategyVariant.signals.filter(verify) });
			})
			.filter((strategyVariant) => strategyVariant.verifiedSignals.length)
			.map((variant) => {
				variant.precision = new Decimal(variant.verifiedSignals.length).div(variant.signals.length).toNumber();
				variant.revenue = variant.verifiedSignals.length;
				return variant;
			});

			if (!summarizedVariants.length) return;

		const highestPrecision = summarizedVariants.sort((a, b) => b.precision - a.precision)[0].precision;
		const highestRevenue = summarizedVariants.sort((a, b) => b.revenue - a.revenue)[0].revenue;

		const ratedVariants = summarizedVariants.map((variant) => {
			const precisionRating = new Decimal(variant.precision).div(highestPrecision).div(100).times(PRECISION_PERCENTAGE).toNumber(); // .div(100).times(PRECISION_PERCENTAGE).toNumber();
			const revenueRating = new Decimal(variant.revenue).div(highestRevenue).div(100).times(REVENUE_PERCENTAGE).toNumber(); // .div(100).times(REVENUE_PERCENTAGE).toNumber();
			variant.rating = new Decimal(precisionRating).times(revenueRating).toNumber();
			return variant;
		})
			.sort((a, b) => b.rating - a.rating);

			debugger;


		fs.writeFileSync(`bin/analyze/reports/${new Date().getMonth() + 1}-${new Date().getDate()}.${coinSymbol}.txt`, JSON.stringify(ratedVariants));

		function verify(signal) {
			const sellingVerifications = richTicks
				.slice(signal.index + 1, signal.index + 1 + MAX_HOLD_HOURS)
				.filter((tick) => new Decimal(signal.highPrice).times(HIGH_ENOUGH_MODIFIER).lessThan(tick.lowPrice));

			return sellingVerifications.length;
		}

	}));
})(defaults({
	isUpdatingHistory: false,
	logTypes: { 'fetching': true }
}));

function accumolateStrategyVariations(accu1, { name, strategy, requirements, ranges }) {

	const iteratorsCounter = Object.keys(ranges).reduce((accu2, key) => {
		accu2.push({ key, value: 0 });
		return accu2;
	}, []);

	let strategyAccu = [];
	while (new Decimal(VARIATION_STEPS).toPower(iteratorsCounter.length).greaterThan(strategyAccu.length)) {

		const strategyVariant = iteratorsCounter.reduce((accu2, { key, value }) => {
			accu2[key] = new Decimal(value).times(new Decimal(ranges[key][1]).minus(ranges[key][0]).div(VARIATION_STEPS)).toNumber();
			return accu2;
		}, {});

		strategyAccu.push({
			requirements,
			strategyVariant,
			name: `${name}${iteratorsCounter.reduce((accu2, iteratedArgument) => {
				return `${accu2}-${iteratedArgument.key}${iteratedArgument.value}`;
			}, '')}`,
			strategy: strategy(strategyVariant)
		});

		increment();
	}

	return accu1.concat(strategyAccu);

	function increment() {
		let bumped, index = 0;

		while (!bumped && index < iteratorsCounter.length) {

			if (iteratorsCounter[index].value + 1 > VARIATION_STEPS - 1) {
				index++;
			} else {

				iteratorsCounter[index].value++;
				bumped = true;

				if (index !== 0) {
					let i = 0;
					while (i < index) {
						iteratorsCounter[i].value = 0;
						i++;
					}
				}

			}

		}
	}

	// let argumentIndex = 1;
	//
	// while (ar)
	//
	// let argumentValueIndex = 1;
	//
	// while (argumentIteration !== VARIATION_STEPS) {
	//
	// 	let variationName = '';
	//
	// 	const variationArguments = Object.keys(ranges).reduce((argAccu, key) => {
	// 		const [low, high] = ranges[key];
	// 		const qualitatedStep = new Decimal(high).minus(low).div(VARIATION_STEPS).toNumber();
	// 		argAccu[key] = new Decimal(low).add(new Decimal(qualitatedStep).times(argumentIteration));
	// 		return argAccu;
	// 	}, {});
	//
	// 	accu1.push({ name: `${name}-`, strategy: strategy(variationArguments) });
	// 	argumentIteration++;
	// }

}