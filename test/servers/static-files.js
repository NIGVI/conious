

const path = require('path')
const { Conious } = require('../../conious')


module.exports = async (server) => {
	
	const options = {
		defaultHandlers: {
			errorHandler({ err }) {
				setTimeout(() => {
					console.log(err)
				}, 2000)
			}
		}
	}
	const app = new Conious(server, options)
	const dirName = path.join(__dirname, 'static')

	await app.static('/static', dirName)

	// index
	await app.static('/index-shortcut', dirName, {
		index: true
	})

	// name
	await app.static('/name-shortcut', dirName, {
		shortName: true
	})

	// all
	await app.static('/shortcut', dirName, {
		index: true,
		shortName: true
	})

}
