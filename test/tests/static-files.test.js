/* eslint-env jest */

const base = require('../server-entry-point')
const supertest = require('supertest')
const { setRequest } = require('../set-request.js')

let server
let agent
const request = () => agent

beforeAll(async () => {
	server = await base('static-files.js')
	agent = supertest.agent(server)
})
afterAll(async () => {
	server.close()
})

const tests = [
	{
		name: 'опциональном',
		path: 'static-1',
		description: 'без параметров',
		mode: {
			index: false,
			shortName: false
		}
	},
	{
		name: 'сокращенном',
		path: 'static-2',
		description: 'без параметров',
		mode: {
			index: false,
			shortName: false
		}
	},
	{
		name: 'опциональном',
		path: 'index-shortcut-1',
		description: 'с сокращенным index.html',
		mode: {
			index: true,
			shortName: false
		}
	},
	{
		name: 'сокращенном',
		path: 'index-shortcut-2',
		description: 'с сокращенным index.html',
		mode: {
			index: true,
			shortName: false
		}
	},
	{
		name: 'опциональном',
		path: 'name-shortcut-1',
		description: 'с сокращенными именами',
		mode: {
			index: false,
			shortName: true
		}
	},
	{
		name: 'сокращенном',
		path: 'name-shortcut-2',
		description: 'с сокращенными именами',
		mode: {
			index: false,
			shortName: true
		}
	},
	{
		name: 'опциональном',
		path: 'shortcut-1',
		description: 'со всеми сокращениями',
		mode: {
			index: true,
			shortName: true
		}
	},
	{
		name: 'сокращенном',
		path: 'shortcut-2',
		description: 'со всеми сокращениями',
		mode: {
			index: true,
			shortName: true
		}
	}
]


