

const fs = require('fs')
const path = require('path')
const Conious = require('../../conious')


module.exports = async (server) => {
	
	const options = {}
	const app = new Conious(server, options)

	app.set({
		path: '/',
		method: 'get',
		output: 'html',
		handler() {
			return fs.createReadStream(path.join(__dirname, './files/main.html'))
		}
	})


}
