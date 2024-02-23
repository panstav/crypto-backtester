export default {

	'current-closed-below-threshold': (ticks, threshold) => {
		const { currentTick } = getTicks(ticks);

		if (!currentTick) {
			debugger;

		}

		return currentTick.StochRSI_02_SmoothK < threshold;
	},

	// 'previous-closed-below-threshold-current-closed-above-previous': (ticks, threshold) => {
	// 	const { currentTick, previousTick } = getTicks(ticks);
	// 	return previousTick.StochRSI_02_SmoothK < threshold && previousTick.StochRSI_02_SmoothK > currentTick.StochRSI_02_SmoothK;
	// },

	// 'previous-closed-below-threshold-current-closed-above-threshold': (ticks, threshold) => {
	// 	const { currentTick, previousTick } = getTicks(ticks);
	// 	return previousTick.StochRSI_02_SmoothK < threshold && currentTick.StochRSI_02_SmoothK > threshold;
	// }

};

function getTicks (ticks) {
	return {
		currentTick: ticks[ticks.length - 1],
		previousTick: ticks[ticks.length - 2]
	};
}