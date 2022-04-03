

const { ReadStream } = require('fs')
const { Readable } = require('stream')


class ResponseFunction {

	constructor(fun, values) {
		this.fun = fun
		this.values = values
	}

	async send(req, res, settings, finish, returns) {

		let isReturn = true
		const noReturn = () => { isReturn = false }
		let result = this.fun({ req, res, values: this.values, noReturn, settings })

		if (result instanceof Promise) {
			result = await result
		}

		if (isReturn) {
			returns(req, res, result, settings, finish)
		}
	}

}

class Response {

	#imageContentType = {
		'svg': 'image/svg+xml',
		'png': 'image/png',
		'jpeg': 'image/jpeg',
		'gif': 'image/gif',
		'webp': 'image/webp'
	}
	#videoContentType = {
		'mp4': 'video/mp4',
		'webm': 'video/webm'
	}
	#webContentType = {
		'html': 'text/html',
		'js': 'application/javascript',
		'css': 'text/css',
		'json': 'application/json',
	}
	#contentType = Object.assign({}, this.#imageContentType, this.#videoContentType, this.#webContentType)

	responseFunctions = {
		code500: ({ res }) => {
			res.statusCode = 500
			return ''
		},
		code404: ({ res }) => {
			res.statusCode = 404
			return ''
		}
	}


	constructor(options) {
		const { errorHandler, responseFunctions } = options
		this.errorHandler = errorHandler
		Object.assign(this.responseFunctions, responseFunctions)
	}


	getResponseFunction(name, values) {
		if (!this.responseFunctions[name]) {
			throw new Error(`'${ name }' response function not found`)
		}
		return new ResponseFunction(this.responseFunctions[name], values)
	}


	send(req, res, result, settings, finish) {

		let err
		try {
			if (typeof result === 'string') {
				this.#setContentType(res, settings)
				res.end(result)
				finish()
				return
			}
	
			if (result instanceof Readable) {
				return this.stream(req, res, result, settings, finish)
			}
	
			if (result instanceof ResponseFunction) {
				return result.send(req, res, settings, finish, this.send.bind(this))
			}

			if (settings.output === 'json' && typeof result === 'object' && result !== null) {
				this.#setContentType(res, settings)
				res.end(JSON.stringify(result))
				finish()
				return
			}
	
	
			err = new Error(`Response type error. Type: ${ typeof result }. Handler result: ${ result }`)
			this.errorHandler({req, res, err})
		} catch (error) {
			err = error
			this.errorHandler({req, res, err})
		}
		this.getResponseFunction('code500', { req, res, err })
			.send(req, res, settings, finish, this.send.bind(this))
	}


	stream(req, res, stream, settings, finish) {
		stream.once('data', () => {
			res.statusCode = 200
			this.#setContentType(res, settings)
		})

		stream.pipe(res)

		req.on('close', () => {
			stream.destroy()
		})
		stream.on('error', (err) => {
			this.errorHandler({ req, res, err })
			this.getResponseFunction('code500', { req, res, err })
				.send(req, res, settings, finish, this.send.bind(this))
		})
		stream.on('close', () => {
			finish()
		})
	}


	#setContentType(res, settings) {
		res.setHeader('Content-Type', (this.#contentType[settings.output] ?? 'text/plain') + '; charset=UTF-8')
	}

}


module.exports = {
	Response
}