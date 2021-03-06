

const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')
const busboy = require('busboy')
const {
  getParamsOrFieldFromRawString,
  schemeMappingForFormOrParams
} = require('./reuse-functions-params-and-form.js')


module.exports = {
  formMultipartParsing,
  formXWWWParsing,
  createFilesContainer
}


// form xwww function
async function formXWWWParsing(req, setting, reusedBody) {
  if (setting?.isParse) {

    // getting raw body
    if (reusedBody.raw === null) {
      reusedBody.raw = await getRawDataFromStream(req)
    }
    // end getting raw body

    // getting form
    if (!reusedBody.form) {
      reusedBody.form = getParamsOrFieldFromRawString(reusedBody.raw.toString())
    }
    const fields = JSON.parse(JSON.stringify(reusedBody.form))
    // end getting form

    if (setting.isParse) {
      const { ok, result: body } = schemeMappingForFormOrParams(setting.scheme, fields, fields)
      return { ok, body }
    }

    return { ok: true, body: fields }
  }

  if (setting?.isLoad) {
    return { ok: true, body: null }
  }

  return { ok: true, body: null }
}
// end form xwww function


// form multipart functions
async function formMultipartParsing(req, bodySetting, filesSetting, reusedBody) {
  const bb = busboy({ headers: req.headers, defParamCharset: 'utf8' })
  const fieldsContainer = {}
  const filesContainer = createFilesContainer(filesSetting)

  // getting fields and files
  setFormFieldsHandler(bb, fieldsContainer)
  setFormFilesHandler(bb, filesContainer, filesSetting)
  // end getting fields and files

  // close and reuse control
  const closePromise = createEndPromiseAndPreparingReused(bb, req, filesSetting, reusedBody)

  if (!reusedBody.requestFile) {
    req.pipe(bb)
  }
  if (reusedBody.requestFile) {
    const reqBodyFromFile = fs.createReadStream(reusedBody.requestFile)
    reqBodyFromFile.pipe(bb)
  }
  await closePromise

  if (reusedBody.form === null) { // todo no realize
    reusedBody.form = JSON.parse(JSON.stringify(fieldsContainer))
  }
  // end close and reuse control

  // value returning and validate data

  if (filesContainer) {
    const ok = validateRequiredFiles(filesContainer, filesSetting)
    if (!ok) {
      return {
        ok: false,
        body: null,
        files: filesContainer
      }
    }
  }

  if (bodySetting?.scheme) {
    const { ok, result: fields } = schemeMappingForFormOrParams(bodySetting.scheme, fieldsContainer, fieldsContainer)
    return {
      ok,
      body: fields,
      files: filesContainer
    }
  } else if (bodySetting?.mode === 'parse') {
    return {
      ok: true,
      body: fieldsContainer,
      files: filesContainer
    }
  } else if (filesContainer !== null) {
    return {
      ok: true,
      body: null,
      files: filesContainer
    }
  }

  return {
    ok: false,
    body: null,
    files: null
  }
  // end value returning and validate data
}


function createFilesContainer(filesSetting) {
  let filesContainer = null

  if (filesSetting) {
    filesContainer = {}

    if (filesSetting.isScheme) {
      filesContainer = Object.fromEntries(
        Object.entries(filesSetting.files).map(
          el => [el[0], el[1].type === 'array' ? [] : null]
        )
      )
    }
  }
  return filesContainer
}


function validateRequiredFiles(filesContainer, filesSetting) {
  let isTrue = true
  
  for (const [name, setting] of Object.entries(filesSetting.files)) {
    if (setting.required) {
      
      if (setting.type === 'one' && !filesContainer[name]) {
        isTrue = false
        break
      }

      if (setting.type === 'array' && filesContainer[name].length === 0) {
        isTrue = false
        break
      }
    }
  }

  return isTrue
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
  if (filesContainer) {

    if (filesSetting.isScheme) {
      bb.on('file', async (name, file, info) => {
        const { filename, encoding, mimeType } = info

        if (!filename) file.resume()

        if (filename && filesSetting.files[name]) {
          
          const fileInfo = {
            filename,
            mimeType,
            encoding
          }

          const isArray = filesContainer[name] instanceof Array

          if (isArray) {
            filesContainer[name].push(fileInfo)
          }
          if (!isArray && filesContainer[name] !== null) {
            file.resume()
            return
          }
          if (!isArray && filesContainer[name] === null) {
            filesContainer[name] = fileInfo
          }
          
          // getting buffer if no temp directory
          if (!filesSetting.temp) {
            fileInfo.buffer = await getRawDataFromStream(file)
            return
          }
          // end getting buffer if no temp directory

          // download in file
          if (filesSetting.temp) {
            const savedFileInfo = await writingFileWithRandomName(file, filesSetting.temp)

            fileInfo.path = savedFileInfo.filePath
            fileInfo.savedFilename = savedFileInfo.filename
            return
          }
          // end download in file
        }
        file.resume()
      })
    }

    if (filesSetting.allParse) {
      bb.on('file', async (name, file, info) => {
        const { filename, encoding, mimeType } = info

        if (!filename) file.resume()

        if (filename) {
          const fileInfo = {
            filename,
            mimeType,
            encoding
          }
  
          if (!filesContainer[name]) {
            filesContainer[name] = []
          }
          filesContainer[name].push(fileInfo)

          // getting buffer if no temp directory
          if (!filesSetting.temp) {
            fileInfo.buffer = await getRawDataFromStream(file)
            return
          }
          // end getting buffer if no temp directory

          // download in file
          if (filesSetting.temp) {
            const savedFileInfo = await writingFileWithRandomName(file, filesSetting.temp)
            fileInfo.path = savedFileInfo.filePath
            fileInfo.savedFilename = savedFileInfo.filename
            return
          }
          // end download in file
        }
      })
    }
  }
}


function createEndPromiseAndPreparingReused(bb, req, filesSetting, reusedBody) {
  let countCompleted = 0
  let resolvePromise
  let rejectPromise

  const promise = new Promise((resolve, reject) => {
    resolvePromise = resolve
    rejectPromise = reject
  })

  bb.on('close', () => {
    if (++countCompleted === 2) {
      resolvePromise(true)
    }
  })


  if (reusedBody.requestFile) {
    countCompleted++
  }
  // create file for reuse body stream
  if (!reusedBody.requestFile) {
    writingFileWithRandomName(req, filesSetting?.temp ?? os.tmpdir(), 'conious-request-body')
      .then((fileInfo) => {
        reusedBody.requestFile = fileInfo.filePath

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

      await new Promise((resolve, reject) => {
        const writableStream = fs.createWriteStream(filePath, { flags: 'wx' })
        readStream.pipe(writableStream)
        writableStream.on('error', reject)
        readStream.on('end', resolve)
      })

      return {
        filePath,
        filename: prefix
          ? `${ prefix }-${ name }`
          : name
      }
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw new Error(`Error creating file in '${ temp }' directory.`)
      }
    }
  }
}
// end form multipart functions


async function getRawDataFromStream(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const body = Buffer.concat(chunks)
  return body
}