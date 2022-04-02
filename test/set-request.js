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

		if (typeof options === 'object' && options !== null) {
			({
				file = null,
				body = '',
				code = 200,
				method = 'get',
				headers = []
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
	
					req.expect(code)
	
					if (body !== null || body !== false) {
						req.expect(body)
					}
	
					for (let i = 0; i < headers.length; i++) {
						req.expect(headers[i][0], headers[i][1])
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