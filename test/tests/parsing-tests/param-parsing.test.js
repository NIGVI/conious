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
	test('GET /raw', setRequest(request, '/raw', 'raw query equal: \'\''))
	test('GET /raw?', setRequest(request, '/raw?', 'raw query equal: \'\''))
	test('GET /raw?param', setRequest(request, '/raw?param', 'raw query equal: \'param\''))
	test('GET /raw?param=', setRequest(request, '/raw?param', 'raw query equal: \'param=\''))
	test('GET /raw?param=value', setRequest(request, '/raw?param=value', 'raw query equal: \'param=value\''))
})

describe('Запросы только с парсингом параметров без их проверки', () => {
	test('GET /parse', setRequest(request, '/parse', `parse query equal:\n${ JSON.stringify(sortingParams({}), null, 2) }`))
	test('GET /parse?', setRequest(request, '/parse?', `parse query equal:\n${ JSON.stringify(sortingParams({}), null, 2) }`))
	test('GET /parse?param', setRequest(request, '/parse?param', `parse query equal:\n${ JSON.stringify(sortingParams({ param: true }), null, 2) }`))
	test('GET /parse?param=', setRequest(request, '/parse?param', `parse query equal:\n${ JSON.stringify(sortingParams({ param: true }), null, 2) }`))
	test('GET /parse?param=value', setRequest(request, '/parse?param=value', `parse query equal:\n${ JSON.stringify(sortingParams({ param: 'value' }), null, 2) }`))
	test('GET /parse?param=value1&param=value2', setRequest(request, '/parse?param=value1&param=value2', `parse query equal:\n${ JSON.stringify(sortingParams({ param: ['value1', 'value2'] }), null, 2) }`))

	test('GET /parse?имя-на-русском=значение тоже', setRequest(request, '/parse?имя-на-русском=значение тоже', `parse query equal:\n${ JSON.stringify(sortingParams({ 'имя-на-русском': 'значение тоже' }), null, 2) }`))
	test('GET /parse?param=value&word=prop', setRequest(request, '/parse?param=value&word=prop', `parse query equal:\n${ JSON.stringify(sortingParams({ param: 'value', word: 'prop' }), null, 2) }`))
	test('GET /parse?param=value&boolean', setRequest(request, '/parse?param=value&boolean', `parse query equal:\n${ JSON.stringify(sortingParams({ param: 'value', boolean: true }), null, 2) }`))
})

// with array setting
const typeScheme1 = {
	'str': 'string',
	'num': 'number'
}
describe(`Запросы с приведением типов, вот по этой форме:\n${ JSON.stringify(typeScheme1, null, 2) }`, () => {
	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
})

const typeScheme2 = {
	'data': 'Тут функция которая сделает new Data(value), но только с числом'
}
describe(`Запросы с приведением типов через функцию, вот по этой форме:\n${ JSON.stringify(typeScheme2, null, 2) }`, () => {
	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
})

const typeScheme3 = {
	'name': 'string',
	'?surname': 'string',
	'age': 'number',
	'skill': [
		[true, 'HTML'], // отображает только если есть
		[true, 'CSS'],
		[true, 'JavaScript'],
		[true, 'NodeJS'],
		[false, 'Docker'], // опциональный
		[false, 'другой навык']
	]
}
describe(`Запросы с проверкой типов, вот по этой форме:\n${ JSON.stringify(typeScheme3, null, 2) }`, () => {
	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
})

const typeScheme4 = {
	'name': 'string',
	'?surname': 'string',
	'age': 'number',
	'?skill': [ // объект сам не обязательный
		[true, 'HTML'], // если в нем что то не соответствует не отображается весь
		[true, 'CSS'],
		[true, 'JavaScript'],
		[true, 'NodeJS'],
		[false, 'Docker'],
		[false, 'другой навык']
	]
}
describe(`Запросы с проверкой типов и необязательным перечислением, вот по этой форме:\n${ JSON.stringify(typeScheme4, null, 2) }`, () => {
	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
})
// end with array setting


// without array setting
describe(`Запросы с приведением типов (с выключенным значением массива), вот по этой форме:\n${ JSON.stringify(typeScheme1, null, 2) }`, () => {
	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
})
describe(`Запросы с приведением типов через функцию (с выключенным значением массива), вот по этой форме:\n${ JSON.stringify(typeScheme2, null, 2) }`, () => {
	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
})
describe(`Запросы с проверкой типов (с выключенным значением массива), вот по этой форме:\n${ JSON.stringify(typeScheme3, null, 2) }`, () => {
	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
})
describe(`Запросы с проверкой типов и необязательным перечислением (с выключенным значением массива), вот по этой форме:\n${ JSON.stringify(typeScheme4, null, 2) }`, () => {
	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
})
// end without array setting

function sortingParams(paramsObject) {
	return Object.entries(paramsObject).sort((el1, el2) => {
		if (el1[0] < el2[0]) return -1
		if (el1[0] === el2[0]) return 0
		if (el1[0] > el2[0]) return 1
	})
}