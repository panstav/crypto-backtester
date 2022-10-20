export default [

	{
		name: 'Stoch&RSI',
		requirements: {
			tickProperties: ['StochRSI'],
			ticksBatchSize: 4
		},
		strategy: ({ stochThreshold = 20, stochAngle = 2.5, rsiThreshold = 45 }) => [
			stochFlip(stochThreshold, stochAngle),
			lowRsi(rsiThreshold)
		],
		ranges: {
			stochThreshold: [10, 50],
			stochAngle: [0, 5],
			rsiThreshold: [10, 50]
		}
	}

];

function lowRsi(threshold) {
	return (ticks) => ticks[ticks.length - 1].RSI < threshold;
}

function stochFlip(threshold, angle) {
	return (ticks) => {
		if (ticks.length < 3 || ticks.slice(-3).some(({ StochRSI_02_D }) => !StochRSI_02_D && StochRSI_02_D !== 0)) return false;

		const previousSrk = ticks[ticks.length - 2].StochRSI_02_SmoothK;
		const oneBeforeSrk = ticks[ticks.length - 3].StochRSI_02_SmoothK;
		const previousSrd = ticks[ticks.length - 2].StochRSI_02_D;
		const oneBeforeSrd = ticks[ticks.length - 3].StochRSI_02_D;

		return (
			// cross happen between the previous tick and the one before that
			previousSrk > previousSrd
			&& oneBeforeSrk < oneBeforeSrd
			// one of these is lower than threshold
			&& [previousSrk, oneBeforeSrk, previousSrd, oneBeforeSrd].some((stochRsi) => stochRsi < threshold)
			&& ((previousSrk - previousSrd) > angle)
		);
	};
}