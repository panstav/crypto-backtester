import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

import defaults from '../lib/defaults.js';

import getLogger from '../lib/log.js';
const log = getLogger({
	'fetching': true,
	'final-strategy-summary': true
});

import strategies from '../strategies/index.js';

import evaluate from '../lib/evaluate.js';
import getCandleData from '../lib/get-candles.js';

const interval = '1h';

const { coins } = defaults();

await Promise.all(coins.map(async (coinSymbol, index) => {
	log('fetching', `Updating ${coinSymbol} (${index + 1} / ${coins.length})`);

	// coin by coin - get enriched relevant ticks
	const ticks = await getCandleData(coinSymbol, interval);

	// simulate coin history on chosen strategies
	return strategies.forEach((strategy) => evaluate({ strategy, coinSymbol, interval, ticks }));
}));