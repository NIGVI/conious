

const path = require('path')
const { Conious } = require('../../conious')


module.exports = async (server) => {
	
	const options = {}
	const app = new Conious(server, options)
	const dirName = path.join(__dirname, 'static')

	await app.static({
		path: 'static-1',
		dirPath: dirName
	})
	await app.static('static-2', dirName)

	// index
	await app.static({
		path: 'index-shortcut-1',
		dirPath: dirName,
		index: true
	})
	await app.static('index-shortcut-2', dirName, {
		index: true
	})

	// name
	await app.static({
		path: 'name-shortcut-1',
		dirPath: dirName,
		shortName: true
	})
	await app.static('name-shortcut-2', dirName, {
		shortName: true
	})

	// all
	await app.static({
		path: 'shortcut-1',
		dirPath: dirName,
		index: true,
		shortName: true
	})
	await app.static('shortcut-2', dirName, {
		index: true,
		shortName: true
	})

}
