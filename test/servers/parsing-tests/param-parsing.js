

const Conious = require('../../../conious')


module.exports = async (server) => {
	
	const options = {
		// defaultHandlers: {
		// 	errorHandler({ err }) {
		// 		setTimeout(() => {
		// 			console.error(err)
		// 		}, 5500);
		// 	}
		// }
	}
	const app = new Conious(server, options)

	// Обычные маршруты
	app.set('/', () => '')


}
