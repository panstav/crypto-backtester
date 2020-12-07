import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

const trueIndicatorData = {
	MA: {
		'19/3/2018': 8.7977,
		'20/3/2018': 8.7814,
		'21/3/2018': 8.8484,
		'22/3/2018': 8.9777
	},
	RSI: {
		'19/3/2018': 47.5097,
		'20/3/2018': 48.5416,
		'21/3/2018': 54.7112,
		'22/3/2018': 55.4369,
		'23/3/2018': 65.1367,
		'24/3/2018': 71.2335,
	}
};

export function MA({ date, MA }) {
	const expectedMA = trueIndicatorData.MA[date];
	if (!expectedMA) return;
	if (expectedMA !== MA && (new Decimal(expectedMA).minus(MA).abs().greaterThan(0.001))) return console.error(`Expected ${expectedMA} on ${date}, got ${MA}`);
	console.log(`Valid test for ${date}`)
}