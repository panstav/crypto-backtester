import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

import { getAverage } from '../lib/math.js';

export function close_price_rises_in_one_tick(ticks) {
	if (ticks.length < 3) return false;
	const lastClosePrice = ticks[ticks.length - 2].closePrice;
	const previousClosePrice = ticks[ticks.length - 3].closePrice;
	return lastClosePrice > previousClosePrice;
}

export function close_price_falls_in_one_tick(ticks) {
	if (ticks.length < 3) return false;
	const lastClosePrice = ticks[ticks.length - 2].closePrice;
	const previousClosePrice = ticks[ticks.length - 3].closePrice;
	return lastClosePrice < previousClosePrice;
}

export function close_price_lowest_in_n_ticks(n) {
	return (ticks) => {
		if (ticks.length < n) return false;
		return Decimal.min(...ticks.slice(-1 * n).map(({ closePrice }) => closePrice)).toNumber() === ticks[ticks.length - 1].closePrice;
	}
}

export function close_price_highest_in_n_ticks(n) {
	return (ticks) => {
		if (ticks.length < n) return false;
		return Decimal.max(...ticks.slice(-1 * n).map(({ closePrice }) => closePrice)).toNumber() === ticks[ticks.length - 1].closePrice;
	}
}

export function one_position_only(ticks, positions) {
	return !positions.filter(({ resolved }) => !resolved).length;
}

export function trending(direction, { MA7, MA14, MA28, continiously = 1, factor = 0 }) {
	if (direction !== 'up' && direction !== 'down') throw new Error('Direction can be either \'up\' or \'down\'');
	const isUp = direction === 'up';

	if (factor < 1) factor = new Decimal(factor).add(1).toNumber();

	return (ticks) => {

		// ensure there's enough to calculate average
		if ((MA7 && ticks.length < 7)
			|| MA14 && ticks.length < 14
			|| MA28 && ticks.length < 28) return false;

		const results = ticks
			.slice(-1 * (continiously + 2))
			.map((tick, index, array) => {
				if (index >= array.length - 2) return true;

				const greaterTick = isUp ? array[index + 1] : tick;
				const lesserTick = isUp ? tick : array[index + 1];

				if (MA7 && new Decimal(lesserTick.MA7).times(factor).greaterThan(greaterTick.MA7)) return false;
				if (MA14 && new Decimal(lesserTick.MA14).times(factor).greaterThan(greaterTick.MA14)) return false;
				if (MA28 && new Decimal(lesserTick.MA28).times(factor).greaterThan(greaterTick.MA28)) return false;
				return true;
			});

		return results.every((result) => !!result);

	}
}

export function prevalent(changeToClosePrice, timesToAppear, numOfLastTicks) {
	return (ticks) => {
		if (numOfLastTicks > ticks.length) numOfLastTicks = ticks.length;
		const atPrice = new Decimal(ticks[ticks.length - 1].closePrice).times(new Decimal(changeToClosePrice).div(100).add(1)).toNumber();
		return ticks
			.slice(-1 * numOfLastTicks)
			.filter(({ highPrice }) => highPrice > atPrice) // .filter(({ highPrice, lowPrice }) => highPrice > atPrice && lowPrice < atPrice)
			.length >= timesToAppear;
	}
}

function on_change(percentage) {
	return (ticks, positions) => {
    return new Decimal(positions[positions.length - 1].buyPrice).times(new Decimal(100).add(percentage)).div(100).lessThan(ticks[ticks.length - 2].closePrice);
	}
}

export function grab_on_profit(percentage) {
	return (ticks, positions) => {
		return new Decimal(positions[positions.length - 1].buyPrice).times(new Decimal(100).add(percentage)).div(100).lessThan(getAverage([ticks[ticks.length - 2].closePrice, ticks[ticks.length - 1].closePrice]));
	}
}

export function stochKnD_bottom_cross(ticks) {
	if (ticks.length < 3 || ticks.slice(-3).some(({ StochRSI_02_D }) => !StochRSI_02_D && StochRSI_02_D !== 0)) return false;

	const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
	const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
	const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
	const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;

	return (
		// cross happen between the previous tick and the one before that
		previousSrk > previousSrd
		&& oneBeforeSrk < oneBeforeSrd
		// one of these is lower than 20
		&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi < 20)
	);

}

export function stochKnD_generous_bottom_cross(ticks) {
	if (ticks.length < 3 || ticks.slice(-3).some(({ StochRSI_02_D }) => !StochRSI_02_D && StochRSI_02_D !== 0)) return false;

	const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
	const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
	const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
	const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;

	return (
		// cross happen between the previous tick and the one before that
		previousSrk > previousSrd
		&& oneBeforeSrk <= oneBeforeSrd
		// one of these is lower than 20
		&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi < 20)
	);

}

export function stochKnD_touched_bottom(ticks) {
	if (ticks.length < 3 || ticks.slice(-3).some(({ StochRSI_02_D }) => !StochRSI_02_D && StochRSI_02_D !== 0)) return false;

	const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
	const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
	const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
	const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;

	return (
		// one of these is lower than 20
		[previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi < 20)
	);

}

export function stochKnD_touched_top(ticks) {
	if (ticks.length < 3 || ticks.slice(-3).some(({ StochRSI_02_D }) => !StochRSI_02_D && StochRSI_02_D !== 0)) return false;

	const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
	const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
	const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
	const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;

	return (
		// one of these is higher than 80
		[previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi > 80)
	);

}

