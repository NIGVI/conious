

const fs = require('fs')
const path = require('path')
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

	#contentType = require('./mime.json')

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
				this.#setContentType(res, settings)
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

			if (result === undefined || result === null) {
				this.#setContentType(res, settings)
				res.end('')
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

	async getFileFromURLPath(fullPathFromURL) {
		try {
			const fileStat = await fs.promises.stat(fullPathFromURL)

			if (fileStat.isFile()) {
				const pathSegments = fullPathFromURL.split(path.sep)
				let lastSegment = pathSegments.at(-1)

				if (lastSegment === '') {
					lastSegment = pathSegments.at(-2)
				}

				const splitLastSegment = lastSegment.split('.')
				let format = ''

				if (splitLastSegment.length !== 1) {
					format = splitLastSegment.at(-1)
				}

				const stream = fs.createReadStream(fullPathFromURL)
				return { ok: true, stream, outputType: format }
			}

			// TODO: realize index.html file path
			return { ok: false, stream: null, outputType: null }
		} catch {
			return { ok: false, stream: null, outputType: null }
		}
	}

}


module.exports = {
	Response
}