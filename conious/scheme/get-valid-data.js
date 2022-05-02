

const { paramsParser } = require('./scheme-params-parser.js')
const { bodyParser } = require('./scheme-body-parser.js')
const { createFilesContainer } = require('./scheme-form-parser.js')


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

		let { ok: testOnBody, body, files = null } = await bodyParser(req, settings.body, settings.files, reusedData.body)
		
		// validating files on null
		if (settings.files && files === null) {
			if (settings.files.hasRequired) {
				return {
					ok: false,
					body: null,
					files: null,
					params: null
				}
			}

			files = createFilesContainer(settings.files)
		}
		// end validating files on null

		return {
			ok: testOnParams && testOnBody,
			body: body,
			files: files,
			params: params ?? urlParams
		}
	}

}