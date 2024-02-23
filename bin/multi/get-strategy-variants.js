export default function getStrategyVariants({ name, strategy, variedProperties }) {

	// prep counter with first values
	const propertiesCounter = Object.keys(variedProperties).reduce((variantPropertiesAccu, key) => {
		variantPropertiesAccu.push({ key, value: 0 });
		return variantPropertiesAccu;
	}, []);

	let strategyAccu = [];
	let finished;

	while (!finished) {

		const variant = propertiesCounter.reduce((accu2, { key, value }) => {
			accu2[key] = variedProperties[key][value];
			return accu2;
		}, {});

		strategyAccu.push({
			variant,
			name: `${name}${propertiesCounter.reduce((accu2, iteratedArgument) => {
				return `${accu2}-${iteratedArgument.key}${iteratedArgument.value}`;
			}, '')}`,
			strategy: strategy(variant)
		});

		increment();
	}

	return strategyAccu;

	function increment() {

		if (propertiesCounter.every(({ key, value }) => value === variedProperties[key].length - 1)) {
			finished = true;
			return;
		}

		let bumped, index = 0;

		while (!bumped && index < propertiesCounter.length) {

			if (propertiesCounter[index].value + 1 > variedProperties[propertiesCounter[index].key].length - 1) {
				index++;
			} else {

				propertiesCounter[index].value++;
				bumped = true;

				if (index !== 0) {
					let i = 0;
					while (i < index) {
						propertiesCounter[i].value = 0;
						i++;
					}
				}

			}

		}
	}

}