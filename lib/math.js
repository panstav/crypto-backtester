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

export function getStochRSI_01(RSIs) {
	const minRSI = Decimal.min(...RSIs);
	return new Decimal(100).times(new Decimal(new Decimal(RSIs[RSIs.length - 1]).minus(minRSI)).div(Decimal.max(...RSIs).minus(minRSI))).round().toNumber();
}

export function getStochRSI_02_K(RSIs) {
	const highest = Decimal.max(...RSIs).toNumber();
	const lowest = Decimal.min(...RSIs).toNumber();
	return new Decimal(100).times(new Decimal(RSIs[RSIs.length - 1]).minus(lowest)).div(new Decimal(highest).minus(lowest)).toNumber();
}

export function getStochRSI_02(RSIs, stepSize) {

	const StochKs = RSIs.reduce((ks, rsi, index) => {
		const beginIndex = Decimal.min(0, ((stepSize - 1) - index)).toNumber();
		const periodRSIs = RSIs.slice(beginIndex, beginIndex + stepSize);
		const highest = Decimal.max(...periodRSIs).toNumber();
		const lowest = Decimal.min(...periodRSIs).toNumber();
		const StochK = new Decimal(100).times(new Decimal(rsi).minus(lowest)).div(new Decimal(highest).minus(lowest)).toNumber();
		ks.push(StochK);
		if (ks.length < stepSize) return ks;
	}, []);

	const StochK = new Decimal(100).times(new Decimal(RSIs[RSIs.length - 1]).minus(lowest)).div(new Decimal(highest).minus(lowest)).toNumber();
	// const StochK = new Decimal(new Decimal((new Decimal(RSIs[RSIs.length - 1]).minus(lowest)).div(new Decimal(highest).minus(lowest)))).times(100).toNumber();
	// const last3StochK = RSIs.slice(-3, -1).map(({ StochK }) => StochK).concat(StochK);
	// if (!last3StochK.every((StochK) => !!StochK)) return { StochK };
	return {
		StochK: 1,
		StochD: getAverage(last3StochK)
	};
}

// function smaRsi(closes, prevTickData) {
//
// 	const changeModifier = 0.07142857;
// 	const latestClose = closes[closes.length - 1];
//
// 	const [avgGain, avgLoss] = prevTickData[`RSI${stepSize}`]
//
// 		? [
// 			new Decimal(latestClose).times(changeModifier).add(new Decimal(prevTickData[`RSI${stepSize}`].avgGain).times(new Decimal(1).minus(changeModifier))),
// 			new Decimal(latestClose).times(changeModifier).add(new Decimal(prevTickData[`RSI${stepSize}`].avgLoss).times(new Decimal(1).minus(changeModifier)))
// 		]
//
// 		: closes.reduce((accu, close, index, closes) => {
// 			const previousClose = closes[index - 1];
// 			if (!previousClose) return accu;
// 			const change = Decimal.max(new Decimal(close).minus(previousClose));
// 			accu[change.toNumber() > 0 ? 0 : 1].push(change.abs().toNumber());
// 			// accu[0].push(Decimal.max(new Decimal(close).minus(previousClose), 0).toNumber());
// 			// accu[1].push(Decimal.max(new Decimal(previousClose).minus(close), 0).toNumber());
// 			return accu;
// 		}, [[], []])
// 			.reduce((changes, changeArr) => [...changes, getAverage(changeArr)], []);
//
// 	const rs = new Decimal(avgGain).div(avgLoss).toNumber();
//
// 	const rsi = (avgLoss === 0) ? 100 : new Decimal(100).minus(new Decimal(100).div(1 + rs)).toNumber();
//
// 	return { avgGain, avgLoss, rsi };


	// .map(({ closePrice }) => 100 / (openPrice / (closePrice - openPrice)))
	// .reduce((movementsByDirection, percentageMovement) => {
	// 	movementsByDirection[percentageMovement > 0 ? 0 : 1].push(percentageMovement);
	// 	return movementsByDirection;
	// }, [[], []])
	// .map((movementsInDirection) => avg(movementsInDirection));

// }

// function ema(arr, stepSize) {
// 	debugger;
// 	const multiplier = new Decimal(2).div(stepSize + 1);
// 	return arr.reduce((accu, num, index) => {
// 		if (index === 0) return accu;
// 		accu.push(multiplier.times(num).add(new Decimal(1).minus(multiplier)).times(accu.slice(-1)[0]).toNumber());
// 		return accu;
// 	}, []);
// }

// Binance charts show the initials MA, but they present an average, not a mean average
// tickData[`MA${stepSize}`] = avg(filteredAccu.reduce(([ smallest, largest ], { closePrice }) => [
// 	Math.min(closePrice, smallest), Math.max(closePrice, largest)
// ], [Infinity, 0]));

// function rsi(data, len) {
// 	var length = (!len) ? 13 : len - 1;
// 	var pl = [], arrsi = [];
// 	for (var i = 1; i < data.length; i++) {
// 		var diff = (data[i] - data[i - 1]) / data[i] * 100;
// 		pl.push(diff);
// 		if (pl.length >= length) {
// 			var gain = 0, loss = 0;
// 			for (let q in pl) {
// 				if (pl[q] < 0) loss += pl[q];
// 				if (pl[q] >= 0) gain += pl[q];
// 			}
// 			gain /= length;
// 			loss = (Math.abs(loss)) / length;
// 			let result = Number(100 - 100 / (1 + (gain / loss)));
// 			arrsi.push(result);
// 			var diff = (data[i] - data[i - 1]) / data[i] * 100;
// 			pl.push(diff);
// 			pl.splice(0, 1);
// 		}
// 	}
// 	return arrsi;
// }