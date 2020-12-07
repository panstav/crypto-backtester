import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

const stepSize = 14;

const results = [0.01295200,
	0.01291500,
	0.01297700,
	0.01293600,
	0.01283800,
	0.01268200,
	0.01262400,
	0.01245500,
	0.01241600,
	0.01248700,
	0.01236700,
	0.01255100,
	0.01264400,
	0.01246700,
	0.01253500,
	0.01243200,
	0.01239100,
	0.01231600,
	0.01227600,
	0.01252000,
	0.01230000,
	0.01212700,
	0.01216000,
	0.01252100,
	0.01245900,
	0.01257000,
	0.01263700].reduce((accu, close, index, closes) => {
		accu.push({ close, ...smaRsi(closes.slice(Math.max(index - 14, 0), index + 1), accu[index - 1]) });
		return accu;
}, []);

debugger;

function smaRsi(closes, prevTickData) {

	const changeModifier = 0.07142857;
	const latestClose = closes[closes.length - 1];

	const [avgGain, avgLoss] = (prevTickData && prevTickData.rsi)

		? [
			new Decimal(latestClose).times(changeModifier).add(new Decimal(prevTickData.avgGain).times(new Decimal(1).minus(changeModifier))).toNumber(),
			new Decimal(latestClose).times(changeModifier).add(new Decimal(prevTickData.avgLoss).times(new Decimal(1).minus(changeModifier))).toNumber()
		]

		: closes.reduce((accu, close, index, closes) => {
			const previousClose = closes[index - 1];
			if (!previousClose) return accu;
			const change = Decimal.max(new Decimal(close).minus(previousClose));
			accu[change.toNumber() > 0 ? 0 : 1].push(change.abs().toNumber());
			// accu[0].push(Decimal.max(new Decimal(close).minus(previousClose), 0).toNumber());
			// accu[1].push(Decimal.max(new Decimal(previousClose).minus(close), 0).toNumber());
			return accu;
		}, [[], []])
			.reduce((changes, changeArr) => [...changes, avg(changeArr)], []);

	const rs = new Decimal(avgGain).div(avgLoss).toNumber();

	const rsi = (avgLoss === 0) ? 100 : new Decimal(100).minus(new Decimal(100).div(1 + rs)).toNumber();

	return { avgGain, avgLoss, rsi };


	// .map(({ closePrice }) => 100 / (openPrice / (closePrice - openPrice)))
	// .reduce((movementsByDirection, percentageMovement) => {
	// 	movementsByDirection[percentageMovement > 0 ? 0 : 1].push(percentageMovement);
	// 	return movementsByDirection;
	// }, [[], []])
	// .map((movementsInDirection) => avg(movementsInDirection));

}

function avg(arr) {
	return arr.reduce((accu, num) => accu.add(num), new Decimal(0)).div(arr.length).toNumber();
}