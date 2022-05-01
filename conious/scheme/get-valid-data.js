

const { paramsParser } = require('./scheme-params-parser.js')
const { bodyParser } = require('./scheme-body-parser.js')


module.exports = {

	async getValidData(req, settings, urlParams, reusedData) {

		const { ok: testOnParams, params } = paramsParser(settings.params, urlParams, reusedData)

		if (!testOnParams) {
			return {
				ok: false,
				body: null,
				files: null,
				params: null
			}
		}

		const { ok: testOnBody, body, files } = await bodyParser(req, settings.body, settings.files, reusedData.body)
		
		return {
			ok: testOnParams && testOnBody,
			body: body instanceof Error ? null : body,
			files: files ?? null,
			params: params ?? urlParams
		}
	}

}