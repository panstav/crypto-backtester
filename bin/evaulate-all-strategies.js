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

const INTERVAL = '1h';

(async ({ coins }) => {
	await Promise.all(coins.map(async (coinSymbol, index) => {

		log('fetching', `Updating ${coinSymbol} (${index + 1} / ${coins.length})`);

		// coin by coin - get enriched relevant ticks
		const richTicks = await getCandleData(coinSymbol, INTERVAL);

		// simulate coin history on chosen strategies
		return strategies.forEach((strategy) => evaluate({
			strategy,
			coinSymbol,
			interval: INTERVAL,
			ticks: richTicks
		}));

	}));
})(defaults());