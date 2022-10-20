export default function getSignals(ticks, { strategy, requirements }) {

	let signals = [];

	ticks.reduce((ticksHistory, tick) => {

		ticksHistory.push(tick);
		if (ticksHistory.length < 24) return ticksHistory;
		debugger;

		const ticksBatch = ticksHistory.slice(-1 * requirements.ticksBatchSize);
		if (strategy.every((term) => term(ticksBatch))) signals.push(tick);

		return ticksHistory;
	}, []);

	return signals;
}