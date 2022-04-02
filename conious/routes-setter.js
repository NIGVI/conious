

/**
 * @callback middleware
 * 
 * @argument {{
 * 	req: http.IncomingMessage,
 * 	res: http.ServerResponse,
 * }} options
 */

/**
 * @callback controller
 * 
 * @argument {{
 * 	path: object,
 * 	params: null | string | object,
 * 	body: null | object
 * }} options
 * 
 * @returns {string|Readable}
 */

const fs = require('fs')

const { getBodySetting, getParamsSetting } = require('./handling-external-data/scheme-generator.js')
const { testOnRegExp, serializeToRegExp } = require('./regexp.js')

const minute = 1000 * 60
const hour = minute * 60
const day = hour * 24
const month = day * 30
const year = day * 365


class RoutesSetter {

	entryHandlers = []
	staticFile = Object.create(null)
	controllers = []

	basePath = '/'
	defaultMethod = 'ANY'
	defaultOutput = 'none'

	/**
	 * @param {{
	 * 	env: object
	 * 	options: object
	 * 	basePath?: string
	 * 	errorHandler?: Function
	 * 	defaultMethod?: string
	 * 	defaultOutput?: string
	 * 	responseFunctions: object
	 * }} options 
	 */
	constructor(options) {
		const {
			env,
			basePath,
			response,
			errorHandler,
			defaultMethod,
			defaultOutput,
			staticController,
			responseFunctions,
			options: topOptions,
		} = options

		
		this.defaultMethod = defaultMethod?.toUpperCase() ?? this.defaultMethod
		this.defaultOutput = defaultOutput?.toLowerCase() ?? this.defaultOutput
		this.responseFunctions = responseFunctions
		this.basePath = basePath ?? this.basePath
		this.staticController = staticController
		this.errorHandler = errorHandler
		this.response = response
		this.options = topOptions
		this.env = env
	}


	/**
	 * 
	 * @param {middleware|{
	 * 	handler: middleware
	 * 	method: string
	 * 	output: string
	 * }} optionsOrFunction 
	 */
	entry(optionsOrFunction) {

		// get options
		let handler, method = 'ANY'
		const optionsIsFunction = optionsOrFunction instanceof Function
		
		if (!optionsIsFunction) {
			handler = optionsOrFunction.handler
			method = optionsOrFunction.method?.toUpperCase() ?? method
		}
		if (optionsIsFunction) {
			handler = optionsOrFunction
		}
		if (!handler) {
			throw new Error('No handler in entry method.')
		}
		// end get options


		const endpoint = {
			handler,
			method
		}
		this.entryHandlers.push(endpoint)
	}


	set(...arg) {
		this.#set(this.defaultMethod, ...arg)
	}
	get(...arg) {
		this.#set('GET', ...arg)
	}
	post(...arg) {
		this.#set('POST', ...arg)
	}
	put(...arg) {
		this.#set('PUT', ...arg)
	}
	delete(...arg) {
		this.#set('DELETE', ...arg)
	}
	update(...arg) {
		this.#set('UPDATE', ...arg)
	}


	#set(topMethod, optionsOrPath, nullOrOptionsOrHandler) {

		// get options
		let path, handler, method, output, params, body, cache
		const firstArgIsPath = typeof optionsOrPath === 'string' || optionsOrPath instanceof RegExp
		const firstArgIsOptions = optionsOrPath && typeof optionsOrPath === 'object' && !(optionsOrPath instanceof Function)
		const twoArgIsFunction = nullOrOptionsOrHandler instanceof Function
		const twoArgIsOptions = nullOrOptionsOrHandler && !twoArgIsFunction && typeof nullOrOptionsOrHandler === 'object'

		if (firstArgIsPath) {
			path = optionsOrPath

			if (twoArgIsOptions) {
				({ method, output, handler, params, body, cache } = nullOrOptionsOrHandler)
			}
			if (twoArgIsFunction) {
				handler = nullOrOptionsOrHandler
			}
			if (!twoArgIsOptions && !twoArgIsFunction) {
				throw new Error(`Second argument no options or function the path ${ path }.`)
			}
		}
		if (firstArgIsOptions) {
			({ path, method, output, handler, params, body, cache } = optionsOrPath)
		}
		if (!path) {
			throw new Error('No path in controllers setter method.')
		}
		if (!handler) {
			throw new Error(`Not handler on the path ${ path }.`)
		}
		// end get options


		const settings = {}

		if (params) {
			Object.assign(settings, { params: getParamsSetting(params) })
		}
		if (body) {
			Object.assign(settings, { body: getBodySetting(body) })
		}
		settings.cache = this.#getCacheSetting(cache, day, false, true)

		method = method?.toUpperCase() ?? topMethod
		settings.output = output?.toLowerCase() ?? this.defaultOutput

