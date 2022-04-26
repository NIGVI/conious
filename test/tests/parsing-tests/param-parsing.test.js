/* eslint-env jest */

const base = require('../../server-entry-point')
const supertest = require('supertest')
const { setRequest } = require('../../set-request.js')

let server, agent
let request = () => agent


beforeAll(async () => {
	server = await base('parsing-tests/param-parsing.js')

	agent = supertest.agent(server)
})
afterAll(async () => {
	server.close()
})

describe('Сырые запросы без парсинга параметров', () => {
	test('GET /raw',setRequest(request, '/raw', 'raw query equal: \'\''))
	test('GET /raw?', setRequest(request, '/raw?', 'raw query equal: \'\''))
	test('GET /raw?param', setRequest(request, '/raw?param', 'raw query equal: \'param\''))
	test('GET /raw?param=', setRequest(request, '/raw?param=', 'raw query equal: \'param=\''))
	test('GET /raw?param=value', setRequest(request, '/raw?param=value', 'raw query equal: \'param=value\''))
})

describe('Запросы только с парсингом параметров без их проверки', () => {
	test(
		'GET /parse',
		setRequest(
			request,
			'/parse',
			`parse query equal:\n${ JSON.stringify(sortingParams({}), null, 2) }`
		)
	)
	test(
		'GET /parse?',
		setRequest(
			request,
			'/parse?',
			`parse query equal:\n${ JSON.stringify(sortingParams({}), null, 2) }`
		)
	)
	test(
		'GET /parse?param',
		setRequest(
			request,
			'/parse?param',
			`parse query equal:\n${ JSON.stringify(sortingParams({ param: true }), null, 2) }`
		)
	)
	test(
		'GET /parse?param=',
		setRequest(
			request,
			'/parse?param',
			`parse query equal:\n${ JSON.stringify(sortingParams({ param: true }), null, 2) }`
		)
	)
	test(
		'GET /parse?param=value',
		setRequest(
			request,
			'/parse?param=value',
			`parse query equal:\n${ JSON.stringify(sortingParams({ param: 'value' }), null, 2) }`
		)
	)
	test(
		'GET /parse?param=value1&param=value2',
		setRequest(
			request,
			'/parse?param=value1&param=value2',
			`parse query equal:\n${ JSON.stringify(sortingParams({ param: ['value1', 'value2'] }), null, 2) }`
		)
	)


	test(
		'GET /parse?имя-на-русском=значение тоже',
		setRequest(
			request,
			'/parse?имя-на-русском=значение тоже',
			`parse query equal:\n${ JSON.stringify(sortingParams({ 'имя-на-русском': 'значение тоже' }), null, 2) }`
		)
	)
	test(
		'GET /parse?param=value&word=prop',
		setRequest(
			request,
			'/parse?param=value&word=prop',
			`parse query equal:\n${ JSON.stringify(sortingParams({ param: 'value', word: 'prop' }), null, 2) }`
		)
	)
	test(
		'GET /parse?param=value&boolean',
		setRequest(
			request,
			'/parse?param=value&boolean',
			`parse query equal:\n${ JSON.stringify(sortingParams({ param: 'value', boolean: true }), null, 2) }`
		)
	)
})


// mode parse
const typeScheme1 = {
	'str': 'string',
	'num': 'number'
}
describe(`Запросы с приведением типов, вот по этой форме:\n${ JSON.stringify(typeScheme1, null, 2) }`, () => {
	test(
		'GET /parse-1?str=word&num=10',
		setRequest(request, '/parse-1?str=word&num=10', `parse query to parse-1 equal:\n${ JSON.stringify(sortingParams({ str: 'word', num: 10 }), null, 2) }`)
	)
	test(
		'GET /parse-1?str=word',
		setRequest(request, '/parse-1?str=word', `parse query to parse-1 equal:\n${ JSON.stringify(sortingParams({ str: 'word' }), null, 2) }`)
	)
	test(
		'GET /parse-1?num=10',
		setRequest(request, '/parse-1?num=10', `parse query to parse-1 equal:\n${ JSON.stringify(sortingParams({ num: 10 }), null, 2) }`)
	)
	test(
		'GET /parse-1?str=10',
		setRequest(request, '/parse-1?str=10', `parse query to parse-1 equal:\n${ JSON.stringify(sortingParams({ str: '10' }), null, 2) }`)
	)
	test(
		'GET /parse-1?num=word',
		setRequest(request, '/parse-1?num=word', `parse query to parse-1 equal:\n${ JSON.stringify(sortingParams({}), null, 2) }`)
	)
	test(
		'GET /parse-1?str=word&num=word',
		setRequest(request, '/parse-1?str=word&num=word', `parse query to parse-1 equal:\n${ JSON.stringify(sortingParams({ str: 'word' }), null, 2) }`)
	)
	test(
		'GET /parse-1?param=10',
		setRequest(request, '/parse-1?param=10', `parse query to parse-1 equal:\n${ JSON.stringify(sortingParams({}), null, 2) }`)
	)
	test(
		'GET /parse-1?str=word-1&str=word-2',
		setRequest(request, '/parse-1?str=word-1&str=word-2', `parse query to parse-1 equal:\n${ JSON.stringify(sortingParams({ str: 'word-1' }), null, 2) }`)
	)
})


