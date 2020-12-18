import 'colors';

let initiatedLogTypes;

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
		if (types.includes(type)) console[method](data);
	}
}