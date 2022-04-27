/* eslint-env jest */

const base = require('../../server-entry-point')
const supertest = require('supertest')
const { setRequest } = require('../../set-request.js')

let server, agent
let request = () => agent


beforeAll(async () => {
	server = await base('parsing-tests/param-parsing.js')

	agent = supertest.agent(server).get('/d')
})
afterAll(async () => {
	server.close()
})


describe('Тестирование обычных полей в режиме parse', () => {

	test('/parse/field с param=value', setRequest(request, '/parse/field', {
		form: {
			param: 'value'
		},
		body: sortingParams({
			param: 'value'
		})
	}))

	test('/parse/field с param1=value1&param2=value2', setRequest(request, '/parse/field', {
		form: {
			param1: 'value1',
			param2: 'value2'
		},
		body: sortingParams({
			param1: 'value1',
			param2: 'value2'
		})
	}))

})

describe('Тестирование файлов', () => {

	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))

})

describe('Тестирование файлов и обычных полей в режиме parse', () => {

	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))

})

describe('Тестирование файлов из стрима busboy', () => {

	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))

})

describe('Тестирование файлов с временной папкой', () => {

	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))

})

describe('Тестирование файлов с временной папкой и стримом из нее', () => {

	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))

})



function sortingParams(paramsObject) {
	return Object.entries(paramsObject).sort((el1, el2) => {
		if (el1[0] < el2[0]) return -1
		if (el1[0] === el2[0]) return 0
		if (el1[0] > el2[0]) return 1
	})
}