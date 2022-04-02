/* eslint-env jest */

const base = require('../server-entry-point')
const supertest = require('supertest')
const { setRequest } = require('../set-request.js')

let serverOnlyOptions
let serverShort
let agentOnlyOptions
let agentShort
let requestOnlyOptions = () => agentOnlyOptions
let requestShort = () => agentShort


beforeAll(async () => {
	serverOnlyOptions = await base('content-type_only-options.js')
	serverShort = await base('content-type_short.js')

	agentOnlyOptions = supertest.agent(serverOnlyOptions)
	agentShort = supertest.agent(serverShort)
})
afterAll(async () => {
	serverOnlyOptions.close()
	serverShort.close()
})


testForBaseRouting('Базовый роутинг только через опции', requestOnlyOptions)
testForBaseRouting('Базовый роутинг только сокращенный синтаксис', requestShort)




function testForBaseRouting(msg, request) {

	describe(msg, () => {


		describe('Проверка Content-Type при ручном управлении', () => {
			test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
			// test('GET /', setRequest(request, '/', {
			// 	file: 'files/main.html',
			// 	headers: [
			// 		['Content-Type', 'text/html; charset=UTF-8']
			// 	]
			// }))
		})

	})
}

