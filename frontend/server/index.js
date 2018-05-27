const server = require('./app');
const port = 3000;

server.listen(port, () => {
	console.log(`Running NewsRank frontend on port ${port}...`)
});