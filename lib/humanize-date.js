export default function humanizeDate(milliseconds, withHours) {
	const date = new Date(milliseconds);
	return `${(date.getDate() + '').padStart(2 ,'0')}/${(date.getMonth() + 1 + '').padStart(2, '0')}/${date.getFullYear()}${withHours ? ` ${(date.getHours() + '').padStart(2, '0')}:00` : ''}`;
}