// function check
const typeScheme2 = {
	'date': 'Тут функция которая сделает new Date(value), но только с числом'
}
describe(`Запросы с приведением типов через функцию, вот по этой форме:\n${ JSON.stringify(typeScheme2, null, 2) }`, () => {
	test(
		'GET /parse-2?date=60000',
		setRequest(
			request,
			'/parse-2?date=60000',
			`parse query to parse-2 equal:\n${ JSON.stringify(sortingParams({ date: new Date(60000) }), null, 2) }`
		)
	)
	test(
		'GET /parse-2?date=999999999',
		setRequest(
			request,
			'/parse-2?date=999999999',
			`parse query to parse-2 equal:\n${ JSON.stringify(sortingParams({ date: new Date(999999999) }), null, 2) }`
		)
	)
	test(
		'GET /parse-2?date=word',
		setRequest(
			request,
			'/parse-2?date=word',
			`parse query to parse-2 equal:\n${ JSON.stringify(sortingParams({}), null, 2) }`
		)
	)
	test(
		'GET /parse-2?str=word',
		setRequest(
			request,
			'/parse-2?str=word',
			`parse query to parse-2 equal:\n${ JSON.stringify(sortingParams({}), null, 2) }`
		)
	)
	test(
		'GET /parse-2?date=999999999&str=word',
		setRequest(
			request,
			'/parse-2?date=999999999&str=word',
			`parse query to parse-2 equal:\n${ JSON.stringify(sortingParams({ date: new Date(999999999) }), null, 2) }`
		)
	)
	test(
		'GET /parse-2?date=999999999&date=60000',
		setRequest(
			request,
			'/parse-2?date=999999999&date=60000',
			`parse query to parse-2 equal:\n${ JSON.stringify(sortingParams({ date: new Date(999999999) }), null, 2) }`
		)
	)
})
// end mode parse


// mode scheme
// string array
const typeScheme3 = {
	'name': 'string',
	'?surname': 'string',
	'age': 'number',
	'skill': {
		type: 'string',
		array: true
	}
}
describe(`Запросы с проверкой типов и массивом строк, вот по этой форме:\n${ JSON.stringify(typeScheme3, null, 2) }`, () => {
	test(
		'GET /scheme-3?name=Nikita&surname=Ziuzin&age=20&skill=html&skill=css',
		setRequest(
			request,
			'/scheme-3?name=Nikita&surname=Ziuzin&age=20&skill=html&skill=css',
			`parse query to scheme-3 equal:\n${ JSON.stringify(sortingParams({ name: 'Nikita', surname: 'Ziuzin', age: 20, skill: ['html', 'css'] }), null, 2) }`
		)
	)
	test(
		'GET /scheme-3?name=Nikita&age=20&skill=html&skill=css',
		setRequest(
			request,
			'/scheme-3?name=Nikita&age=20&skill=html&skill=css',
			`parse query to scheme-3 equal:\n${ JSON.stringify(sortingParams({ name: 'Nikita', age: 20, skill: ['html', 'css'] }), null, 2) }`
		)
	)
	test(
		'GET /scheme-3?name=Nikita&age=20&skill=css',
		setRequest(
			request,
			'/scheme-3?name=Nikita&age=20&skill=css',
			`parse query to scheme-3 equal:\n${ JSON.stringify(sortingParams({ name: 'Nikita', age: 20, skill: ['css'] }), null, 2) }`
		)
	)
	test(
		'GET /scheme-3?name=Nikita&age=20',
		setRequest(
			request,
			'/scheme-3?name=Nikita&age=20',
			`parse query to scheme-3 equal:\n${ JSON.stringify(sortingParams({ name: 'Nikita', age: 20, skill: [] }), null, 2) }`
		)
	)
	test(
		'GET /scheme-3?name=Nikita&age=20&param=word',
		setRequest(
			request,
			'/scheme-3?name=Nikita&age=20&param=word',
			`parse query to scheme-3 equal:\n${ JSON.stringify(sortingParams({ name: 'Nikita', age: 20, skill: [] }), null, 2) }`
		)
	)
	test(
		'GET /scheme-3',
		setRequest(
			request,
			'/scheme-3',
			404 
		)
	)
	test(
		'GET /scheme-3?name=Nikita',
		setRequest(
			request,
			'/scheme-3?name=Nikita',
			404
		)
	)
})


