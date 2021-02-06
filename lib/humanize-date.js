export default function humanizeDate(milisecs, withHours) {
	const date = new Date(milisecs);
	return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}${withHours ? ` ${date.getHours()}:00` : ''}`;
}