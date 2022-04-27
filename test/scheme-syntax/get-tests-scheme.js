

const fs = require('fs/promises')
const fsCB = require('fs')
const path = require('path')
const markdownFolder = __dirname
const { setSetting } = require('../../conious/scheme/setting.js');


module.exports = {

  async getTestsScheme() {
    const markdownFilesPath = await getMarkdownFilesPath(markdownFolder)
    const promises = []
    const schemes = []

    for (const markdownFilePath of markdownFilesPath) {
      const promise = (async () => {
  
        const scheme = await getSchemeFromMarkdownFile(markdownFilePath)
        if (typeof scheme === 'object' && scheme !== null) {
          schemes.push(scheme)
        }

      })()
      promises.push(promise)
    }
    await Promise.all(promises)

    const collator = new Intl.Collator()
    schemes.sort((scheme1, scheme2) => collator.compare(scheme1.filename, scheme2.filename))

    return schemes
  },

  getTestsSchemeSync() {
    const markdownFilesPath = getMarkdownFilesPathSync(markdownFolder)
    const schemes = []

    for (const markdownFilePath of markdownFilesPath) {
        const scheme = getSchemeFromMarkdownFileSync(markdownFilePath)
        if (typeof scheme === 'object' && scheme !== null) {
          schemes.push(scheme)
        }
    }

    const collator = new Intl.Collator()
    schemes.sort((scheme1, scheme2) => collator.compare(scheme1.filename, scheme2.filename))

    return schemes
  }

}


async function getMarkdownFilesPath(markdownFolder) {
  const dir = await fs.opendir(markdownFolder)
  const filesPath = []

  for await (const file of dir) {
    if (file.name.endsWith('.md')) {
      filesPath.push(path.join(markdownFolder, file.name))
    }
  }

  return filesPath
}
function getMarkdownFilesPathSync(markdownFolder) {
  const dir = fsCB.opendirSync(markdownFolder)
  const filesPath = []

  for (let file = dir.readSync(); file !== null; file = dir.readSync()) {
    if (file.name.endsWith('.md')) {
      filesPath.push(path.join(markdownFolder, file.name))
    }
  }

  return filesPath
}


async function getSchemeFromMarkdownFile(markdownFilePath) {
  const content = await fs.readFile(markdownFilePath, 'utf-8')
  return _getSchemeFromMarkdownFile(content, markdownFilePath)
}
function getSchemeFromMarkdownFileSync(markdownFilePath) {
  const content = fsCB.readFileSync(markdownFilePath, 'utf-8')
  return _getSchemeFromMarkdownFile(content, markdownFilePath)
}


function _getSchemeFromMarkdownFile(content, markdownFilePath) {
  const scheme = {}

  // scheme
  const schemeInner = content.match(/## scheme[^]+?```js(?<schemeInner>[^]+?)```[^]+?(###|$)/)?.groups?.schemeInner
  if (!schemeInner) {
    return null
  }

  scheme.scheme = eval(
    `(() => {
      ${schemeInner}
      return scheme
    })()`
  )


  // json
  const jsonTests = []
  const jsonInner = content.match(/### json(?<jsonInner>[^]+?)(###|$)/)?.groups?.jsonInner

  if (jsonInner) {
    const jsonTestsRaw = jsonInner.match(/```js\b[^]+?```/g)

    for (const jsonTestRaw of jsonTestsRaw ?? []) {
      const jsonTestInner = jsonTestRaw.match(/```js\b(?<jsonTestInner>[^]+?)```/)?.groups?.jsonTestInner
  
      jsonTests.push(getDataFromString(jsonTestInner))
    }
  }
  scheme.jsonTests = jsonTests


  // params
  const paramsTests = []
  const paramsInner = content.match(/### query params(?<jsonInner>[^]+?)(###|$)/)?.groups?.jsonInner

  if (paramsInner) {
    const paramsTestsRaw = paramsInner.match(/```js\b[^]+?```/g)

    for (const paramsTestRaw of paramsTestsRaw ?? []) {
      const paramsTestInner = paramsTestRaw.match(/```js\b(?<paramsTestInner>[^]+?)```/)?.groups?.paramsTestInner
  
      paramsTests.push(getDataFromString(paramsTestInner))
    }
  }
  scheme.paramsTests = paramsTests


  // form
  const formTests = []
  const formInner = content.match(/### form(?<jsonInner>[^]+?)(###|$)/)?.groups?.jsonInner

  if (formInner) {
    const formTestsRaw = formInner.match(/```js\b[^]+?```/g)

    for (const formTestRaw of formTestsRaw ?? []) {
      const formTestInner = formTestRaw.match(/```js\b(?<formTestInner>[^]+?)```/)?.groups?.formTestInner
  
      formTests.push(getDataFromString(formTestInner))
    }
  }
  scheme.formTests = formTests


  // filename
  scheme.filename = markdownFilePath.split(/(\/|\\)/g).at(-1)

  return scheme
}


function getDataFromString(testString) {
  return eval(
    `(() => {
      ${ testString }
      return {
        ${ testString.match(/\b(const|let)\s+input\b/) ? 'input,' : '' }
        ${ testString.match(/\b(const|let)\s+url\b/) ? 'url,' : '' }
        ${ testString.match(/\b(const|let)\s+schemeMode\b/) ? 'schemeMode,' : '' }
        ${ testString.match(/\b(const|let)\s+parseMode\b/) ? 'parseMode,' : '' }
      }
    })()`
  )
}