		this.#setRoute(path, method, settings, handler)
	}


	async branch(optionsOrPath, nullOrOptions) {

		// get options
		let path, handler, method, output, params, body, defaultHandlers
		const firstArgIsPath = typeof optionsOrPath === 'string' || optionsOrPath instanceof RegExp

		if (!firstArgIsPath) {
			({ path, method, output, handler, params, body, defaultHandlers } = optionsOrPath)
		}
		if (firstArgIsPath) {
			if (!(nullOrOptions instanceof Object) && nullOrOptions === null) {
				throw new Error(`Not options on the path ${ path } in branch setter method.`)
			}
			({ method, output, handler, params, body, defaultHandlers } = optionsOrPath)

			path = optionsOrPath
		}
		if (!path) {
			throw new Error('Path must not be a regular expression in branch setter method.')
		}
		if (path instanceof RegExp) {
			throw new Error('Path must not be a regular expression.')
		}
		if (!handler) {
			throw new Error(`Not handler on the path ${ path } in branch setter method.`)
		}
		// end get options


		const Conious = require('./conious.js')
		const settings = {}

		if (params) {
			Object.assign(settings, { params: getParamsSetting(params) })
		}
		if (body) {
			Object.assign(settings, { body: getBodySetting(body) })
		}

		method = method?.toUpperCase() ?? this.defaultMethod
		output = output?.toLoverCase() ?? this.defaultOutput
		settings.output = output

		defaultHandlers = Object.assign(
			{}, this.responseFunctions,
			{
				_staticController: this.staticController,
				errorHandler: this.errorHandler
			},
			defaultHandlers
		)


		if (!path.endsWith('/')) {
			path += '/'
		}
		

		const branchOptions = {
			basePath: path,
			defaultMethod: method,
			defaultOutput: output,
			defaultHandlers: defaultHandlers,
		}
		const branch = new Conious(null, Object.assign(this.options, branchOptions))

		const maybePromise = handler(branch)
		if (maybePromise instanceof Promise) {
			await maybePromise
		}
		
		this.#setRoute(path, method, settings, branch, true)
	}


	async static(optionsOrPath, nullOrDirPath, nullOrCache) {

		// set options
		let dirPath, path, cache

		if (typeof optionsOrPath === 'string') {
			if (typeof nullOrDirPath !== 'string') {
				throw new Error('Invalid directory path.')
			}

			path = optionsOrPath
			dirPath = nullOrDirPath
			cache = nullOrCache
		}

		if (optionsOrPath && typeof optionsOrPath === 'object') {
			({ path, dirPath, cache } = optionsOrPath)
		}

		if (typeof path !== 'string') {
			throw new Error('No web path for static files.')
		}
		try {
			if (typeof dirPath !== 'string') {
				throw new Error('Invalid directory path.')
			}
			const dir = await fs.promises.stat(dirPath)

			if (dir.isFile()) {
				throw new Error(`It is not directory on this path: ${ dirPath }`)
			}
		} catch (err) {
			if (err.code === 'ENOENT') {
				throw new Error(`No directory on this path: ${ dirPath }.`)
			}
			throw err
		}
		// end set options

		const cacheSetting = this.#getCacheSetting(cache, month, true, false)
		if (!path.endsWith('/')) {
			path += '/'
		}

		await this.staticController.setStaticPath(this.staticFile, path, dirPath, cacheSetting)
	}


	#getCacheSetting(cache, defaultTime, cachingDefault, innerMode = true) {
		const cacheSetting = { time: defaultTime, innerMode: false, caching: cachingDefault }

		if (cache === false || cache === 0 || cache === 'no' || cache === 'not') {
			cacheSetting.caching = false
		}
		if (typeof cache === 'number') {
			cacheSetting.time = cache
		}
		if (cache instanceof Date) {
			cacheSetting.time = cache
		}
		if (typeof cache === 'string') {

			if (innerMode && cache === 'inner') {
				cacheSetting.innerMode = true
			}

			if (cache !== 'inner') {
				const calcTime = (regexp, weight) => regexp ? regexp.groups.number * weight : 0

				const minutes = cache.match(/(?<number>-?\d*)(\s*-\s*|\s*)min(utes?)?\b/)
				const hours = cache.match(/(?<number>-?\d*)(\s*-\s*|\s*)h(ours?)?\b/)
				const days = cache.match(/(?<number>-?\d*)(\s*-\s*|\s*)d(ays?)?\b/)
				const months = cache.match(/(?<number>-?\d*)(\s*-\s*|\s*)m(on(ths?)?)?\b/)
				const years = cache.match(/(?<number>-?\d*)(\s*-\s*|\s*)y(ears?)?\b/)
				
				let time = calcTime(minutes, minute)
				time += calcTime(hours, hour)
				time += calcTime(days, day)
				time += calcTime(months, month)
				time += calcTime(years, year)
	
				cacheSetting.time = time
			}

		}
		return cacheSetting
	}


	#setRoute(path, method, settings, handler, isBranch = false) {

		if (path instanceof RegExp) {
			const regexpEndpoint = Object.assign({
				isBranch: false,
				isRegExp: true,
				path: path,
				handler: handler,
				method: method
			}, settings)

			this.controllers.push(regexpEndpoint)
			return regexpEndpoint
		}


		if (typeof path === 'string') {
			
			if (!path.endsWith('/')) {
				path += '/'
			}

			const isRegExp = testOnRegExp(path)

			if (isRegExp) {
				const regexp = serializeToRegExp(path)

				const regexpEndpoint = Object.assign({
					isBranch: isBranch,
					isRegExp: true,
					path: regexp,
					handler: handler,
					method: method
				}, settings)
	
				this.controllers.push(regexpEndpoint)
				return regexpEndpoint
			}

			const endpoint = Object.assign({
				isBranch: isBranch,
				isRegExp: false,
				path: path,
				handler: handler,
				method: method
			}, settings)

			this.controllers.push(endpoint)
			return endpoint
		}
	}

}


module.exports = {
	RoutesSetter
}