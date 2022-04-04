

const fs = require('fs')
const path = require('path')
const Conious = require('../../../../conious')


module.exports = async (server) => {
	
	const options = {}
	const app = new Conious(server, options)
	// Обычные маршруты
	app.set({
		path: '/',
		handler: () => 'main page'
	})
	app.set({
		path: '/about',
		handler: () => 'about'
	})
	app.set({
		path: '/запрос на другом языке',
		handler: () => 'запрос на другом языке'
	})
	app.set({
		path: '/files/css',
		handler: () => fs.createReadStream(path.resolve(__dirname, '..', '..', 'static', 'style.css'))
	})

	// Проверка объединенных путей по /several-{ current (path|option)} и /несколько-{ текущий (путей|вариантов)}
	app.set({
		path: '/several-{ current (path|option)}',
		handler: ({ paths }) => {
			return `several path or option => current: ${ paths.current }`
		}
	})
	app.set({
		path: '/несколько-{ текущий (вариантов|путей)}',
		handler: ({ paths }) => {
			return `несколько вариантов или путей => текущий: ${ paths.текущий }`
		}
	})

	// Проверка объединенных путей в анонимном пути по /anonym/several-(path|option) и /анонимный/несколько-(путей|вариантов)
	app.set({
		path: '/anonym/several-(path|option)',
		handler: () => {
			return 'several path or option => anonym'
		}
	})
	app.set({
		path: '/анонимный/несколько-(вариантов|путей)',
		handler: () => {
			return 'несколько вариантов или путей => аноним'
		}
	})

	// Получение части пути по /say/{ word }
	app.set({
		path: '/say/{ say }',
		handler: ({ paths }) => paths.say
	})

	// /star/* символ звездочка
	app.set({
		path: '/star/*',
		handler: () => 'star'
	})

	// /double-star/** двойной символ звездочки
	app.set({
		path: '/double-star/**',
		handler: () => 'double-star'
	})

	// /plus/+ символ плюс
	app.set({
		path: '/plus/+',
		handler: () => 'plus'
	})

	// /plus-star/+* символы плюса со звездочкой
	app.set({
		path: '/plus-star/+*', 
		handler: () => 'plus-star'
	})

	// Получение части пути из /postfix/pre-{ word }
	// Получение части пути из /postfix/{ word }-post
	app.set({
		path: '/prefix/pre-{ word }',
		handler: ({ paths }) => paths.word
	})
	app.set({
		path: '/prefix/Привет-{ word }',
		handler: ({ paths }) => paths.word
	})
	app.set({
		path: '/postfix/{ word }-post',
		handler: ({ paths }) => paths.word
	})

	// Проверка с именными пользовательскими выражениями /postfix-with-custom-regexp/{ word (\\w+) }-post
	app.set({
		path: '/postfix-with-custom-regexp/{ word (\\w+) }-post',
		handler: ({ paths: { word } }) => word
	})

	// Проверка с пользовательскими выражениями /postfix-with-noname-regexp/(\\w+)-post
	app.set({
		path: '/postfix-with-noname-regexp/(\\w+)-post',
		handler: () => 'noname regexp'
	})

	// Путь /** как путь который подходит для всех страниц
	// В другом файле

	// Знак \ в пути для исключения спецсимволов
	app.set({
		path: '/path-with-exceptions/name-path-1/\\{ word }',
		handler: () => 'exceptions'
	})
	app.set({
		path: '/path-with-exceptions/name-path-2/{ word \\}',
		handler: () => 'exceptions'
	})
	app.set({
		path: '/path-with-exceptions/regexp-\\+-1/\\(\\d+)',
		handler: () => 'exceptions'
	})
	app.set({
		path: '/path-with-exceptions/regexp-\\+-2/\\(\\d\\+)',
		handler: () => 'exceptions'
	})
	app.set({
		path: '/path-with-exceptions/regexp-\\*-1/\\(\\d*)',
		handler: () => 'exceptions'
	})
	app.set({
		path: '/path-with-exceptions/regexp-\\*-2/\\(\\d\\*)',
		handler: () => 'exceptions'
	})

	// Специальный символ ?
	// todo

	// Асинхронные функции
	app.set({
		path: '/async/',
		handler: async () => 'main page'
	})
	app.set({
		path: '/async/about',
		handler: async () => 'about'
	})
	app.set({
		path: '/async/files/css',
		handler: async () => fs.createReadStream(path.resolve(__dirname, '..', '..', 'static', 'style.css'))
	})
}
