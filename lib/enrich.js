import { getAverage, getGainAndLoss, getInitialChangeAverages, getStochRSI_01, getStochRSI_02_K, getWeightedChangeAverages } from './math.js';
import { MA as testMA } from './test.js';

export default function enrich(rawTicks, { stepSize }) {
	return rawTicks.reduce((accu, tickData, index) => {

		const prevTickData = accu[index - 1];

		if (prevTickData) Object.assign(
			tickData,
			getGainAndLoss(tickData.closePrice, prevTickData.closePrice)
		);

		// add human readable date
		const date = new Date(tickData.openTime);
		tickData.humanDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;

		// ensure we have enough candles for the next calculations
		if (accu.length < (stepSize - 1)) return next();

		// calc moving average
		tickData.MA = getAverage(accu
			.slice(-1 * (stepSize - 1))
			.concat(tickData)
			.map(({ closePrice }) => closePrice)
		);
		testMA({ date: tickData.humanDate, MA: tickData.MA });

		// ensure we have enough candles for the next calculations
		if (accu.length < stepSize) return next();

		if (!prevTickData.avgGain) {
			const [avgGain, avgLoss] = getInitialChangeAverages(accu
				.slice(-1 * (stepSize - 1))
				.concat(tickData)
				.map((({ gain, loss }) => ({ gain, loss })))
			);
			Object.assign(tickData, { avgGain, avgLoss });

		} else {
			const { avgGain, avgLoss, rsi } = getWeightedChangeAverages(accu
					.slice(-1)
					.concat(tickData),
				stepSize);
			Object.assign(tickData, { avgGain, avgLoss, RSI: rsi });
		}

		if (!tickData.RSI) return next();
		const lastPeriodRSIs = accu
			.slice(-1 * (stepSize - 1))
			.concat(tickData)
			.map(({ RSI }) => RSI);
		if (!lastPeriodRSIs.every((RSI) => !!RSI)) return next();
		Object.assign(tickData, {
			StochRSI_01: getStochRSI_01(lastPeriodRSIs),
			StochRSI_02_K: getStochRSI_02_K(lastPeriodRSIs)
		});

		const lastPeriodKs = accu
			.slice(-2)
			.concat(tickData)
			.map(({ StochRSI_02_K }) => StochRSI_02_K);
		if (!lastPeriodKs.every((StochRSI_02_K) => !!StochRSI_02_K || StochRSI_02_K === 0)) return next();
		Object.assign(tickData, {
			StochRSI_02_SmoothK: getAverage(lastPeriodKs)
		});

		const lastPeriodSmoothKs = accu
			.slice(-2)
			.concat(tickData)
			.map(({ StochRSI_02_SmoothK }) => StochRSI_02_SmoothK);
		if (!lastPeriodSmoothKs.every((StochRSI_02_SmoothK) => !!StochRSI_02_SmoothK || StochRSI_02_SmoothK === 0)) return next();
		Object.assign(tickData, {
			StochRSI_02_D: getAverage(lastPeriodSmoothKs)
		});

		return next();

		function next() {
			accu.push(tickData);
			return accu;
		}

	}, []);
}