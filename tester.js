import jsonFile from 'jsonfile';

const cacheSize = 14;
const cache = [];

(async () => {

	const data = await jsonFile.readFile('./data/ATOM-USDT.json');

	data.map((tick) => {


	});

})();