for (const { name, path, description, mode } of tests) {

	describe(`Проверка маршрутизации статики ${ description } в ${ name } синтаксисе`, () => {
		describe(`Обычные запросы`, () => {
			test(`GET /${ path }/index.html`, setRequest(request, `/${ path }/index.html`, {
				file: `/static/index.html`,
				headers: [
					['Content-Type', 'text/html; charset=UTF-8']
				]
			}))
			test(`GET /${ path }/style.css`, setRequest(request, `/${ path }/style.css`, {
				file: `/static/style.css`,
				headers: [
					['Content-Type', 'text/css; charset=UTF-8']
				]
			}))
			test(`GET /${ path }/script.js`, setRequest(request, `/${ path }/script.js`, {
				file: `/static/script.js`,
				headers: [
					['Content-Type', 'application/javascript; charset=UTF-8']
				]
			}))
			test(`GET /${ path }/some-json.json`, setRequest(request, `/${ path }/some-json.json`, {
				file: `/static/some-json.json`,
				headers: [
					['Content-Type', 'application/json; charset=UTF-8']
				]
			}))
			test(`GET /${ path }/some-json.json/`, setRequest(request, `/${ path }/some-json.json/`, {
				file: `/static/some-json.json`,
				headers: [
					['Content-Type', 'application/json; charset=UTF-8']
				]
			}))
			test(`GET /${ path }/some-json.json/?`, setRequest(request, `/${ path }/some-json.json/?`, {
				file: `/static/some-json.json`,
				headers: [
					['Content-Type', 'application/json; charset=UTF-8']
				]
			}))
			test(`GET /${ path }/some-json.json?param=value`, setRequest(request, `/${ path }/some-json.json?param=value`, {
				file: `/static/some-json.json`,
				headers: [
					['Content-Type', 'application/json; charset=UTF-8']
				]
			}))
			test(`GET /${ path }/страница написанная на html.html`, setRequest(request, `/${ path }/страница написанная на html.html`, {
				file: `/static/страница написанная на html.html`,
				headers: [
					['Content-Type', 'text/html; charset=UTF-8']
				]
			}))
		})


		describe(`Влаженные адреса`, () => {
			test(`GET /${ path }/about/index.html`, setRequest(request, `/${ path }/about/index.html`, {
				file: `/static/about/index.html`,
				headers: [
					['Content-Type', 'text/html; charset=UTF-8']
				]
			}))
			test(`GET /${ path }/catalog/index.html`, setRequest(request, `/${ path }/catalog/index.html`, {
				file: `/static/catalog/index.html`,
				headers: [
					['Content-Type', 'text/html; charset=UTF-8']
				]
			}))

			test(`GET /${ path }/catalog/page-with-product-1.html`, setRequest(request, `/${ path }/catalog/page-with-product-1.html`, {
				file: `/static/catalog/page-with-product-1.html`,
				headers: [
					['Content-Type', 'text/html; charset=UTF-8']
				]
			}))
			test(`GET /${ path }/catalog/page-with-product-2.html`, setRequest(request, `/${ path }/catalog/page-with-product-2.html`, {
				file: `/static/catalog/page-with-product-2.html`,
				headers: [
					['Content-Type', 'text/html; charset=UTF-8']
				]
			}))
			test(`GET /${ path }/catalog/page-with-product-3.html`, setRequest(request, `/${ path }/catalog/page-with-product-3.html`, {
				file: `/static/catalog/page-with-product-3.html`,
				headers: [
					['Content-Type', 'text/html; charset=UTF-8']
				]
			}))
		})

		describe(`Запросы на несуществующие или сокращенные адреса`, () => {
			test(`GET /${ path }`, setRequest(request, `/${ path }`, {
				code: 404
			}))
			test(`GET /${ path }/`, setRequest(request, `/${ path }/`, {
				code: 404
			}))
		
			test(`GET /${ path }/index`, setRequest(request, `/${ path }/index`, {
				code: 404
			}))

			// сокращенные через index.html
			if (!mode.index) {
				test(`GET /${ path }/about`, setRequest(request, `/${ path }/about`, {
					code: 404
				}))
				test(`GET /${ path }/catalog`, setRequest(request, `/${ path }/catalog`, {
					code: 404
				}))
			}

			// сокращенные без расширения
			if (!mode.shortName) {
				test(`GET /${ path }/about/index`, setRequest(request, `/${ path }/about/index`, {
					code: 404
				}))
				test(`GET /${ path }/catalog/index`, setRequest(request, `/${ path }/catalog/index`, {
					code: 404
				}))
				test(`GET /${ path }/catalog/page-with-product-1`, setRequest(request, `/${ path }/catalog/page-with-product-1`, {
					code: 404
				}))
				test(`GET /${ path }/catalog/page-with-product-2`, setRequest(request, `/${ path }/catalog/page-with-product-2`, {
					code: 404
				}))
				test(`GET /${ path }/catalog/page-with-product-3`, setRequest(request, `/${ path }/catalog/page-with-product-3`, {
					code: 404
				}))
			}
		})
		describe(`Запросы на сокращенные адреса`, () => {

			// сокращенные через index.html
			if (mode.index) {
				test(`GET /${ path }/about`, setRequest(request, `/${ path }/about`, {
					file: `/static/about/index.html`,
					headers: [
						['Content-Type', 'text/html; charset=UTF-8']
					]
				}))
				test(`GET /${ path }/catalog`, setRequest(request, `/${ path }/catalog`, {
					file: `/static/catalog/index.html`,
					headers: [
						['Content-Type', 'text/html; charset=UTF-8']
					]
				}))
			}

			// сокращенные без расширения
			if (mode.shortName) {
				test(`GET /${ path }/about/index`, setRequest(request, `/${ path }/about/index`, {
					file: `/static/about/index.html`,
					headers: [
						['Content-Type', 'text/html; charset=UTF-8']
					]
				}))
				test(`GET /${ path }/catalog/index`, setRequest(request, `/${ path }/catalog/index`, {
					file: `/static/catalog/index.html`,
					headers: [
						['Content-Type', 'text/html; charset=UTF-8']
					]
				}))
				test(`GET /${ path }/catalog/page-with-product-1`, setRequest(request, `/${ path }/catalog/page-with-product-1`, {
					file: `/static/catalog/page-with-product-1.html`,
					headers: [
						['Content-Type', 'text/html; charset=UTF-8']
					]
				}))
				test(`GET /${ path }/catalog/page-with-product-2`, setRequest(request, `/${ path }/catalog/page-with-product-2`, {
					file: `/static/catalog/page-with-product-2.html`,
					headers: [
						['Content-Type', 'text/html; charset=UTF-8']
					]
				}))
				test(`GET /${ path }/catalog/page-with-product-3`, setRequest(request, `/${ path }/catalog/page-with-product-3`, {
					file: `/static/catalog/page-with-product-3.html`,
					headers: [
						['Content-Type', 'text/html; charset=UTF-8']
					]
				}))
			}
		})

	})
}

describe('Проверка кеширования', () => {
	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
})

describe('Проверка как будет обновляться каталог', () => {
	test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
})
