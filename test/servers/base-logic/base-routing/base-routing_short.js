

const fs = require('fs')
const path = require('path')
const { Conious } = require('../../../../conious')


module.exports = async (server) => {
	
	const options = {
		defaultHandlers: {
			errorHandler({ err }) {
				// setTimeout(() => {
				// 	console.error(err)
				// }, 5500);
			}
		}
	}
	const app = new Conious(server, options)

	// Обычные маршруты
	app.set('/', () => 'main page')
	app.set('/about', () => 'about')
	app.set('/запрос на другом языке', () => 'запрос на другом языке')
	app.set('/files/css', () => fs.createReadStream(path.resolve(__dirname, '..', '..', 'static', 'style.css')))

	// Проверка объединенных путей по /several-{ current (path|option)} и /несколько-{ текущий (путей|вариантов)}
	app.set('/several-{ current (path|option)}', ({ paths }) => {
		return `several path or option => current: ${ paths.current }`
	})
	app.set('/несколько-{ текущий (вариантов|путей)}', ({ paths }) => {
		return `несколько вариантов или путей => текущий: ${ paths.текущий }`
	})

	// Проверка объединенных путей в анонимном пути по /anonym/several-(path|option) и /анонимный/несколько-(путей|вариантов)
	app.set('/anonym/several-(path|option)', () => {
		return 'several path or option => anonym'
	})
	app.set('/анонимный/несколько-(вариантов|путей)', () => {
		return 'несколько вариантов или путей => аноним'
	})

	// Получение части пути по /say/{ word }
	app.set('/say/{ say }', ({ paths }) => paths.say)

	// /star/* символ звездочка
	app.set('/star/*', () => 'star')

	// /double-star/** двойной символ звездочки
	app.set('/double-star/**', () => 'double-star')

	// /plus/+ символ плюс
	app.set('/plus/+', () => 'plus')

	// /plus-star/+* символы плюса со звездочкой
	app.set('/plus-star/+*', () => 'plus-star')

	// Получение части пути из /postfix/pre-{ word }
	// Получение части пути из /postfix/{ word }-post
	app.set('/prefix/pre-{ word }', ({ paths }) => paths.word)
	app.set('/prefix/Привет-{ word }', ({ paths }) => paths.word)
	app.set('/postfix/{ word }-post', ({ paths }) => paths.word)

	// Проверка с именными пользовательскими выражениями /postfix-with-custom-regexp/{ word (\\w+) }-post
	app.set('/postfix-with-custom-regexp/{ word (\\w+) }-post', ({ paths: { word } }) => word)

	// Проверка с пользовательскими выражениями /postfix-with-noname-regexp/(\\w+)-post
	app.set('/postfix-with-noname-regexp/(\\w+)-post', () => 'noname regexp')

	// Путь /** как путь который подходит для всех страниц
	// В другом файле

	// Знак \ в пути для исключения спецсимволов
	app.set('/path-with-exceptions/name-path-1/\\{ word }', () => 'exceptions')
	app.set('/path-with-exceptions/name-path-2/{ word \\}', () => 'exceptions')
	app.set('/path-with-exceptions/regexp-\\+-1/\\(\\d+)', () => 'exceptions')
	app.set('/path-with-exceptions/regexp-\\+-2/\\(\\d\\+)', () => 'exceptions')
	app.set('/path-with-exceptions/regexp-\\*-1/\\(\\d*)', () => 'exceptions')
	app.set('/path-with-exceptions/regexp-\\*-2/\\(\\d\\*)', () => 'exceptions')

	// Специальный символ ?
	// todo

	// Асинхронные функции
	app.set('/async/', async () => 'main page')
	app.set('/async/about', async () => 'about')
	app.set('/async/files/css', async () => fs.createReadStream(path.resolve(__dirname, '..', '..', 'static', 'style.css')))
}
