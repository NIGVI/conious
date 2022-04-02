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
	serverOnlyOptions = await base('base-routing_only-options.js')
	serverShort = await base('base-routing_short.js')

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


		describe('Обычные маршруты', () => {
			test('GET /', setRequest(request, '/', 'main page'))
			test('GET /about', setRequest(request, '/about', 'about'))
			test('GET /about?', setRequest(request, '/about?', 'about'))
			test('GET /about?prop', setRequest(request, '/about?prop', 'about'))
			test('GET /about?prop=', setRequest(request, '/about?prop=', 'about'))
			test('GET /about?prop=value', setRequest(request, '/about?prop-value', 'about'))
			test('GET /ABOUT', setRequest(request, '/ABOUT', 404))
			test('GET /запрос на другом языке', setRequest(request, '/запрос на другом языке', 'запрос на другом языке'))
			test('GET /запрос на другом яЗыке', setRequest(request, '/запрос на другом яЗыке', 404))
			test('/files/css | Передача файла через стрим', setRequest(request, '/files/css', {
				file: '/static/style.css'
			}))

			describe('Проверка объединенных путей по /several-{ current (path|option)} и /несколько-{ текущий (путей|вариантов)}', () => {
				test('GET /several-path', setRequest(request, '/several-path', 'several path or option => current: path'))
				test('GET /several-option', setRequest(request, '/several-option', 'several path or option => current: option'))

				test('GET /several-', setRequest(request, '/several-', 404))
				test('GET /several-random-word', setRequest(request, '/several-random-word', 404))
				test('GET /several-PATH', setRequest(request, '/several-PATH', 404))

				test('GET /несколько-вариантов', setRequest(request, '/несколько-вариантов', 'несколько вариантов или путей => текущий: вариантов'))
				test('GET /несколько-путей', setRequest(request, '/несколько-путей', 'несколько вариантов или путей => текущий: путей'))

				test('GET /несколько-', setRequest(request, '/несколько-', 404))
				test('GET /несколько-случайное-слово', setRequest(request, '/несколько-случайное-слово', 404))
				test('GET /несколько-ПУТЕЙ', setRequest(request, '/несколько-ПУТЕЙ', 404))
			})

			describe('Проверка объединенных путей в анонимном пути по /anonym/several-(path|option) и /анонимный/несколько-(путей|вариантов)', () => {
				test('GET /anonym/several-path', setRequest(request, '/anonym/several-path', 'several path or option => anonym'))
				test('GET /anonym/several-option', setRequest(request, '/anonym/several-option', 'several path or option => anonym'))

				test('GET /anonym/several-', setRequest(request, '/anonym/several-', 404))
				test('GET /anonym/several-random-word', setRequest(request, '/anonym/several-random-word', 404))
				test('GET /anonym/several-PATH', setRequest(request, '/anonym/several-PATH', 404))

				test('GET /анонимный/несколько-вариантов', setRequest(request, '/анонимный/несколько-вариантов', 'несколько вариантов или путей => аноним'))
				test('GET /анонимный/несколько-путей', setRequest(request, '/анонимный/несколько-путей', 'несколько вариантов или путей => аноним'))

				test('GET /анонимный/несколько-', setRequest(request, '/анонимный/несколько-', 404))
				test('GET /анонимный/несколько-случайное-слово', setRequest(request, '/анонимный/несколько-случайное-слово', 404))
				test('GET /анонимный/несколько-ПУТЕЙ', setRequest(request, '/анонимный/несколько-ПУТЕЙ', 404))
			})

			describe('Получение части пути по /say/{ word }', () => {
				test('GET /say', setRequest(request, '/say', 404))
				test('GET /say/hello', setRequest(request, '/say/hello', 'hello'))
				test('GET /say/hello?', setRequest(request, '/say/hello?', 'hello'))
				test('GET /say/hello?prop=value', setRequest(request, '/say/hello?prop=value', 'hello'))

				test('GET /say/qwerty', setRequest(request, '/say/qwerty', 'qwerty'))
				test('GET /say/Привет', setRequest(request, '/say/Привет', 'Привет'))
				test('GET /say/&-=+&', setRequest(request, '/say/&-=+&', '&-=+&'))
				test('GET /say/&ывау*', setRequest(request, '/say/&ывау*', '&ывау*'))
			})

			describe('/star/* символ звездочка', () => {
				test('GET /other-star', setRequest(request, '/other-star', 404))
				test('GET /star-other', setRequest(request, '/star-other', 404))
				test('GET /star', setRequest(request, '/star', 'star'))
				test('GET /star/hello', setRequest(request, '/star/hello', 'star'))
				test('GET /star/hello?', setRequest(request, '/star/hello?', 'star'))
				test('GET /star/hello?prop=value', setRequest(request, '/star/hello?prop=value', 'star'))

				test('GET /star/path/to', setRequest(request, '/star/path/to', 404))

				test('GET /star/qwerty', setRequest(request, '/star/qwerty', 'star'))
				test('GET /star/Привет', setRequest(request, '/star/Привет', 'star'))
				test('GET /star/&-=+&', setRequest(request, '/star/&-=+&', 'star'))
				test('GET /star/&ывау*', setRequest(request, '/star/&ывау*', 'star'))
			})

			describe('/double-star/** двойной символ звездочки', () => {
				test('GET /double', setRequest(request, '/double', 404))
				test('GET /double-star-other', setRequest(request, '/double-star-other', 404))
				test('GET /double-star', setRequest(request, '/double-star', 'double-star'))
				test('GET /double-star/hello', setRequest(request, '/double-star/hello', 'double-star'))
				test('GET /double-star/hello?', setRequest(request, '/double-star/hello?', 'double-star'))
				test('GET /double-star/hello?prop=value', setRequest(request, '/double-star/hello?prop=value', 'double-star'))

				test('GET /double-star/path/to', setRequest(request, '/double-star/path/to', 'double-star'))

				test('GET /double-star/qwerty', setRequest(request, '/double-star/qwerty', 'double-star'))
				test('GET /double-star/Привет', setRequest(request, '/double-star/Привет', 'double-star'))
				test('GET /double-star/&-=+&', setRequest(request, '/double-star/&-=+&', 'double-star'))
				test('GET /double-star/&ывау*', setRequest(request, '/double-star/&ывау*', 'double-star'))
			})

			describe('/plus/+ символ плюс', () => {
				test('GET /plus-other', setRequest(request, '/plus-other', 404))
				test('GET /plus', setRequest(request, '/plus', 404))
				test('GET /plus/hello', setRequest(request, '/plus/hello', 'plus'))
				test('GET /plus/hello?', setRequest(request, '/plus/hello?', 'plus'))
				test('GET /plus/hello?prop=value', setRequest(request, '/plus/hello?prop=value', 'plus'))

				test('GET /plus/path/to', setRequest(request, '/plus/path/to', 404))

				test('GET /plus/qwerty', setRequest(request, '/plus/qwerty', 'plus'))
				test('GET /plus/Привет', setRequest(request, '/plus/Привет', 'plus'))
				test('GET /plus/&-=+&', setRequest(request, '/plus/&-=+&', 'plus'))
				test('GET /plus/&ывау*', setRequest(request, '/plus/&ывау*', 'plus'))
			})

			describe('/plus-star/+* символы плюса со звездочкой', () => {
				test('GET /plus-star', setRequest(request, '/plus-star', 404))
				test('GET /plus-star/hello', setRequest(request, '/plus-star/hello', 'plus-star'))
				test('GET /plus-star/hello?', setRequest(request, '/plus-star/hello?', 'plus-star'))
				test('GET /plus-star/hello?prop=value', setRequest(request, '/plus-star/hello?prop=value', 'plus-star'))

				test('GET /plus-star/path/to', setRequest(request, '/plus-star/path/to', 'plus-star'))

				test('GET /plus-star/qwerty', setRequest(request, '/plus-star/qwerty', 'plus-star'))
				test('GET /plus-star/Привет', setRequest(request, '/plus-star/Привет', 'plus-star'))
				test('GET /plus-star/&-=+&', setRequest(request, '/plus-star/&-=+&', 'plus-star'))
				test('GET /plus-star/&ывау*', setRequest(request, '/plus-star/&ывау*', 'plus-star'))
			})

			describe('Получение части пути из /postfix/pre-{ word }', () => {
				test('GET /prefix/pre-', setRequest(request, '/prefix/pre-', 404))
				test('GET /prefix/pre-100', setRequest(request, '/prefix/pre-100', '100'))
				test('GET /prefix/pre-hello', setRequest(request, '/prefix/pre-hello', 'hello'))
				test('GET /prefix/pre-hello?', setRequest(request, '/prefix/pre-hello?', 'hello'))
				test('GET /prefix/pre-hello?prop=value', setRequest(request, '/prefix/pre-hello?prop=value', 'hello'))

				test('GET /prefix/pre-qwerty', setRequest(request, '/prefix/pre-qwerty', 'qwerty'))
				test('GET /prefix/pre-Привет', setRequest(request, '/prefix/pre-Привет', 'Привет'))
				test('GET /prefix/pre-&-=+&', setRequest(request, '/prefix/pre-&-=+&', '&-=+&'))
				test('GET /prefix/pre-&ывау*', setRequest(request, '/prefix/pre-&ывау*', '&ывау*'))
			})

			describe('Получение части пути из /postfix/{ word }-post', () => {
				test('GET /postfix/-post', setRequest(request, '/postfix/-post', 404))
				test('GET /postfix/100-post', setRequest(request, '/postfix/100-post', '100'))
				test('GET /postfix/hello-post', setRequest(request, '/postfix/hello-post', 'hello'))
				test('GET /postfix/hello-post?', setRequest(request, '/postfix/hello-post?', 'hello'))
				test('GET /postfix/hello-post?prop=value', setRequest(request, '/postfix/hello-post?prop=value', 'hello'))

				test('GET /postfix/qwerty-post/', setRequest(request, '/postfix/qwerty-post', 'qwerty'))
				test('GET /postfix/Привет-post', setRequest(request, '/postfix/Привет-post', 'Привет'))
				test('GET /postfix/&-=+&-post', setRequest(request, '/postfix/&-=+&-post', '&-=+&'))
				test('GET /postfix/&ывау*-post', setRequest(request, '/postfix/&ывау*-post', '&ывау*'))
			})

			describe('Проверка с именными пользовательскими выражениями /postfix-with-custom-regexp/{ word (\\w+) }-post', () => {
				test('GET /postfix-with-custom-regexp/-post', setRequest(request, '/postfix-with-custom-regexp/-post', 404))
				test('GET /postfix-with-custom-regexp/100-post', setRequest(request, '/postfix-with-custom-regexp/100-post', '100'))
				test('GET /postfix-with-custom-regexp/hello-post', setRequest(request, '/postfix-with-custom-regexp/hello-post', 'hello'))
				test('GET /postfix-with-custom-regexp/hello-post?', setRequest(request, '/postfix-with-custom-regexp/hello-post?', 'hello'))
				test('GET /postfix-with-custom-regexp/hello-post?prop=value', setRequest(request, '/postfix-with-custom-regexp/hello-post?prop=value', 'hello'))

				test('GET /postfix-with-custom-regexp/qwerty-post/', setRequest(request, '/postfix-with-custom-regexp/qwerty-post', 'qwerty'))
				test('GET /postfix-with-custom-regexp/Привет-post', setRequest(request, '/postfix-with-custom-regexp/Привет-post', 404)) // only english
				test('GET /postfix-with-custom-regexp/&-=+&-post', setRequest(request, '/postfix-with-custom-regexp/&-=+&-post', 404))
				test('GET /postfix-with-custom-regexp/&ывау*-post', setRequest(request, '/postfix-with-custom-regexp/&ывау*-post', 404))
			})

			describe('Проверка с пользовательскими выражениями /postfix-with-noname-regexp/(\\w+)-post', () => {
				test('GET /postfix-with-noname-regexp/-post', setRequest(request, '/postfix-with-noname-regexp/-post', 404))
				test('GET /postfix-with-noname-regexp/100-post', setRequest(request, '/postfix-with-noname-regexp/100-post', 'noname regexp'))
				test('GET /postfix-with-noname-regexp/hello-post', setRequest(request, '/postfix-with-noname-regexp/hello-post', 'noname regexp'))
				test('GET /postfix-with-noname-regexp/hello-post?', setRequest(request, '/postfix-with-noname-regexp/hello-post?', 'noname regexp'))
				test('GET /postfix-with-noname-regexp/hello-post?prop=value', setRequest(request, '/postfix-with-noname-regexp/hello-post?prop=value', 'noname regexp'))

				test('GET /postfix-with-noname-regexp/qwerty-post/', setRequest(request, '/postfix-with-noname-regexp/qwerty-post', 'noname regexp'))
				test('GET /postfix-with-noname-regexp/Привет-post', setRequest(request, '/postfix-with-noname-regexp/Привет-post', 404)) // only english
				test('GET /postfix-with-noname-regexp/&-=+&-post', setRequest(request, '/postfix-with-noname-regexp/&-=+&-post', 404))
				test('GET /postfix-with-noname-regexp/&ывау*-post', setRequest(request, '/postfix-with-noname-regexp/&ывау*-post', 404))
			})

			describe('Путь /** как путь который подходит для всех страниц', () => {
				test('GET /**', (done) => {
					base('base-routing_all-path.js').then(server => {
						const agent = supertest.agent(server)
						let countEndTest = 0
						const paths = [
							'/',
							'/path',
							'/path/to'
						]
						const endTest = (err) => {
							if (err) {
								done(err)
							}
							if (++countEndTest === paths.length) {
								done()
							}
						}

						for (const path of paths) {
							setRequest(() => agent, path, 'On any path')(endTest)
						}

						server.close()
					})
				})

				test('GET /**-post', (done) => {
					done(new Error('Тесты не написаны'))
				})
				test('GET /**/end', (done) => {
					done(new Error('Тесты не написаны'))
				})
			})

			describe('Знак \\ в пути для исключения спецсимволов', () => {

				test('GET /path-with-exceptions/name-path-1/\\{ word } testing "{ word }"', setRequest(request, '/path-with-exceptions/name-path-1/{ word }', 'exceptions'))
				test('GET /path-with-exceptions/name-path-1/\\{ word } testing "{word }"', setRequest(request, '/path-with-exceptions/name-path-1/{word }', 404))
				test('GET /path-with-exceptions/name-path-1/\\{ word } testing "random word"', setRequest(request, '/path-with-exceptions/name-path-1/random word', 404))

				test('GET /path-with-exceptions/name-path-2/{ word \\} testing "{ word }"', setRequest(request, '/path-with-exceptions/name-path-2/{ word }', 'exceptions'))
				test('GET /path-with-exceptions/name-path-2/{ word \\} testing "{word }"', setRequest(request, '/path-with-exceptions/name-path-2/{word }', 404))
				test('GET /path-with-exceptions/name-path-2/{ word \\} testing "random word"', setRequest(request, '/path-with-exceptions/name-path-2/random word', 404))

				// +
				test('GET /path-with-exceptions/regexp-\\+-1/\\(\\d+) testing "123"', setRequest(request, '/path-with-exceptions/regexp-+-1/123', 404))
				test('GET /path-with-exceptions/regexp-\\+-1/\\(\\d+) testing "(\\)"', setRequest(request, '/path-with-exceptions/regexp-+-1/(\\)', 404))
				test('GET /path-with-exceptions/regexp-\\+-1/\\(\\d+) testing "(\\d)"', setRequest(request, '/path-with-exceptions/regexp-+-1/(\\d)', 'exceptions'))
				test('GET /path-with-exceptions/regexp-\\+-1/\\(\\d+) testing "(\\dd)"', setRequest(request, '/path-with-exceptions/regexp-+-1/(\\dd)', 'exceptions'))
				test('GET /path-with-exceptions/regexp-\\+-1/\\(\\d+) testing "(\\dc)"', setRequest(request, '/path-with-exceptions/regexp-+-1/(\\dc)', 404))
				test('GET /path-with-exceptions/regexp-\\+-1/\\(\\d+) testing "(\\d+)"', setRequest(request, '/path-with-exceptions/regexp-+-1/(\\d+)', 404))
				test('GET /path-with-exceptions/regexp-\\+-1/\\(\\d+) testing "random word"', setRequest(request, '/path-with-exceptions/regexp-+-1/random word', 404))

				test('GET /path-with-exceptions/regexp-\\+-2/\\(\\d\\+) testing "123"', setRequest(request, '/path-with-exceptions/regexp-+-2/123', 404))
				test('GET /path-with-exceptions/regexp-\\+-2/\\(\\d\\+) testing "(\\)"', setRequest(request, '/path-with-exceptions/regexp-+-2/(\\)', 404))
				test('GET /path-with-exceptions/regexp-\\+-2/\\(\\d\\+) testing "(\\d)"', setRequest(request, '/path-with-exceptions/regexp-+-2/(\\d)', 404))
				test('GET /path-with-exceptions/regexp-\\+-2/\\(\\d\\+) testing "(\\dd)"', setRequest(request, '/path-with-exceptions/regexp-+-2/(\\dd)', 404))
				test('GET /path-with-exceptions/regexp-\\+-2/\\(\\d\\+) testing "(\\dc)"', setRequest(request, '/path-with-exceptions/regexp-+-2/(\\dc)', 404))
				test('GET /path-with-exceptions/regexp-\\+-2/\\(\\d\\+) testing "(\\d+)"', setRequest(request, '/path-with-exceptions/regexp-+-2/(\\d+)', 'exceptions'))
				test('GET /path-with-exceptions/regexp-\\+-2/\\(\\d\\+) testing "random word"', setRequest(request, '/path-with-exceptions/regexp-+-2/random word', 404))

				// *
				test('GET /path-with-exceptions/regexp-\\*-1/\\(\\d*) testing "123"', setRequest(request, '/path-with-exceptions/regexp-*-1/123', 404))
				test('GET /path-with-exceptions/regexp-\\*-1/\\(\\d*) testing "(\\)"', setRequest(request, '/path-with-exceptions/regexp-*-1/(\\)', 'exceptions'))
				test('GET /path-with-exceptions/regexp-\\*-1/\\(\\d*) testing "(\\d)"', setRequest(request, '/path-with-exceptions/regexp-*-1/(\\d)', 'exceptions'))
				test('GET /path-with-exceptions/regexp-\\*-1/\\(\\d*) testing "(\\dd)"', setRequest(request, '/path-with-exceptions/regexp-*-1/(\\dd)', 'exceptions'))
				test('GET /path-with-exceptions/regexp-\\*-1/\\(\\d*) testing "(\\dc)"', setRequest(request, '/path-with-exceptions/regexp-*-1/(\\dc)', 404))
				test('GET /path-with-exceptions/regexp-\\*-1/\\(\\d*) testing "(\\d*)"', setRequest(request, '/path-with-exceptions/regexp-*-1/(\\d*)', 404))
				test('GET /path-with-exceptions/regexp-\\*-1/\\(\\d*) testing "random word"', setRequest(request, '/path-with-exceptions/regexp-*-1/random word', 404))

				test('GET /path-with-exceptions/regexp-\\*-2/\\(\\d\\*) testing "123"', setRequest(request, '/path-with-exceptions/regexp-*-2/123', 404))
				test('GET /path-with-exceptions/regexp-\\*-2/\\(\\d\\*) testing "(\\)"', setRequest(request, '/path-with-exceptions/regexp-*-2/(\\)', 404))
				test('GET /path-with-exceptions/regexp-\\*-2/\\(\\d\\*) testing "(\\d)"', setRequest(request, '/path-with-exceptions/regexp-*-2/(\\d)', 404))
				test('GET /path-with-exceptions/regexp-\\*-2/\\(\\d\\*) testing "(\\dd)"', setRequest(request, '/path-with-exceptions/regexp-*-2/(\\dd)', 404))
				test('GET /path-with-exceptions/regexp-\\*-2/\\(\\d\\*) testing "(\\dc)"', setRequest(request, '/path-with-exceptions/regexp-*-2/(\\dc)', 404))
				test('GET /path-with-exceptions/regexp-\\*-2/\\(\\d\\*) testing "(\\d*)"', setRequest(request, '/path-with-exceptions/regexp-*-2/(\\d*)', 'exceptions'))
				test('GET /path-with-exceptions/regexp-\\*-2/\\(\\d\\*) testing "random word"', setRequest(request, '/path-with-exceptions/regexp-*-2/random word', 404))

				// todo проверить * и +

			})

			describe('Специальный символ ?', () => {
				test('Тесты не написаны', (done) => done(new Error('Тесты не написаны')))
			})
		})

		// async

		describe('Асинхронные функции', () => {
			test('GET /async', setRequest(request, '/async', 'main page'))
			test('GET /async/about', setRequest(request, '/async/about', 'about'))
			test('/async/files/css | Передача файла через стрим', setRequest(request, '/async/files/css', {
				file: '/static/style.css'
			}))
		})

		describe('Нестандартные типы запросов', () => {
			test('POST /prefix/pre-', setRequest(request, '/async/prefix/pre-', {
				code: 404,
				method: 'post'
			}))
			test('POST /', setRequest(request, '/', {
				body: 'main page',
				method: 'post'
			}))
			test('POST /about', setRequest(request, '/about', {
				body: 'about',
				method: 'post'
			}))
			test('POST /say/hello', setRequest(request, '/say/hello', {
				body: 'hello',
				method: 'post'
			}))

			test('PUT /prefix/pre-', setRequest(request, '/async/prefix/pre-', {
				code: 404,
				method: 'put'
			}))
			test('PUT /', setRequest(request, '/', {
				body: 'main page',
				method: 'put'
			}))
			test('PUT /about', setRequest(request, '/about', {
				body: 'about',
				method: 'put'
			}))
			test('PUT /say/hello', setRequest(request, '/say/hello', {
				body: 'hello',
				method: 'put'
			}))

			test('DELETE /prefix/pre-', setRequest(request, '/async/prefix/pre-', {
				code: 404,
				method: 'delete'
			}))
			test('DELETE /', setRequest(request, '/', {
				body: 'main page',
				method: 'delete'
			}))
			test('DELETE /about', setRequest(request, '/about', {
				body: 'about',
				method: 'delete'
			}))
			test('DELETE /say/hello', setRequest(request, '/say/hello', {
				body: 'hello',
				method: 'delete'
			}))
		})
	})

}