

const { paramsParser } = require('./scheme-params-parser.js')
const { bodyParser } = require('./scheme-body-parser.js')


module.exports = {

	async getValidData(req, settings, urlParams, readyRequestData) {

		const { ok: testOnParams, params, newReadyParams } = paramsParser(settings.params, urlParams, readyRequestData.params)

		if (!testOnParams) {
			return {
				ok: false,
				body: null,
				files: null,
				params: null,
				newReadyBody: {
					params: newReadyParams,
					body: readyRequestData.body
				}
			}
		}

		const { ok: testOnBody, body, files, newReadyBody } = await bodyParser(req, settings.body, settings.files, readyRequestData.body)
		
		return {
			ok: testOnParams && testOnBody,
			body: body instanceof Error ? null : body,
			files: files ?? null,
			params: params ?? urlParams,
			newReadyData: {
				params: newReadyParams,
				body: newReadyBody
			}
		}
	}

}