

module.exports = {

	async getValidData(req, settings, urlParams, readyRequestData) {

		const { ok: testOnParams, params, newReadyParams } = paramsParser(settings.params, urlParams, readyRequestData.params)

		if (!testOnParams) {
			return {
				ok: false,
				body: null,
				params: null,
				newReadyBody: {
					params: newReadyParams,
					body: readyRequestData.body
				}
			}
		}

		const { ok: testOnBody, body, newReadyBody } = await bodyParser(req, settings.body, readyRequestData.body)
		
		return {
			ok: testOnParams && testOnBody,
			body: body instanceof Error ? {} : body,
			params: params ?? urlParams,
			newReadyData: {
				params: newReadyParams,
				body: newReadyBody
			}
		}
	}

}


function paramsParser(setting, rawParams, readyParams) {

	if (setting?.parse) {
		let newReadyParams = null
		let resultParams = null

		if (!readyParams) {
			let params = Object.create(null)
			if (rawParams && rawParams !== '?') {
				const paramEntries = new URLSearchParams(rawParams).entries()
	
				for (const [name, value] of paramEntries) {
					if (!params[name]) {
						params[name] = []
					}
					params[name].push(value)
				}
			}

			
			for (const name of Object.keys(params)) {
				if (params[name].length === 1) {
					params[name] = params[name][0] === '' ? true : params[name][0]
					continue
				}
				
				for (let i = 0; i < params[name].length; i++) {
					params[name][i] = params[name][i] === '' ? true : params[name][i]
				}
			}
			newReadyParams = params
			resultParams = JSON.parse(JSON.stringify(params))
		} else {
			newReadyParams = readyParams
			resultParams = JSON.parse(JSON.stringify(readyParams))
		}

		if (setting.mode === 'scheme') {
			const { ok, result: params } = schemaParameterMatching(setting.scheme, resultParams)
			return { ok, params, newReadyParams }
		}

		return { ok: true, params: resultParams, newReadyParams }
	}

	return { ok: true, params: null, newReadyParams: readyParams }
}


async function bodyParser(req, setting, readyBody) {

	if (setting?.load) {
		const mode = setting.mode
		const newReadyBody = {}
		
		if (!readyBody.raw) {
			const chunks = []
			for await (const chunk of req) {
				chunks.push(chunk)
			}
			newReadyBody.raw = Buffer.concat(chunks).toString()
		}
		if (readyBody.raw) {
			newReadyBody.raw = readyBody.raw
		}
		
		if (mode === 'raw') {
			return {
				ok: true,
				body: newReadyBody.raw,
				newReadyBody: {
					rew: newReadyBody.raw,
					json: readyBody.json,
					form: readyBody.form
				}
			}
		}

		if (setting.parse) {
			const isJson = setting.type === 'json' || setting.type === 'any'
			const isForm = setting.type === 'form' || setting.type === 'any'

			const contentType = req.headers?.['content-type']

			// json
			const jsonParsed = isJson && contentType && /application\/json/.test(contentType)
			if (jsonParsed && readyBody.json === undefined) {
				try {
					newReadyBody.json = JSON.parse(readyBody.raw)
				} catch (err) {
					newReadyBody.json = err
				}
			}

			// form
			const formParsed = isForm && contentType && /multipart\/form-data/.test(contentType)
			if (formParsed && readyBody.form === undefined) {
				// to do
			}

			if (readyBody.json !== undefined) {
				newReadyBody.json = readyBody.json
			}
			if (readyBody.form !== undefined) {
				newReadyBody.form = readyBody.form
			}
		}

		const currentValues = JSON.parse(
			JSON.stringify(
				setting.type === 'any' ? newReadyBody.json || newReadyBody.form
					: newReadyBody[setting.type]
			)
		)

		const hasValues = currentValues !== undefined

		if (mode === 'scheme' && hasValues) {
			const { ok, result: body } = schemeBodyMatching(setting.scheme, currentValues)

			return {
				ok,
				body,
				newReadyBody: {
					rew: newReadyBody.raw,
					json: newReadyBody.json,
					form: newReadyBody.form
				}
			}
		}

		return {
			ok: mode !== 'scheme',
			body: currentValues,
			newReadyBody: {
				rew: newReadyBody.raw,
				json: newReadyBody.json,
				form: newReadyBody.form
			}
		}
	}
	return { ok: true, body: null, newReadyBody: readyBody }
}


function schemaParameterMatching(scheme, raw) {
	const result = raw
	const unique = Symbol()
	let isTrue = true
	
	for (const { name, type, required } of scheme) {
		const hasParam = (result[name] ?? unique) !== unique

		if (hasParam) {

			if (type === 'any') continue

			if (type === 'number') {
				const newValue = parseFloat(result[name])
				if (!isNaN(newValue)) {
					result[name] = newValue
					continue
				}
			}

			if (type === 'string') {
				if (typeof result[name] === 'string') continue
			}

			if (type === 'boolean') {
				if (typeof result[name] === 'boolean') continue
			}

			if (type instanceof Function) {
				const { ok, value: newValue } = type(result[name])
				if (ok) {
					result[name] = newValue
					continue
				}
			}

			delete result[name]
		}
		if (required) {
			isTrue = false
			break
		}
	}

	return { ok: isTrue, result }
}


function schemeBodyMatching(scheme, raw) {
	const result = raw
	const unique = Symbol()
	let isTrue = true
	
	for (const { name, type, required } of scheme) {
		const hasParam = result[name] ?? unique !== unique

		if (hasParam) {

			if (type === 'any') continue

			if (typeof type === 'string' && typeof result[name] === type) continue

			const isFunction = type instanceof Function

			if (type instanceof Object && !isFunction) {
				const { ok, result: newValue } = schemeBodyMatching(type, result[name])
				if (ok) {
					result[name] = newValue
					continue
				}
			}

			if (isFunction) {
				const { ok, value: newValue } = type(result[name])
				if (ok) {
					result[name] = newValue
					continue
				}
			}

			delete result[name]
		}
		if (required) {
			isTrue = false
			break
		}
	}

	return { ok: isTrue, result }
}