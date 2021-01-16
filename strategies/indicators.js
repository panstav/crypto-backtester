import DecimalJS from 'decimal.js';
const Decimal = DecimalJS.Decimal;
Decimal.set({ precision: 9 });

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

export function trending(direction, { MA7, MA14, MA28, continiously = 1 }) {
	if (direction !== 'up' && direction !== 'down') throw new Error('Direction can be either \'up\' or \'down\'');
	const isUp = direction === 'up';

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

				if (MA7 && new Decimal(lesserTick.MA7).greaterThan(greaterTick.MA7)) return false;
				if (MA14 && new Decimal(lesserTick.MA14).greaterThan(greaterTick.MA14)) return false;
				if (MA28 && new Decimal(lesserTick.MA28).greaterThan(greaterTick.MA28)) return false;
				return true;
			});

		return results.every((result) => !!result);

	}
}

export function prevalent(changeToClosePrice, timesToAppear, numOfLastTicks) {
	return (ticks) => {
		if (numOfLastTicks > ticks.length) numOfLastTicks = ticks.length;
		const atPrice = new Decimal(ticks[ticks.length - 1].closePrice).times(new Decimal(100).add(changeToClosePrice)).div(100).toNumber();
		return ticks
			.slice(-1 * numOfLastTicks)
			.filter(({ highPrice }) => highPrice > atPrice)
			.length >= timesToAppear;
	}
}

export function grab_on_profit(percentage) {
	return (ticks, positions) => {
    return new Decimal(positions[positions.length - 1].buyPrice).times(new Decimal(100).add(percentage)).div(100).lessThan(ticks[ticks.length - 2].closePrice);
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