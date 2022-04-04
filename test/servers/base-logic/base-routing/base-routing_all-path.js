

const Conious = require('../../../../conious')


module.exports = async (server) => {
	
	const options = {}
	const app = new Conious(server, options)

	app.set('/**-post', () => {
		return 'postfix'
	})
	app.set('/**/end', () => {
		return '/**/end path'
	})

	app.set('/**', () => {
		return 'On any path'
	})
}
