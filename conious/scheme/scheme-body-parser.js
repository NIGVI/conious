

const { formMultipartParsing, formXWWWParsing } = require('./scheme-form-parser.js')


module.exports = {
  async bodyParser(req, setting, readyBody) {
    if (setting?.isLoad) {

      const mode = setting.mode
      const newReadyBody = {
        rew: readyBody.raw,
        json: readyBody.json,
        form: readyBody.form
      }

      // raw
      if (mode === 'raw') {
        if (!readyBody.raw) {
          newReadyBody.raw = await getRawBody(req)
        }

        return {
          ok: true,
          body: newReadyBody.raw,
          newReadyBody: newReadyBody
        }
      }

      const isJson = setting.type === 'json' || setting.type === 'any'
      const isForm = setting.type === 'form' || setting.type === 'any'
      const contentType = req.headers?.['content-type']
      const jsonParsed = isJson && contentType && /application\/json/.test(contentType)
      const formMultipartParsed = isForm && contentType && /multipart\/form-data/.test(contentType)
      const formXWWWParsed = isForm && contentType && /application\/x-www-form-urlencoded/.test(contentType)

      // json
      if (jsonParsed) {
        return await jsonParsing(req, setting, readyBody, newReadyBody)
      }

      // form multipart
      if (formMultipartParsed) {
        return await formMultipartParsing(req, setting, readyBody, newReadyBody)
      }

      // form multipart
      if (formXWWWParsed) {
        return await formXWWWParsing(req, setting, readyBody, newReadyBody)
      }

      return {
        ok: mode === 'parse',
        body: null,
        newReadyBody: readyBody
      }
    }
    return {
      ok: true,
      body: null,
      newReadyBody: readyBody
    }
  }
}


// json functions
async function jsonParsing(req, setting, readyBody, newReadyBody) {
  const raw = await getRawBody(req)
  newReadyBody.raw = raw
  let json = null
  try {
    json = JSON.parse(raw)
  } catch (err) {
    json = err
  }
  if (!(json instanceof Error)) {
    newReadyBody.json = json

    if (setting.mode === 'parse' && !setting.scheme) {
      return {
        ok: true,
        body: JSON.parse(JSON.stringify(json)),
        newReadyBody
      }
    }

    const {
      ok,
      result: body
    } = schemaMappingWithJson(setting.scheme, JSON.parse(JSON.stringify(json)))

    return {
      ok,
      body,
      newReadyBody
    }
  }
  return {
    ok: setting.mode === 'parse',
    body: null,
    newReadyBody
  }
}

async function getRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const body = Buffer.concat(chunks).toString()

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