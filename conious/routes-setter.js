

const {
	getBodySetting,
	getParamsSetting,
	getFilesSetting,
	createTempFolder
} = require('./scheme/scheme-generator.js')
const {
	testOnRegExp,
	serializeToRegExp
} = require('./regexp.js')
const { RouteTail } = require('./route-tail.js')

const minute = 1000 * 60
const hour = minute * 60
const day = hour * 24
const month = day * 30
const year = day * 365


class RoutesSetter {

	entryHandlers = []
	staticFile = Object.create(null)
	staticRoutes = []
	controllers = []

	basePath = '/'
	defaultMethod = 'ANY'
	defaultOutput = 'html'


	constructor(options) {
		const {
			env,
			temp,
			basePath,
			response,
			errorHandler,
			defaultMethod,
			defaultOutput,
			responseFunctions,
			options: topOptions,
		} = options

		
		this.defaultMethod = defaultMethod?.toUpperCase() ?? this.defaultMethod
		this.defaultOutput = defaultOutput?.toLowerCase() ?? this.defaultOutput
		this.responseFunctions = responseFunctions
		this.basePath = basePath ?? this.basePath
		this.errorHandler = errorHandler
		this.response = response
		this.options = topOptions
		this.temp = temp
		this.env = env

		if (temp) {
			createTempFolder(temp)
		}
	}


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
		return this.#set(this.defaultMethod, ...arg)
	}
	get(...arg) {
		return this.#set('GET', ...arg)
	}
	post(...arg) {
		return this.#set('POST', ...arg)
	}
	put(...arg) {
		return this.#set('PUT', ...arg)
	}
	delete(...arg) {
		return this.#set('DELETE', ...arg)
	}


	#set(topMethod, optionsOrPath, nullOrOptionsOrHandler) {

		// get options
		let path, handler, method, output, params, body, cache, files
		const firstArgIsPath = typeof optionsOrPath === 'string' || optionsOrPath instanceof RegExp
		const firstArgIsOptions = optionsOrPath && typeof optionsOrPath === 'object' && !(optionsOrPath instanceof Function)
		const twoArgIsFunction = nullOrOptionsOrHandler instanceof Function
		const twoArgIsOptions = nullOrOptionsOrHandler && !twoArgIsFunction && typeof nullOrOptionsOrHandler === 'object'

		if (firstArgIsPath) {
			path = optionsOrPath

			if (twoArgIsOptions) {
				({ method, output, handler, params, body, cache, files } = nullOrOptionsOrHandler)
			}
			if (twoArgIsFunction) {
				handler = nullOrOptionsOrHandler
			}
			if (!twoArgIsOptions && !twoArgIsFunction) {
				throw new Error(`Second argument no options or function the path ${ path }.`)
			}
		}
		if (firstArgIsOptions) {
			({ path, method, output, handler, params, body, cache, files } = optionsOrPath)
		}
		if (!path) {
			throw new Error('No path in controllers setter method.')
		}
		if (!handler) {
			throw new Error(`Not handler on the path ${ path }.`)
		}
		// end get options


		const settings = {}

		// getting settings
		if (files) {
			Object.assign(settings, { files: getFilesSetting(files, this.temp) })
		}
		if (params) {
			Object.assign(settings, { params: getParamsSetting(params) })
		}
		if (body) {
			Object.assign(settings, { body: getBodySetting(body) })
		}
		// end getting settings

		// testing of type in validation setting
		if (settings.files && settings.body) {
			if (settings.body.type === 'json') {
				throw new Error('Body can\'t be json type together with files.')
			}
			if (settings.body.type === 'any' && settings.files.hasRequired) {
				throw new Error('Files option with required files must by only form body type.')
			}
		}
		// end testing of type in validation setting

		settings.cache = this.#getCacheSetting(cache, day, false, true)

		method = method?.toUpperCase() ?? topMethod
		settings.output = output?.toLowerCase() ?? this.defaultOutput

		const endpoint = this.#setRoute(path, method, settings, handler)

		// no valid
		endpoint.hasNoValid = false
		endpoint.noValid = {
			all: null,
			body: null,
			files: null,
			params: null
		}
		return new RouteTail(endpoint, this.responseFunctions)
		// end no valid
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

	async static(path, dirPath, settings) {

		// set options
		let cache, index = false, short = false

		if (typeof path !== 'string') {
			throw new Error('Invalid path.')
		}
		if (typeof dirPath !== 'string') {
			throw new Error('Invalid directory path.')
		}

		if (typeof settings === 'object' && settings !== null) {
			if (settings.cache || settings.cache === 0) {
				cache = settings.cache
			}
			index = !!settings.index
			short = !!settings.shortName
		}
		// end set options

		const cacheSetting = this.#getCacheSetting(cache, month, false, false)
		if (path.endsWith('/')) {
			path += path.slice(0, path.length - 1)
		}

		this.staticRoutes.push([
			path,
			dirPath,
			{
				cache: cacheSetting,
				index,
				short
			}
		])
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