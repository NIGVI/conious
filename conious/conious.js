

const fs = require('fs')
const { RoutesSetter } = require('./routes-setter.js')
const { Response } = require('./response.js')
const { getValidData } = require('./scheme/get-valid-data.js')
const { StaticController } = require('./static-controller')


class Conious extends RoutesSetter {

	/**
	 * @param {http.Server} server 
	 * @param {{
	 * 	env?: object
	 * 	defaultMethod?: string
	 * 	defaultOutput?: string
	 * 	defaultHandlers: Function[]
	 * }} options 
	 */
	constructor(server, options = {}) {

		const {
			_staticController,
			defaultHandlers = {},
			defaultMethod,
			defaultOutput,
			basePath,
			temp = null,
			env = {}
		} = options

		
		// set handlers and redirects
		const defaultErrorHandler = ({ req, err }) => {
			console.error(`Error on ${ req.url }`, err)
		}
		const { errorHandler = defaultErrorHandler } = defaultHandlers

		const responseFunctions = Object.fromEntries(
			Object.entries(defaultHandlers)
				.filter(el => {
					if (el[0] === 'errorHandler') {
						return false
					}
					if (!(el[1] instanceof Function)) {
						return false
					}
					return true
				})
		)
		// end set handlers and redirects


		const responseOptions = {
			responseFunctions,
			errorHandler
		}

		const response = new Response(responseOptions)
		const staticController = _staticController ?? new StaticController()

		const routerOptions = {
			responseFunctions,
			staticController,
			defaultMethod,
			defaultOutput,
			errorHandler,
			basePath,
			response,
			options,
			temp,
			env
		}

		super(routerOptions)

		this.isRoot = this.basePath === '/'

		if (server) {
			const close = server.close
			server.close = (...arg) => {
				staticController.deleteWatchers()
				return close.call(server, ...arg)
			}
			server.on('request', this._routing.bind(this))
		}
	}


