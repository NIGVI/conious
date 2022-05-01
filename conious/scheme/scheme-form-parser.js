

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
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
async function formMultipartParsing(req, bodySetting, filesSetting, readyBody, newReadyBody) {
  const bb = busboy({ headers: req.headers })
  const fieldsContainer = {}
  const filesContainer = {}

  // getting data
  setFormFieldsHandler(bb, fieldsContainer)
  setFormFilesHandler(bb, filesContainer, filesSetting)
  // end getting data

  // close and reuse control
  const closePromise = createEndPromise(bb, req, filesSetting, readyBody, newReadyBody)

  if (!readyBody.requestFile) {
    req.pipe(bb)
  }
  if (readyBody.requestFile) {
    const reqBodyFromFile = fs.createReadStream(readyBody.requestFile)
    reqBodyFromFile.pipe(bb)
  }
  await closePromise

  if (!readyBody.form) {
    newReadyBody.form = JSON.parse(JSON.stringify(fieldsContainer))
  }
  // end close and reuse control

  // value returning and validate data
  const files = Object.entries(filesContainer).length === 0 ? null : filesContainer

  if (bodySetting?.scheme) {
    const { ok, result: fields } = schemeMappingForFormOrParams(bodySetting.scheme, fieldsContainer, fieldsContainer)
    return {
      ok,
      body: fields,
      files: files,
      newReadyBody
    }
  } else if (bodySetting?.mode === 'parse') {
    return {
      ok: true,
      body: fieldsContainer,
      files: files,
      newReadyBody
    }
  } else if (files !== null) {
    return {
      ok: true,
      body: null,
      files: files,
      newReadyBody
    }
  }

  return {
    ok: false,
    body: null,
    files: null,
    newReadyBody
  }
  // end value returning and validate data
}


function setFormFieldsHandler(bb, fieldsContainer) {
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
}


function setFormFilesHandler(bb, filesContainer, filesSetting) {
  if (
    typeof filesSetting === 'object' && filesSetting !== null &&
    (filesSetting.isScheme || filesSetting.allParse)
  ) {
    if (filesSetting.isScheme) {
      bb.on('file', async (name, file, info) => {
        const { filename, encoding, mimeType } = info
        const fileInfo = {
          filename,
          mimeType,
          encoding
        }

        if (filesSetting.files[name]) {
          const fileSetting = filesSetting.files[name]
          const isArray = fileSetting.type === 'array'

          if (isArray && !filesContainer[name]) {
            filesContainer[name] = []
          }
          if (isArray) {
            filesContainer[name].push(fileInfo)
          }
          if (!isArray && filesContainer[name]) {
            file.resume()
            return
          }
          if (!isArray && !filesContainer[name]) {
            filesContainer[name] = fileInfo
          }
          
          const savedFileInfo = await writingFileWithRandomName(file, filesSetting.temp)

          fileInfo.path = savedFileInfo.filePath
          fileInfo.savedFilename = savedFileInfo.filename
        } else {
          file.resume()
        }
      })
    }
    if (filesSetting.allParse) {
      bb.on('file', async (name, file, info) => {
        const { filename, encoding, mimeType } = info
        const fileInfo = {
          filename,
          mimeType,
          encoding
        }

        if (!filesContainer[name]) {
          filesContainer[name] = []
        }
        filesContainer[name].push(fileInfo)
        const savedFileInfo = await writingFileWithRandomName(file, filesSetting.temp)

        fileInfo.path = savedFileInfo.filePath
        fileInfo.savedFilename = savedFileInfo.filename

      })
    }
  }
}


function createEndPromise(bb, req, filesSetting, readyBody, newReadyBody) {
  let countCompleted = 0
  let resolvePromise
  let rejectPromise

  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve; rejectPromise = reject
  })

  bb.on('close', () => {
    if (++countCompleted === 2) {
      resolvePromise(true)
    }
  })

  // create file for reuse body stream
  if (readyBody.requestFile) {
    countCompleted++
  }
  if (!readyBody.requestFile) {
    writingFileWithRandomName(req, filesSetting.temp, 'request-body')
      .then((fileInfo) => {
        newReadyBody.requestFile = fileInfo.filePath

        if (++countCompleted === 2) {
          resolvePromise(true)
        }
      })
      .catch(rejectPromise)
  }
  // end create file for reuse body stream

  return promise
}


async function writingFileWithRandomName(readStream, temp, prefix) {
  const thisIsTrue = true
  while (thisIsTrue) {
    try {
      const name = crypto.randomUUID()
      let filePath
      if (prefix) {
        filePath = path.join(temp, `${ prefix }-${ name }`)
      }
      if (!prefix) {
        filePath = path.join(temp, name)
      }

      const writableStream = fs.createWriteStream(filePath, { flags: 'wx' })

      await readStream.pipe(writableStream)

      return {
        filePath,
        filename: prefix
          ? `${ prefix }-${ name }`
          : name
      }
    } catch (err) {
      console.log('file name repeated')
      if (err.code !== 'EEXIST') {
        throw new Error(`Error creating file in '${ temp }' directory.`)
      }
    }
  }
}