/* eslint-env jest */

const base = require('../../server-entry-point')
const supertest = require('supertest')
const { setRequest } = require('../../set-request.js')

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


testForBaseRouting('Пустой тест', requestOnlyOptions) // 'Базовый роутинг только через опции'
// testForBaseRouting('Базовый роутинг только сокращенный синтаксис', requestShort)




function testForBaseRouting(msg, request) {

	describe(msg, () => {

		test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))

	})
}

const typeScheme1 = {
	'str': 'string',
	'num': 'number'
}
const typeScheme2 = {
	'data': 'Тут функция которая сделает new Data(value), но только с числом'
}
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