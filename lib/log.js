export default function getLogger(types) {
	return function log(type, data, method = 'log') {
		if (types.includes(type)) console[method](data);
	}
}