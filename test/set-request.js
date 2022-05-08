/* eslint-env jest */

const fs = require('fs/promises')
const path = require('path')


module.exports = {

	setRequest(request, url, options) {
		let file = null
		let body = ''
		let code = 200
		let method = 'get'
		let headers = []
		let json = null
		let form = null
		let formType = 'multipart/form-data'
		let sendFiles = null

		if (typeof options === 'object' && options !== null) {
			({
				file = null,
				body = '',
				code = 200,
				method = 'get',
				headers = [],
				form = null,
				sendFiles = null,
				json = null,
				formType = 'multipart/form-data'
			} = options)
		}
		if (typeof options === 'string') {
			body = options
		}
		if (typeof options === 'number') {
			code = options
		}

		return (done) => {
			(async () => {
				try {
					
					if (file) {
						if (file.startsWith('/')) {
							file = file.slice(1)
						}
						body = await fs.readFile(path.resolve(__dirname, 'servers', file), 'utf-8')
					}
	

					const req = request()[method](encodeURI(url))
	
					if (json !== null) {
						req.type('json')
						req.send(JSON.stringify(json))
					}

					req.expect(code)
	
					if (body !== null || body !== false) {
						req.expect(body)
					}
	
					for (let i = 0; i < headers.length; i++) {
						req.expect(headers[i][0], headers[i][1])
					}

					if (form !== null && formType === 'multipart/form-data') {
						const fields = Object.entries(form)

						if (fields.length === 0) {
							req.field('', '')
						}

						for (const [key, value] of fields) {
							req.field(key, value)
						}
					}
					if (form !== null && formType === 'application/x-www-form-urlencoded') {
						const fields = Object.entries(form)

						if (fields.length === 0) {
							req.send('')
						}
						
						for (const [key, value] of fields) {
							if (value instanceof Array) {
								for (const valueElement of value) {
									req.send(`${ key }=${ valueElement }`)
								}
								continue
							}
							req.send(`${ key }=${ value }`)
						}
					}
					
					if (sendFiles !== null) {
						for (const [name, file] of Object.entries(sendFiles)) {
							req.attach(name, file)
						}
					}
	
					req.end(err => {
						if (err) {
							return done(err)
						}
						done()
					})


				} catch (err) {
					done(err)
				}
			})()
		}
	}
}