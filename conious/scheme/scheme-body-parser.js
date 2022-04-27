

module.exports = {
  async bodyParser(req, setting, readyBody) {

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
  
        if (jsonParsed && readyBody.json === null) {
          try {
            newReadyBody.json = JSON.parse(newReadyBody.raw)
          } catch (err) {
            newReadyBody.json = err
          }
        }
  
        // form
        const formParsed = isForm && contentType && /multipart\/form-data/.test(contentType)
        if (formParsed && readyBody.form === null) {
          // to do
        }
  
        if (readyBody.json !== null) {
          newReadyBody.json = readyBody.json
        }
        if (readyBody.form !== null) {
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