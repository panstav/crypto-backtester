import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

import defaults from '../../lib/defaults.js';

import getLogger from '../../lib/log.js';

import getCoins from './get-coins.js';
import calcRecommendations from './calc-recommendations.js';

(async ({ intervals, logTypes }) => {
	getLogger(logTypes);

	const coins = await getCoins();
	const recommendations = calcRecommendations(coins);

	intervals.forEach((interval) => {
		console.log(`--------------------------------------------------
Recommended Crypto to buy ${{ '1d': 'today', '1h': 'at this hour' }[interval]}:`);
		console.table(recommendations[interval].length ? recommendations[interval].sort((a, b) => a.Timestamp - b.Timestamp) : 'None.'.bold);
	});

})(defaults({
	// force fetching latest data
	isUpdatingHistory: true,
	numTicksToEvaluate: 500,
	logTypes: {
		'fetching': true
	}
}));