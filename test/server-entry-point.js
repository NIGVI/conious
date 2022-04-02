

const path = require('path')
const http = require('http')


module.exports = async (testNameOrPath) => {
	const server = http.createServer()
	const setHandlers = require(path.resolve(__dirname, 'servers', testNameOrPath))
	await setHandlers(server)
	return server
}