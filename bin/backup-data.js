import fs from 'fs-extra';

import defaults from '../lib/defaults.js';

(async () => {
	const { intervals } = defaults();

	const filesAtDataDir = await fs.readdir('./data');

	const filesByInterval = splitByInterval(filesAtDataDir, intervals);

	await Promise.all(intervals.reduce((accu, interval) => accu.concat(filesByInterval[interval]
		.map((fileName) => fs.copy(`./data/${fileName}`, `./historical-data/${interval}/${fileName}`))), []));

	function splitByInterval(filenames, intervals) {
		return filenames.reduce((accu, fileName) => {
			const key = intervals.find((interval) => fileName.includes(interval));
			accu[key] = [...(accu[key] || []), fileName];
			return accu;
		}, {});
	}

})();
