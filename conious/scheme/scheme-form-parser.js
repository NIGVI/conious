

const busboy = require('busboy')
const {
  getParamsOrFieldFromRawString,
  schemeMappingForFormOrParams
} = require('./reuse-functions-params-and-form.js')


module.exports = {
  formMultipartParsing,
  formXWWWParsing
}


// form xwww function
async function formXWWWParsing(req, setting, readyBody, newReadyBody) {
  if (setting?.isParse) {

    if (!readyBody.form) {
      const rawFields = await getRawBody(req)
      const fields = getParamsOrFieldFromRawString(rawFields)
      newReadyBody.form = fields
    }
    const fields = JSON.parse(JSON.stringify(newReadyBody.form))

    if (setting.isParse) {
      const { ok, result: body } = schemeMappingForFormOrParams(setting.scheme, fields, fields)
      return {
        ok,
        body,
        newReadyBody
      }
    }

    return {
      ok: true,
      body: fields,
      newReadyBody
    }
  }

  if (setting?.isLoad) {
    return {
      ok: true,
      body: null,
      newReadyBody
    }
  }

  return {
    ok: true,
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
// end form xwww function


// form multipart functions
async function formMultipartParsing(req, setting, readyBody, newReadyBody) {
  const bb = busboy({ headers: req.headers })
  const fieldsContainer = {}
  const filesContainer = {}

  // get field
  bb.on('field', (name, val, info) => {
    if (info.mimeType === 'text/plain') {
      if (!fieldsContainer[name]) {
        fieldsContainer[name] = []
      }
      fieldsContainer[name].push(val)
    } else {
      console.error(name, val, info)
    }
  })
  // end get field
  setFormFilesHandler(bb, filesContainer, setting.mode, setting.scheme)

  const closePromise = new Promise(resolve => {
    bb.on('close', () => {
      resolve(true)
    })
  })

  req.pipe(bb)
  await closePromise

  if (!readyBody.form) {
    newReadyBody.form = JSON.parse(JSON.stringify(fieldsContainer))
  }

  if  (setting.scheme) {
    const { ok, result } = schemeMappingForFormOrParams(setting.scheme, fieldsContainer, fieldsContainer)
    return {
      ok,
      body: result,
      newReadyBody
    }
  } else if (setting.mode === 'parse') {
    return {
      ok: true,
      body: fieldsContainer,
      newReadyBody
    }
  }

  return {
    ok: false,
    body: null,
    newReadyBody
  }
}


function setFormFilesHandler(bb, fieldsContainer, mode, scheme) {
  // todo
}