export function stochKnD({ cross: crossDireciotn, top = 80, bottom = 20, kOverD = 0 }) {
	return (ticks) => {
		if (ticks.length < 3 || ticks.slice(-3).some(({ StochRSI_02_D }) => !StochRSI_02_D && StochRSI_02_D !== 0)) return false;

		const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
		const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
		const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
		const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;

		if (crossDireciotn === 'bottom') return (
			// cross happen between the previous tick and the one before that
			previousSrk > previousSrd
			&& oneBeforeSrk < oneBeforeSrd
			// one of these is lower than 20
			&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi < bottom)
			&& ((previousSrk - previousSrd) > kOverD)
		);

		if (crossDireciotn === 'top') return (
			// cross happen between the previous tick and the one before that
			previousSrk < previousSrd
			&& oneBeforeSrk > oneBeforeSrd
			// one of these is higher than 80
			&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochThing) => stochThing > top)
			&& ((previousSrd - previousSrk) > kOverD)
		);

		throw new Error(`Wrong crossDireciotn: ${crossDireciotn}`)

	}
}

export function stochKnD_top_cross(ticks) {
	if (ticks.length < 3 || ticks.slice(-3).some(({ StochRSI_02_D }) => !StochRSI_02_D && StochRSI_02_D !== 0)) return false;

	const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
	const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
	const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
	const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;

	return (
		// cross happen between the previous tick and the one before that
		previousSrk < previousSrd
		&& oneBeforeSrk > oneBeforeSrd
		// one of these is higher than 80
		&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochThing) => stochThing > 80)
	);

}

export function stochKnD_generous_top_cross(ticks) {
	if (ticks.length < 3 || ticks.slice(-3).some(({ StochRSI_02_D }) => !StochRSI_02_D && StochRSI_02_D !== 0)) return false;

	const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
	const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
	const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
	const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;

	return (
		// cross happen between the previous tick and the one before that
		previousSrk < previousSrd
		&& oneBeforeSrk >= oneBeforeSrd
		// one of these is higher than 80
		&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochThing) => stochThing > 80)
	);

}

export function either(...fns) {
	return (ticks, positions) => {
		return fns.some((fn) => fn(ticks, positions));
	}
}

export function daysPast(maximumDays) {
	return (ticks, positions) => {
		return ticks[ticks.length - 1].openTime > positions
			.filter((position) => !position.resolved)[0]
			.buyTime + (86400000 * maximumDays);
	}
}

export function optimist(percentageStep) {
	return (ticks, positions) => {
		return positions.some((position) => {
			if (position.resolved) return false;
			const currentPrice = getAverage([ticks[ticks.length - 1].openPrice, ticks[ticks.length - 1].closePrice]);
			const currentPercentageRelativeToBuyPrice = new Decimal(currentPrice).minus(position.buyPrice).times(100).div(position.buyPrice);
			const currentStep = currentPercentageRelativeToBuyPrice.div(percentageStep).floor().toNumber();
			const previousPrice = getAverage([ticks[ticks.length - 2].openPrice, ticks[ticks.length - 2].closePrice]);
			const previousPercentageRelativeToBuyPrice = new Decimal(previousPrice).minus(position.buyPrice).times(100).div(position.buyPrice);
			const previousStep = previousPercentageRelativeToBuyPrice.div(percentageStep).floor().toNumber();
			return 0 <= currentStep && currentStep < previousStep;
		});
	}
}

export function keeper(percentageStep) {
	return (ticks, positions) => {
		const currentBid = getAverage([ticks[ticks.length - 2].closePrice, ticks[ticks.length - 1].closePrice]);
		const yesterdayBid = getAverage([ticks[ticks.length - 3].closePrice, ticks[ticks.length - 2].closePrice]);
		const buyPrice = positions[positions.length - 1].buyPrice;
		if (currentBid > yesterdayBid || yesterdayBid < buyPrice) return false;
		const precentOffBuyPrice = new Decimal(buyPrice).div(100).times(percentageStep).toNumber();
		return (new Decimal(currentBid).minus(buyPrice)).div(precentOffBuyPrice).abs().floor()
			.lessThan((new Decimal(yesterdayBid).minus(buyPrice)).div(precentOffBuyPrice).abs().floor())
	}
}

// export function stepsAwayFromPeak(steps, interval) {
// 	steps *= 3600000;
// 	if (interval.includes('d')) steps *= 24;
//
// 	return (ticks) => {
//
// 		return ticks
// 			.reduce((top3, tick) => [...top3, tick].sort((a, b) => b.highPrice - a.highPrice).slice(0, 3), [])
// 			.every((topTick) => ((ticks[ticks.length - 1].openTime - topTick.closeTime) > steps));
//
// 		// const averages = ticks
// 		// 	.map(({ closePrice }) => closePrice)
// 		// 	.reduce((accu, closePrice) => {
// 		// 		if (accu[accu.length - 1].length === config.stepSize) {
// 		// 			accu.push([closePrice]);
// 		// 		} else {
// 		// 			accu[accu.length - 1].push(closePrice);
// 		// 		}
// 		// 		return accu;
// 		// 	}, [[]])
// 		// 	.map((step) => getAverage(step));
// 		//
// 		// const greatestAverage = Decimal.max(...averages).toNumber();
// 		// return averages
// 		// 	.slice(-1 * steps)
// 		// 	.filter((avg) => avg < greatestAverage)
// 		// 	.length < top;
// 	};
// }