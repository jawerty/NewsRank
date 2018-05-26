const getDateFromTs = (timestamp) => {
	const months = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"]
	const date = new Date(timestamp);
	return `${months[date.getMonth()]} ${date.getDate()}`;
}

export { getDateFromTs };