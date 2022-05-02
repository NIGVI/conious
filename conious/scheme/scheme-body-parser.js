

const { formMultipartParsing, formXWWWParsing } = require('./scheme-form-parser.js')


module.exports = {
  async bodyParser(req, bodySetting, filesSetting, reusedBody) {
    if (bodySetting?.isLoad) {

      const mode = bodySetting.mode

      // raw
      if (mode === 'raw') {
        if (!reusedBody.raw) {
          reusedBody.raw = await getRawBody(req)
        }

        return {
          ok: true,
          body: reusedBody.raw.toString()
        }
      }

      const isJson = bodySetting.type === 'json' || bodySetting.type === 'any'
      const isForm = bodySetting.type === 'form' || bodySetting.type === 'any'
      const contentType = req.headers?.['content-type']
      const jsonParsed = isJson && contentType && /application\/json/.test(contentType)
      const formMultipartParsed = isForm && contentType && /multipart\/form-data/.test(contentType)
      const formXWWWParsed = isForm && contentType && /application\/x-www-form-urlencoded/.test(contentType)

      // json
      if (jsonParsed) {
        return await jsonParsing(req, bodySetting, reusedBody)
      }

      // form multipart
      if (formMultipartParsed) {
        return await formMultipartParsing(req, bodySetting, filesSetting, reusedBody)
      }

      // form application/x-www-form-urlencoded
      if (formXWWWParsed) {
        if (
          typeof filesSetting === 'object' && filesSetting !== null &&
          (filesSetting.isScheme || filesSetting.allParse) && filesSetting.hasRequired
        ) {
          return {
            ok: false,
            body: null,
            files: null
          }
        }
        return await formXWWWParsing(req, bodySetting, reusedBody)
      }

      return {
        ok: mode === 'parse',
        body: null
      }
    }

    if (
      typeof filesSetting === 'object' && filesSetting !== null &&
      (filesSetting.isScheme || filesSetting.allParse)
    ) {
      if (
        req.headers['content-type'] &&
        /multipart\/form-data/.test(req.headers['content-type'])
      ) {
        return await formMultipartParsing(req, bodySetting, filesSetting, reusedBody)
      }
      
      if (filesSetting.hasRequired) {
        return {
          ok: false,
          body: null,
          files: null
        }
      }
    }

    return {
      ok: true,
      body: null,
      files: null
    }
  }
}


// json functions
async function jsonParsing(req, setting, reusedBody) {

  // getting raw body
  if (reusedBody.raw === null) {
    reusedBody.raw = await getRawBody(req)
  }
  // end getting raw body

  // getting json
  if (reusedBody.json === null && !reusedBody.err) {
    try {
      reusedBody.json = { value: JSON.parse(reusedBody.raw.toString()), err: null }
    } catch (err) {
      reusedBody.json = { value: null, err: err }
    }
  }
  const json = JSON.parse(JSON.stringify(reusedBody.json.value))
  // end getting json

  // returning and validation
  if (!reusedBody.json.err) {

    if (setting.mode === 'parse' && !setting.scheme) {
      return { ok: true, body: json }
    }

    const { ok, result: body } = schemaMappingWithJson(setting.scheme, json)

    return { ok, body }
  }
  return { ok: setting.mode === 'parse', body: null }
  // end returning and validation
}

async function getRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const body = Buffer.concat(chunks)
  return body
}


function schemaMappingWithJson(scheme, raw) {
  const result = {}
  let isTrue = true

  // object and array
  if (isArray(raw) && scheme.array) {
    return _schemaMappingWithJson(scheme, raw)
  }
  if (isObject(raw) && scheme.object) {
    return _schemaMappingWithJson(scheme, raw)
  }
  if (scheme.array) {
    return { ok: !scheme.required, result: [] }
  }
  if (scheme.object) {
    return { ok: !scheme.required, result: {} }
  }

  // function
  if (scheme.function) {
    const { ok, value } = scheme.validFunction(raw)
    return { ok, result: value }
  }

  // primitive value
  if (scheme.type) {
    if (typeof raw === scheme.type) {
      return { ok: true, result: raw }
    }
    return { ok: !scheme.required, result: null }
  }

  return { ok: isTrue, result }
}


function _schemaMappingWithJson(scheme, raw) {
  // object
  if (scheme.object) {
    const result = {}
    let isTrue = true

    for (const schemeElement of scheme.objectElements) {
      const value = raw[schemeElement.name]

      // object and array
      if ((schemeElement.object && isObject(value)) || (schemeElement.array && isArray(value))) {
        const { ok, result: newValue } = _schemaMappingWithJson(schemeElement, value)
        
        if (ok) {
          result[schemeElement.name] = newValue
          continue
        }
      }

      // function
      if (schemeElement.function) {
        const { ok, value: newValue } = schemeElement.validFunction(value)

        if (ok) {
          result[schemeElement.name] = newValue
          continue
        }
      }

      // primitive value

      if (schemeElement.type && typeof value === schemeElement.type) {
        result[schemeElement.name] = value
        continue
      }

      // required test
      if (schemeElement.required) {
        isTrue = false
      }
    }



    return {
      ok: isTrue,
      result
    }
  }

  // array
  if (scheme.array) {
    const validValues = []

    for (const value of raw) {
      for (const schemeElement of scheme.arrayElements) {

        // object and array
        if ((schemeElement.object && isObject(value)) || (schemeElement.array && isArray(value))) {
          const { ok, result: newValue } = _schemaMappingWithJson(schemeElement, value)
  
          if (ok) {
            validValues.push(newValue)
            continue
          }
        }
  
        // function
        if (schemeElement.function) {
          const { ok, value: newValue } = schemeElement.validFunction(value)
  
          if (ok) {
            validValues.push(newValue)
            continue
          }
        }
  
        // primitive value
        if (schemeElement.type && typeof value === schemeElement.type) {
          validValues.push(value)
          continue
        }
      }
    }

    return {
      ok: true,
      result: validValues
    }
  }
}


function isObject(element) {
  return typeof element === 'object' && element !== null
}
function isArray(element) {
  return element instanceof Array
}
// end json functions