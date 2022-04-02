/* eslint-env node */


import http from 'http'



// body and params
type body = object | null | string | boolean

interface bodyParseOptions {
  parse: boolean,
  load: boolean,
  shame: object | Function | string | null
}
interface paramsParseOptions {
  parse: boolean,
  shame: object | null
}



// response type

type handlerResponse = string | ReadableStream | redirect | (() => handlerResponse | Promise<handlerResponse>)

interface redirect {
  fun: Function,
  send: (req: http.IncomingMessage, res: http.ServerResponse, send: Function) => handlerResponse
}

type send = (name: string, values: object) => redirect



// handler options
interface middlewareNext {
  matched: boolean
}

interface handlerOptions {
  env: object
  body: body | null
  params: object | null
}
interface middlewareOptions extends handlerOptions {
  req: http.IncomingMessage,
  res: http.ServerResponse,
  next: () => Promise<middlewareNext>
}
interface controllerOptions extends handlerOptions {
  send: send
}
type middlewareHandler = (options: middlewareOptions) => Promise<handlerResponse> | handlerResponse
type controllerHandler = (options: controllerOptions) => Promise<handlerResponse> | handlerResponse



// format handler storage

interface middleware {
  handler: middlewareHandler,
  method: string,
  body: bodyParseOptions,
  params: paramsParseOptions
}

interface controller {
  isBranch: boolean,
  isRegExp: boolean
  handler: controllerHandler,
  path: string | RegExp,
  method: string,
  output: string,
  body: bodyParseOptions,
  params: paramsParseOptions
}



const obj = {
  body: {
    mode: 'parse',
    scheme: {
      'name': 'string',
      'surname': 'string',
      '?age': 'number'
    }
  }
}