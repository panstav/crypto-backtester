import coins from './lib/coins.js';

export const apiUrl = 'https://www.binance.com/api/v3';

export default {

	////////////////////////////
	// Simulation Configuration
	////////////////////////////

	baseCurrency: 'BUSD',

	// the coins to run with
	coins,
	// coins: ["DATA"],

	// how big is the investing wallet
	initialCapital: 1000,

	// how much to trade for when signal is buy
	percentageToRisk: 10,
	// how much to trade for when signal is sell
	percentageToGrab: 100,

	// a point in time to avoid trading done before
	timestampToTradeAfter: 0,
	// timestampToTradeAfter: 1514764800000, // 1/1/18
	// timestampToTradeAfter: 1609462861000, // 1/1/21

	tradeFractionPercision: 6,

	// minumum hours / days for a coin to be considered
	minimumTicksPerInterval: 100,

	// number of ticks to allow trading at
	numTicksToEvaluate: false,
	// numTicksToEvaluate: 24 * 7 * 4,
	// numTicksToEvaluate: 28,
	// numTicksToEvaluate: 100,
	// numTicksToEvaluate: 365,

	timeTillRecommendationExpires: {
		'1h': 3600000 * 2,
		'1d': 3600000 * 24 * 1.5
	},

	// should recent data be fetched and saved
	isUpdatingHistory: true,

	// the types of log to filter out to the console
	logTypes: {
		'fetching-detail': false,
		'fetching': true,
		'enrichment': false,
		'action': false,
		'tick-summary': false,
		'strategy-summary': true,
		'final-strategy-summary': true
	},

	////////////////////////////
	// API Configuration
	////////////////////////////

	// platform for all interactions
	apiUrl,

	// api endpoint for data retrieval
	endpointUrl: `${apiUrl}/klines`,

	// binance maximum ticks per request
	ticksPerResultsFragment: 1000,

	// which intervals to keep ticks of and to look recommendations on
	intervals: ['1d', '1h'],

	////////////////////////////
	// Algorithm Configuration
	////////////////////////////

	// some indicators require a fixed sized ticks batch to calc against other batches
	// it is also relevant to various other functionalities so DONT TOUCH unless you are doing hardcore ai scifi
	stepSize: 14,

	// limit how many coins get processed
	// 0 for limitless
	coinsCountLimit: 0

};