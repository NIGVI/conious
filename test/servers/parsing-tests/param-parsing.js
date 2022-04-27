

const { Conious } = require('../../../conious')


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
	app.set('/raw', {
		params: {
			mode: 'raw'
		},
		handler: ({ params }) => `raw query equal: '${ params }'`
	})

	app.set('/parse', {
		params: {
			mode: 'parse'
		},
		handler: ({ params }) => `parse query equal:\n${ JSON.stringify(sortingParams(params), null, 2) }`
	})


	// mode parse
	app.set('/parse-1', {
		params: {
			mode: 'parse',
			scheme: {
				'str': 'string',
				'num': 'number'
			}
		},
		handler: ({ params }) => `parse query to parse-1 equal:\n${ JSON.stringify(sortingParams(params), null, 2) }`
	})

	app.set('/parse-2', {
		params: {
			mode: 'parse',
			scheme: {
				'date': (value) => {
					if (/^d+|-d+|d+\.d+|-d+\.d+$/.test(value)) {
						return { ok: true, value: new Date(+value) }
					}
					return { ok: false, value: null }
				}
			}
		},
		handler: ({ params }) => `parse query to parse-2 equal:\n${ JSON.stringify(sortingParams(params), null, 2) }`
	})
	// end mode parse


	// mode scheme
	app.set('/scheme-3', {
		params: {
			mode: 'scheme',
			scheme: {
				'name': 'string',
				'?surname': 'string',
				'age': 'number',
				'skill': {
					type: 'string',
					array: true
				}
			}
		},
		handler: ({ params }) => `parse query to scheme-3 equal:\n${ JSON.stringify(sortingParams(params), null, 2) }`
	})

	app.set('/scheme-4', {
		params: {
			mode: 'scheme',
			scheme: {
				'name': 'string',
				'?surname': 'string',
				'age': 'number',
				'skill': {
					type: 'string',
					min: 1,
					array: true
				}
			}
		},
		handler: ({ params }) => `parse query to scheme-4 equal:\n${ JSON.stringify(sortingParams(params), null, 2) }`
	})

	app.set('/scheme-5', {
		params: {
			mode: 'scheme',
			scheme: {
				'name': 'string',
				'?surname': 'string',
				'age': 'number',
				'skill': {
					type: 'string',
					min: 2,
					array: true
				}
			}
		},
		handler: ({ params }) => `parse query to scheme-5 equal:\n${ JSON.stringify(sortingParams(params), null, 2) }`
	})

	app.set('/scheme-6', {
		params: {
			mode: 'scheme',
			scheme: {
				'name': 'string',
				'?surname': 'string',
				'age': 'number',
				'skill': {
					value: (value) => {
						if (value.test(/d+|-d+|d+\.d+|-d+\.d+/)) {
							return { ok: true, value: new Date(+value) }
						}
						return { ok: false, value: null }
					},
					array: true
				}
			}
		},
		handler: ({ params }) => `parse query to scheme-6 equal:\n${ JSON.stringify(sortingParams(params), null, 2) }`
	})

	app.set('/scheme-7', {
		params: {
			mode: 'scheme',
			scheme: {
				'name': 'string',
				'?surname': 'string',
				'age': 'number',
				'skill': {
					value: [
						{
							value: 'HTML',
							require: true
						},
						{
							value: 'CSS',
							require: true
						},
						{
							value: 'JavaScript',
							require: true
						},
						{
							value: 'NodeJS',
							require: true
						},
						'Docker',
						'другой навык'
					],
					array: true
				}
			}
		},
		handler: ({ params }) => `parse query to scheme-7 equal:\n${ JSON.stringify(sortingParams(params), null, 2) }`
	})

	app.set('/scheme-8', {
		params: {
			mode: 'scheme',
			scheme: {
				'name': 'string',
				'?surname': 'string',
				'age': 'number',
				'?skill': { // объект сам не обязательный
					value: [ // если в нем что то не соответствует не отображается весь
						{
							value: 'HTML',
							require: true
						},
						{
							value: 'CSS',
							require: true
						},
						{
							value: 'JavaScript',
							require: true
						},
						{
							value: 'NodeJS',
							require: true
						},
						'Docker',
						'другой навык'
					],
					array: true
				}
			}
		},
		handler: ({ params }) => `parse query to scheme-8 equal:\n${ JSON.stringify(sortingParams(params), null, 2) }`
	})
	// end mode scheme

}

function sortingParams(paramsObject) {
	return Object.entries(paramsObject).sort((el1, el2) => {
		if (el1[0] < el2[0]) return -1
		if (el1[0] === el2[0]) return 0
		if (el1[0] > el2[0]) return 1
	})
}