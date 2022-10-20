import 'colors';

import defaults from './defaults.js';

let initiatedLogTypes;

export default function getLogger(types) {
	const { logTypes: defaultLogTypes } = defaults();

	if (!types) {
		if (!initiatedLogTypes) {
			initiatedLogTypes = defaultLogTypes;
			types = initiatedLogTypes;
		}
		types = initiatedLogTypes;
	} else {
		initiatedLogTypes = types;
	}

	return function log(type, data, { method, style } = {}) {
		if (!method) method = 'log';
		if (style) data = data[style];
		if (types[type]) console[method](data);
	}
}