// array with min one value
const typeScheme4 = {
	'name': 'string',
	'?surname': 'string',
	'age': 'number',
	'skill': {
		type: 'string',
		min: 1,
		array: true
	}
}
describe(`Запросы с проверкой типов и массивом строк с одним обязательным, вот по этой форме:\n${ JSON.stringify(typeScheme4, null, 2) }`, () => {
	test(
		'GET /scheme-4?name=Nikita&surname=Ziuzin&age=20&skill=html&skill=css',
		setRequest(
			request,
			'/scheme-4?name=Nikita&surname=Ziuzin&age=20&skill=html&skill=css',
			`parse query to scheme-4 equal:\n${ JSON.stringify(sortingParams({ name: 'Nikita', surname: 'Ziuzin', age: 20, skill: ['html', 'css'] }), null, 2) }`
		)
	)
	test(
		'GET /scheme-4?name=Nikita&age=20&skill=html&skill=css',
		setRequest(
			request,
			'/scheme-4?name=Nikita&age=20&skill=html&skill=css',
			`parse query to scheme-4 equal:\n${ JSON.stringify(sortingParams({ name: 'Nikita', age: 20, skill: ['html', 'css'] }), null, 2) }`
		)
	)
	test(
		'GET /scheme-4?name=Nikita&age=20&skill=css',
		setRequest(
			request,
			'/scheme-4?name=Nikita&age=20&skill=css',
			`parse query to scheme-4 equal:\n${ JSON.stringify(sortingParams({ name: 'Nikita', age: 20, skill: ['css'] }), null, 2) }`
		)
	)
	test(
		'GET /scheme-4?name=Nikita&age=20',
		setRequest(
			request,
			'/scheme-4?name=Nikita&age=20',
			404
		)
	)
	test(
		'GET /scheme-4?name=Nikita&age=20&param=word',
		setRequest(
			request,
			'/scheme-4?name=Nikita&age=20&param=word',
			404
		)
	)
	test(
		'GET /scheme-4',
		setRequest(
			request,
			'/scheme-4',
			404 
		)
	)
	test(
		'GET /scheme-4?name=Nikita',
		setRequest(
			request,
			'/scheme-4?name=Nikita',
			404
		)
	)
})


// array with min count
const typeScheme5 = {
	'name': 'string',
	'?surname': 'string',
	'age': 'number',
	'skill': {
		type: 'string',
		min: 2,
		array: true
	}
}
describe(`Запросы с проверкой типов и массивом строк с одним обязательным, вот по этой форме:\n${ JSON.stringify(typeScheme5, null, 2) }`, () => {
	test(
		'GET /scheme-5?name=Nikita&surname=Ziuzin&age=20&skill=html&skill=css',
		setRequest(
			request,
			'/scheme-5?name=Nikita&surname=Ziuzin&age=20&skill=html&skill=css',
			`parse query to scheme-5 equal:\n${ JSON.stringify(sortingParams({ name: 'Nikita', surname: 'Ziuzin', age: 20, skill: ['html', 'css'] }), null, 2) }`
		)
	)
	test(
		'GET /scheme-5?name=Nikita&age=20&skill=html&skill=css',
		setRequest(
			request,
			'/scheme-5?name=Nikita&age=20&skill=html&skill=css',
			`parse query to scheme-5 equal:\n${ JSON.stringify(sortingParams({ name: 'Nikita', age: 20, skill: ['html', 'css'] }), null, 2) }`
		)
	)
	test(
		'GET /scheme-5?name=Nikita&age=20&skill=css',
		setRequest(
			request,
			'/scheme-5?name=Nikita&age=20&skill=css',
			404
		)
	)
	test(
		'GET /scheme-5?name=Nikita&age=20',
		setRequest(
			request,
			'/scheme-5?name=Nikita&age=20',
			404
		)
	)
	test(
		'GET /scheme-5?name=Nikita&age=20&param=word',
		setRequest(
			request,
			'/scheme-5?name=Nikita&age=20&param=word',
			404
		)
	)
	test(
		'GET /scheme-5',
		setRequest(
			request,
			'/scheme-5',
			404 
		)
	)
	test(
		'GET /scheme-5?name=Nikita',
		setRequest(
			request,
			'/scheme-5?name=Nikita',
			404
		)
	)
})


