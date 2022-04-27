/* eslint-env jest */

const http = require('http')
const supertest = require('supertest')
const { Conious } = require('../../../conious/index.js')
const { setRequest } = require('../../set-request.js')
const { getTestsSchemeSync } = require('../../scheme-syntax/get-tests-scheme.js')

let schemes = [getTestsSchemeSync()[0]]


for (const scheme of schemes) {

  // server
  const server = http.createServer()
  const agent = supertest(server)
  const request = () => agent
  const app = new Conious(server)

  // app.entry(async ({ req, next }) => {
  //   let body = ''
  //   for await (const chank of req) {
  //     body += chank
  //   }
  //   setTimeout(() => {
  //     console.log(req.url, req.headers, typeof body, body)
  //   }, 2000)
  //   next()
  // })

  app.get('/json/parse', {
    body: {
      mode: 'parse',
      type: 'json',
      scheme: scheme.scheme
    },
    handler({ body }) {
      return JSON.stringify(sortingParams(body), null, 2)
    }
  })
  app.get('/json/scheme', {
    body: {
      mode: 'scheme',
      type: 'json',
      scheme: scheme.scheme
    },
    handler({ body }) {
      return JSON.stringify(sortingParams(body), null, 2)
    }
  })

  app.get('/params/parse', {
    params: {
      mode: 'parse',
      scheme: scheme.scheme
    },
    handler({ params }) {
      return JSON.stringify(sortingParams(params), null, 2)
    }
  })
  app.get('/params/scheme', {
    params: {
      mode: 'scheme',
      scheme: scheme.scheme
    },
    handler({ params }) {
      return JSON.stringify(sortingParams(params), null, 2)
    }
  })

  app.get('/form/parse', {
    body: {
      mode: 'parse',
      type: 'form',
      scheme: scheme.scheme
    },
    handler({ body }) {
      return JSON.stringify(sortingParams(body), null, 2)
    }
  })
  app.get('/form/scheme', {
    body: {
      mode: 'scheme',
      type: 'form',
      scheme: scheme.scheme
    },
    handler({ body }) {
      return JSON.stringify(sortingParams(body), null, 2)
    }
  })
  
  // end server


  describe(`Тесты по схеме из файла ${ scheme.filename }`, () => {

    // json
    if (scheme.jsonTests.length !== 0) {
      describe('Тесты парсинга json', () => {
        let i = 0
        for (const schemeTest of scheme.jsonTests) {
          i++

          let schemeOptions = {
            code: 404
          }
          if (schemeTest.schemeMode) {
            schemeOptions.code = 200
            schemeOptions.json = schemeTest.input
            schemeOptions.body = JSON.stringify(sortingParams(schemeTest.schemeMode), null, 2)
          }
          test(
            `Тест парсинга json в режиме scheme №${ i }`,
            setRequest(request, '/json/scheme', schemeOptions)
          )

          let parseOptions = {
            code: 404
          }
          if (schemeTest.parseMode) {
            parseOptions.code = 200
            parseOptions.json = schemeTest.input
            parseOptions.body = JSON.stringify(sortingParams(schemeTest.parseMode), null, 2)
          }
          test(
            `Тест парсинга json в режиме parse №${ i }`,
            setRequest(request, '/json/parse', parseOptions)
          )
        }
      })
    }

    // params
    if (scheme.paramsTests.length !== 0) {
      describe('Тесты парсинга params', () => {
        let i = 0
        for (const schemeTest of scheme.paramsTests) {
          i++

          let schemeOptions = {
            code: 404
          }
          if (schemeTest.schemeMode) {
            schemeOptions.code = 200
            schemeOptions.body = JSON.stringify(sortingParams(schemeTest.schemeMode), null, 2)
          }
          test(
            `Тест парсинга params в режиме scheme №${ i }`,
            setRequest(request, schemeTest.url.replace('/path', '/params/scheme'), schemeOptions)
          )

          let parseOptions = {
            code: 404
          }
          if (schemeTest.parseMode) {
            parseOptions.code = 200
            parseOptions.body = JSON.stringify(sortingParams(schemeTest.parseMode), null, 2)
          }
          test(
            `Тест парсинга params в режиме parse №${ i }`,
            setRequest(request, schemeTest.url.replace('/path', '/params/params'), parseOptions)
          )
        }
      })
    }

    // form
    if (scheme.formTests.length !== 0) {
      describe('Тесты парсинга form', () => {
        let i = 0
        for (const schemeTest of scheme.formTests) {
          i++

          let schemeOptions = {
            code: 404
          }
          if (schemeTest.schemeMode) {
            schemeOptions.code = 200
            schemeOptions.body = JSON.stringify(sortingParams(schemeTest.schemeMode), null, 2)
          }
          test(
            `Тест парсинга form в режиме scheme №${ i }`,
            setRequest(request, '/form/scheme', schemeOptions)
          )

          let parseOptions = {
            code: 404
          }
          if (schemeTest.parseMode) {
            parseOptions.code = 200
            parseOptions.body = JSON.stringify(sortingParams(schemeTest.parseMode), null, 2)
          }
          test(
            `Тест парсинга form в режиме parse №${ i }`,
            setRequest(request, '/form/params', parseOptions)
          )
        }
      })
    }
  })
}


function sortingParams(paramsObject) {
	return Object.entries(paramsObject).sort((el1, el2) => {
		if (el1[0] < el2[0]) return -1
		if (el1[0] === el2[0]) return 0
		if (el1[0] > el2[0]) return 1
	})
}