	async _routing(req, res, settingFromParent) {
		const pendingBeforeResponse = []
		let matched = false

		let fullCloseResolve
		const waitingFullClose = new Promise(res => fullCloseResolve = res)

		let reusedData = {
			params: null,
			body: {
				raw: null,
				json: null,
				form: null, 
				requestFile: null
			}
		}

		try {
			// global env of the request
			let url, urlParams, parentPaths = {}

			const send = this.response.getResponseFunction.bind(this.response)
			const originalURL = req.url

			if (settingFromParent) {
				url = settingFromParent.url
				urlParams = settingFromParent.urlParams
				parentPaths = settingFromParent.parentPaths
				reusedData = settingFromParent.reusedData
			} else {
				const indexQuestionChar = req.url.indexOf('?')
				const hasUrlParam = indexQuestionChar !== -1
				url = decodeURI(hasUrlParam ? req.url.slice(0, indexQuestionChar) : req.url)
				urlParams = hasUrlParam ? req.url.slice(indexQuestionChar + 1) : null

			}

			if (!url.endsWith('/')) {
				url += '/'
			}
	
			if (!this.isRoot) {
				url = url.slice(this.basePath.length - 1)
			}
			

			// middleware
			for (let i = 0; i < this.entryHandlers.length; i++) {
				const middleware = this.entryHandlers[i]
				const methodIsAnyOrEqual = middleware.method === 'ANY' || middleware.method === req.method
				
				if (methodIsAnyOrEqual) {
					let resolveOfTheEnd, resolveOfTheMiddleware
	
					const pendingOfTheEnd = new Promise(res => resolveOfTheEnd = res)
	
					const pending = new Promise((resolve) => {
						resolveOfTheMiddleware = resolve
					})
	
					const next = () => {
						resolveOfTheMiddleware()
						return pendingOfTheEnd
					}

					const middlewareArg = {
						req,
						res,
						next,
						send,
						env: this.env,
						url,
						originalURL
					}
	
					const middlewarePromise = middleware.handler(middlewareArg)
					const waiting = {
						resolve: resolveOfTheEnd,
						promise: middlewarePromise
					}
					pendingBeforeResponse.push(waiting)
	
					await pending
				}
			}
			// end middleware
	
	
			// static file
			if (req.method === 'GET') {
				const endpoint = this.staticFile[url]
	
				if (endpoint) {

					const middlewareNextArg = {
						matched: true,
						err: null
					}
					await this.#closeMiddlewareHandler(req, res, pendingBeforeResponse, middlewareNextArg, waitingFullClose)

					const result = endpoint.getStream()
			
					if (!this.isRoot) {
						const send = this.response.send.bind(this.response, req, res, result, endpoint, fullCloseResolve)
						return { matched: true, send, waitingFullClose, err: null }
					}
					this.response.send(req, res, result, endpoint, fullCloseResolve)
					return
				}
			}
			// end static file
	
	
			// controller
			for (let i = 0; i < this.controllers.length; i++) {
				const controller = this.controllers[i]
				const isMethodMatched = controller.method === req.method || controller.method === 'ANY'
				
				if (isMethodMatched) {
					// path matched
					let isPathMatched = false
					let paths = {}

					if (controller.isRegExp) {
						const regexpResult = url.match(controller.path)
						if (regexpResult) {
							isPathMatched = true
							if (regexpResult.groups) {
								paths = Object.fromEntries(
									Object.entries(
										regexpResult.groups
									).map(el => {
										return [el[0], decodeURI(el[1])]
									})
								)
							}
						}
					}
					if (!controller.isRegExp) {
						if (controller.isBranch) {
							isPathMatched = url.startsWith(controller.path)
						}
						if (!controller.isBranch) {
							isPathMatched = url === controller.path
						}
					}
					// end path matched

					if (isPathMatched) {
						

						// branch calling
						if (controller.isBranch) {

							const { ok } = await getValidData(req, controller, urlParams, reusedData)

							if (ok) {
								const settingFromParent = {
									parentPaths: Object.assign({}, parentPaths, paths),
									reusedData,
									urlParams,
									url
								}
								let branchResult = await controller.handler._routing(req, res, settingFromParent)
	
								const waitingFullClose = branchResult.waitingFullClose
	
								const middlewareNextArg = {
									matched: branchResult.matched,
									err: null
								}
								await this.#closeMiddlewareHandler(req, res, pendingBeforeResponse, middlewareNextArg, waitingFullClose)
					
								if (!this.isRoot) {
									return { matched: true, send: branchResult.send, waitingFullClose, err: null }
								}
								branchResult.send()
								return
							}

							// controller no valid request
							if (!ok && controller.controllerNoValidRequest) {
								// todo
							}
							// end controller no valid request
						}
						// end branch calling

						// controller calling
						if (!controller.isBranch) {

							const {
								ok,
								body,
								files,
								params
							} = await getValidData(req, controller, urlParams, reusedData)

							if (ok) {

								let passCurrentController = false

								const middlewareNextArg = {
									matched: true,
									err: null
								}
								await this.#closeMiddlewareHandler(req, res, pendingBeforeResponse, middlewareNextArg, waitingFullClose)
	
								const controllerOptions = {
									controllerPass: ()  => { passCurrentController = true },
									paths: Object.assign({}, parentPaths, paths),
									params: params,
									files: files,
									body: body,
									send: send,
									env: this.env,
									originalURL,
									url,
									req,
									res
								}

								if (controller.cache.innerMode) {
									controllerOptions.setCache = (time) => {
										if (time instanceof Date || typeof time === 'number') {
											controller.cache.time = time
											return true
										}
										return false
									}
								}
	
								matched = true
								let result = controller.handler(controllerOptions)
								matched = !passCurrentController
					
								if (result instanceof Promise) {
									result = await result
								}
								if (!passCurrentController) {
									if (!this.isRoot) {
										const send = this.response.send.bind(this.response, req, res, result, controller, fullCloseResolve)
										return { matched: true, send, waitingFullClose, err: null }
									}
									this.response.send(req, res, result, controller, fullCloseResolve)
									return
								}
							}

							// controller no valid request
							if (!ok && controller.controllerNoValidRequest) {
								// todo
							}
							// end controller no valid request
						}
						// end controller calling
					}

				}
			}
			// end controller

			const middlewareNextArg = {
				matched: false,
				err: null
			}
	
			await this.#closeMiddlewareHandler(req, res, pendingBeforeResponse, middlewareNextArg, waitingFullClose)

			const code404 = this.response.getResponseFunction('code404')
			if (!this.isRoot) {
				const send = this.response.send.bind(this.response, req, res, code404, { output: this.defaultOutput }, fullCloseResolve)
				return { matched: false, send, waitingFullClose, err: null }
			}
			
			this.response.send(req, res, code404, { output: this.defaultOutput }, fullCloseResolve)

		} catch (err) {

			const middlewareNextArg = {
				matched: matched,
				err: err
			}
			await this.#closeMiddlewareHandler(req, res, pendingBeforeResponse, middlewareNextArg, waitingFullClose)

			const promise = this.errorHandler({ req, res, err })
			if (promise instanceof Promise) {
				await promise
			}

			const code500 = this.response.getResponseFunction('code500', { err })
			if (!this.isRoot) {
				const send = this.response.send.bind(this.response, req, res, code500, { output: this.defaultOutput }, fullCloseResolve)
				return { matched: false, send, waitingFullClose, err: err }
			}
			this.response.send(req, res, code500, { output: this.defaultOutput }, fullCloseResolve)
		} finally {
			if (this.isRoot && reusedData.body.requestFile) {
				fs.rm(reusedData.body.requestFile, () => {})
			}
		}
	}


	async #closeMiddlewareHandler(req, res, pendingBeforeResponse, middlewareNextArg, waitingFullClose) {
		for (let i = pendingBeforeResponse.length - 1; i >= 0; --i) {

			let waitingCall
			const middlewareIsWaitingFullClose = new Promise(res => waitingCall = res)

			const middleware = pendingBeforeResponse.pop()
			const middlewareWaitResult = {
				...middlewareNextArg,
				waitingFullClose: () => {
					waitingCall()
					return waitingFullClose ? waitingCall : null
				}
			}
			try {
				middleware.resolve(middlewareWaitResult)
				await Promise.race([middleware.promise, middlewareIsWaitingFullClose])
			} catch (err) {
				const promise = this.errorHandler({ req, res, err })
				if (promise instanceof Promise) {
					await promise
				}
			}
		}
	}
	
}


module.exports = Conious