// array with validation function
const typeScheme6 = {
	'name': 'string',
	'?surname': 'string',
	'age': 'number',
	'skill': {
		value: 'Тут функция которая сделает new Data(value), но только с числом',
		array: true
	}
}
describe(`Запросы с проверкой типов и массивом который мы проверяем через функцию, вот по этой форме:\n${ JSON.stringify(typeScheme6, null, 2) }`, () => {
	test(
		'GET /scheme-6?name=Nikita&surname=Ziuzin&age=20&skill=1000&skill=60000',
		setRequest(
			request,
			'/scheme-6?name=Nikita&surname=Ziuzin&age=20&skill=1000&skill=60000',
			`parse query to scheme-6 equal:\n${ JSON.stringify(sortingParams({ name: 'Nikita', surname: 'Ziuzin', age: 20, skill: [new Date(1000), new Date(60000)] }), null, 2) }`
		)
	)
	test(
		'GET /scheme-6?name=Nikita&age=20&skill=1000&skill=60000',
		setRequest(
			request,
			'/scheme-6?name=Nikita&age=20&skill=1000&skill=60000',
			`parse query to scheme-6 equal:\n${ JSON.stringify(sortingParams({ name: 'Nikita', age: 20, skill: [new Date(1000), new Date(60000)] }), null, 2) }`
		)
	)
	test(
		'GET /scheme-6?name=Nikita&age=20&skill=60000',
		setRequest(
			request,
			'/scheme-6?name=Nikita&age=20&skill=60000',
			`parse query to scheme-6 equal:\n${ JSON.stringify(sortingParams({ name: 'Nikita', age: 20, skill: [new Date(60000)] }), null, 2) }`
		)
	)
	test(
		'GET /scheme-6?name=Nikita&age=20',
		setRequest(
			request,
			'/scheme-6?name=Nikita&age=20',
			`parse query to scheme-6 equal:\n${ JSON.stringify(sortingParams({ name: 'Nikita', age: 20, skill: [] }), null, 2) }`
		)
	)
	test(
		'GET /scheme-6?name=Nikita&age=20&param=word',
		setRequest(
			request,
			'/scheme-6?name=Nikita&age=20&param=word',
			`parse query to scheme-6 equal:\n${ JSON.stringify(sortingParams({ name: 'Nikita', age: 20, skill: [] }), null, 2) }`
		)
	)
	test(
		'GET /scheme-6',
		setRequest(
			request,
			'/scheme-6',
			404 
		)
	)
	test(
		'GET /scheme-6?name=Nikita',
		setRequest(
			request,
			'/scheme-6?name=Nikita',
			404
		)
	)
})


// required array with constants
const typeScheme7 = {
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
describe(`Запросы с проверкой типов, вот по этой форме:\n${ JSON.stringify(typeScheme7, null, 2) }`, () => {
	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
})


// no required array with constants
const typeScheme8 = {
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
describe(`Запросы с проверкой типов и необязательным перечислением, вот по этой форме:\n${ JSON.stringify(typeScheme8, null, 2) }`, () => {
	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
})


// several constants values
const typeScheme9 = {
	'skill': {
		value: [
			'HTML',
			'CSS',
			'JavaScript',
			'NodeJS',
			'Docker',
			'другой навык'
		]
	}
}
describe(`Запросы с проверкой типов одного поля с несколькими возможными значениями, вот по этой форме:\n${ JSON.stringify(typeScheme9, null, 2) }`, () => {
	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
})


// several types
const typeScheme10 = {
	'wordOrNumber': {
		type: ['number', 'string']
	}
}
describe(`Запросы с проверкой типов где одно поле при возможности число, вот по этой форме:\n${ JSON.stringify(typeScheme10, null, 2) }`, () => {
	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
})


// default
const typeScheme11 = {
	'wordOrNumber': {
		type: 'string',
		default: 'word'
	}
}
describe(`Запросы с проверкой типов где одно поле при возможности число, вот по этой форме:\n${ JSON.stringify(typeScheme11, null, 2) }`, () => {
	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
})
// end mode scheme


function sortingParams(paramsObject) {
	return Object.entries(paramsObject).sort((el1, el2) => {
		if (el1[0] < el2[0]) return -1
		if (el1[0] === el2[0]) return 0
		if (el1[0] > el2[0]) return 1
	})
}