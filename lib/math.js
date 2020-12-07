import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

export function getAverage(arr) {
	return arr.reduce((accu, num) => accu.add(num), new Decimal(0)).div(arr.length).toNumber();
}

export function getGainAndLoss(close, previousClose) {
	return {
		gain: Decimal.max(new Decimal(close).minus(previousClose), 0).toNumber(),
		loss: Decimal.max(new Decimal(previousClose).minus(close), 0).toNumber()
	};
}

export function getInitialChangeAverages(changes) {
	return changes.reduce(([ gains, losses ], { gain, loss }) => {
		gains.push(gain);
		losses.push(loss);
		return [ gains, losses ];
	}, [[], []])
		.map((changes) => getAverage(changes));
}

export function getWeightedChangeAverages([previousTick, currentTick], stepSize) {
	const modifier = new Decimal(1).div(stepSize).toNumber();

	const avgGain = new Decimal(currentTick.gain).times(modifier).add(new Decimal(previousTick.avgGain).times(new Decimal(1).minus(modifier))).toNumber();
	const avgLoss = new Decimal(currentTick.loss).times(modifier).add(new Decimal(previousTick.avgLoss).times(new Decimal(1).minus(modifier))).toNumber();
	const rs = new Decimal(avgGain).div(avgLoss).toNumber();
	const rsi = (avgLoss === 0) ? 100 : new Decimal(100).minus(new Decimal(100).div(new Decimal(1).add(rs))).toNumber();

	return {
		avgGain,
		avgLoss,
		rsi
	};
}