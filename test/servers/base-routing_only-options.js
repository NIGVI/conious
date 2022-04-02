

const fs = require('fs')
const path = require('path')
const Conious = require('../../conious')


module.exports = async (server) => {
	
	const options = {}
	const app = new Conious(server, options)

	app.set({
		path: '/',
		handler() {
			return 'main page'
		}
	})

	app.set({
		path: '/about',
		handler() {
			return 'about'
		}
	})

	app.set({
		path: '/запрос на другом языке', 
		handler() {
			return 'about'
		}
	})


	app.set({
		path: '/several-{ current (path|option)}',
		handler({ paths }) {
			return `several path or option => current: ${ paths.current }`
		}
	})
	app.set({
		path: '/несколько-{ текущий (вариантов|путей)}',
		handler({ paths }) {
			return `несколько вариантов или путей => текущий: ${ paths.текущий }`
		}
	})


	app.set({
		path: '/say/{ say }',
		handler({ paths }) {
			return paths.say
		}
	})

	app.set({
		path: '/prefix/pre-{ word }', 
		handler({ paths }) {
			return paths.word
		}
	})
	app.set({
		path: '/prefix/Привет-{ word }',
		handler({ paths }) {
			return paths.word
		}
	})
	app.set({
		path: '/postfix/{ word }-post', 
		handler({ paths }) {
			return paths.word
		}
	})

	app.set({
		path: '/prefix/other-path',
		handler() {
			return 'other-path'
		}
	})
	app.set({
		path: '/prefix/wrapper-example-post',
		handler() {
			return 'it is wrapper'
		}
	})

	app.set({
		path: '/files/css', 
		handler() {
			return fs.createReadStream(path.resolve(__dirname, 'static', 'style.css'))
		}
	})



	// static
	await app.static({
		path: '/static',
		dirPath: path.resolve(__dirname, 'static')
	})



	// async
	app.set({
		path: '/async/',
		async handler() {
			return 'main page'
		}
	})

	app.set({
		path: '/async/about',
		async handler() {
			return 'about'
		}
	})

	app.set({
		path: '/async/say/{ say }',
		async handler({ paths }) {
			return paths.say
		}
	})

	app.set({
		path: '/async/prefix/pre-{ word }', 
		async handler({ paths }) {
			return paths.word
		}
	})
	app.set({
		path: '/async/postfix/{ word }-post', 
		async handler({ paths }) {
			return paths.word
		}
	})

	app.set({
		path: '/async/prefix/other-path',
		async handler() {
			return 'other-path'
		}
	})
	app.set({
		path: '/async/prefix/wrapper-example-post',
		async handler() {
			return 'it is wrapper'
		}
	})
	app.set({
		path: '/async/files/css', 
		async handler() {
			return fs.createReadStream(path.resolve(__dirname, 'static', 'style.css'))
		}
	})


}
