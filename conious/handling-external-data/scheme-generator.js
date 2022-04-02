

module.exports = {

  getParamsSetting(params) {
		const noSetting = { parse: false, mode: 'none', scheme: null }

		if (typeof params === 'string') {
			if (params === 'parse') {
				return { parse: true, mode: params, scheme: null }
			}
			return noSetting
		}

		if (params.mode === 'parse') {
			if (params.scheme) {
				const scheme = parseForScheme(params.scheme, false, false)
				return { parse: true, mode: params.mode, scheme: scheme }
			}
			return { parse: true, mode: params.mode, scheme: null }
		}

		if (params.mode === 'scheme' && params.scheme) {
			const scheme = parseForScheme(params.scheme, true, false)
			return { parse: true, mode: params.mode, scheme: scheme }
		}

		if (params.mode === 'scheme' && !params.scheme) {
			throw new Error('No schema specified inside params options.')
		}

		return noSetting
	},


	getBodySetting(body) {
		const noSetting = { load: false, mode: 'none', parse: false, type: 'any', scheme: null }

		if (typeof body === 'string') {
			if (body === 'parse') {
				return { load: true, mode: body, parse: true, type: 'any', scheme: null }
			}
			if (body === 'raw') {
				return { load: true, mode: body, parse: false, type: 'any', scheme: null }
			}
			return noSetting
		}

		if (body.mode === 'raw') {
			return { load: true, mode: body.mode, parse: false, type: 'any', scheme: null }
		}

		if (body.mode === 'parse') {
			if (body.scheme) {
				const scheme = parseForScheme(body.scheme, false, true)
				return { load: true, mode: body.mode, parse: true, type: body.type ?? 'any', scheme: scheme }
			}
			return { load: true, mode: body.mode, parse: true, type: body.type ?? 'any', scheme: null }
		}

		if (body.mode === 'scheme' && body.scheme) {
			const scheme = parseForScheme(body.scheme, true, true)
			return { load: true, mode: body.mode, parse: true, type: body.type ?? 'any', scheme: scheme }
		}

		if (body.mode === 'scheme' && !body.scheme) {
			throw new Error('No schema specified inside body options.')
		}

		return noSetting
	},

}


function parseForScheme(scheme, required, nesting) {
	const resultScheme = []

	for (let name of Object.keys(scheme)) {
		let requiredItem = required
		let valueFromScheme = scheme[name]
		let type = null
		const isFunction = valueFromScheme instanceof Function

		
		if (name.endsWith('?')) {
			requiredItem = false
			name = name.slice(0, name.length - 1)
		}
		if (typeof valueFromScheme === 'string') {
			type = valueFromScheme
		}
		if (isFunction) {
			type = valueFromScheme
		}
		if (nesting && typeof valueFromScheme === 'object' && !isFunction) {
			const branchInScheme = parseForScheme(valueFromScheme, required, nesting)
			type = branchInScheme
		}

		resultScheme.push({ name, type, required: requiredItem })
	}

	return resultScheme
}