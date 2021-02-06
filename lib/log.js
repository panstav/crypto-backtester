import 'colors';

import config from '../config.js';
const { logTypes } = config;

let initiatedLogTypes = logTypes;
// let initiatedLogTypes;

export default function getLogger(types) {

	if (!types) {
		if (!initiatedLogTypes) throw 'No logger initiated';
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