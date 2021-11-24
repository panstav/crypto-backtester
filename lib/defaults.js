import config from '../config.js';

let defaults = null;

export default function getDefaults(options, ...opts) {

	if (!defaults) {
		defaults = Object.assign({}, config, options, ...opts);
		return defaults;
	}

	return Object.assign({}, defaults, options, ...opts);
}