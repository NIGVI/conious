

module.exports = {

	testOnRegExp(path) {

		const testOnNamedRegExp = path.match(/(([^\\](\\\\)*){[^/]*?([^\\](\\\\)*)})/)
		const testOnRegExp = path.match(/(([^\\](\\\\)*)\([^/]*?([^\\](\\\\)*)\))/)
		const testOnSymbol = path.match(/\(|\)|\$|\^|\{|\}|\+|\*|\?/)

		return testOnNamedRegExp || testOnRegExp || testOnSymbol
	},


	serializeToRegExp(path, isBranch) {

		path = shieldingRegExpSymbols(path)
		path = serializePlusAndStarSymbols(path)
		// path = serializeToRegExp(path)
		path = serializeNamedRegExpToRegExp(path)

		path = `^${ path }?$`

		if (isBranch) {
			path = path.slice(0, path.length - 2)
		}

		return new RegExp(path)
		// ([^\\](\\\\)*)
	}
}


function shieldingRegExpSymbols(path) {

	const result = deleteCustomRegExp(path)
	const regexpOffsets = result.regexpOffsets
	path = result.path

	
	path = path.replace(/((?<slash>\\+)(?<notSymbol>[^{}()*+?]))/g, (...arg) => {

		const offset = arg.at(-2)
		const groups = arg.at(-1)
		const slash = groups.slash ?? ''
		const notSymbol = groups.notSymbol

		moveOffset(offset, slash.length, regexpOffsets)
		return `${ slash }${ slash }${ notSymbol }`
	})

	path = path.replace(/((?<prev>[^\\](\\\\)*)(?<content1>\(|\)|\{|\})|(?<content2>\[|\]|\||\^|\$|\?))/g, (...arg) => {

		const offset = arg.at(-2)
		const groups = arg.at(-1)
		const prev = groups.prev ?? ''
		const content = groups.content1 ?? groups.content2

		moveOffset(offset, 1, regexpOffsets)
		return `${ prev }\\${ content }`
	})

	path = setCustomRegExpAfterDelete(path, regexpOffsets)

	return path
}


function serializePlusAndStarSymbols(path) {

	const result = deleteCustomRegExp(path)
	const regexpOffsets = result.regexpOffsets
	path = result.path

	path = path.replace(/(?<prev>([^\\](\\\\)*|\/))(?<symbols>\*\*|\+\*|\+|\*)/, (str, ...arg) => {
		const groups = arg.at(-1)
		const offset = arg.at(-3)
		const prev = groups.prev ?? ''
		const symbols = groups.symbols

		let result = ''

		if (symbols === '**') {
			result = `${ prev }.*?`
		}
		if (symbols === '+*') {
			result = `${ prev }.+?`
		}
		const plusOrStar = symbols === '+' || symbols === '*'

		if (prev !== '/' && plusOrStar) {
			result = `${ str }?`
		}
		if (prev === '/' && plusOrStar) {
			if (symbols === '*') {
				result = `${ prev }[^/]*?`
			}
			if (symbols === '+') {
				result = `${ prev }[^/]+?`
			}
		}

		for (const regexpOffset of regexpOffsets) {
			if (regexpOffset.offset > offset) {
				regexpOffset.offset = regexpOffset.offset + (str.length - result.length)
			}
		}

		return result
	})

	path = setCustomRegExpAfterDelete(path, regexpOffsets)

	return path
}


function moveOffset(offset, d, regexpOffsets) {
	for (const regexpOffset of regexpOffsets) {
		if (regexpOffset.offset > offset) {
			regexpOffset.offset = regexpOffset.offset + d
		}
	}
}


function	deleteCustomRegExp(path) {
	const regexpOffsets = []

	path = path.replace(/((?<prev>[^\\](\\\\)*){[^/]*?([^\\](\\\\)*)}(\*\*|\+\*|\+|\*)?)/g, (str, ...arg) => {
		const offset = arg.at(-3)
		const groups = arg.at(-1)
		const prev = groups.prev ?? ''
		const userRegExp = str.slice(prev.length)

		regexpOffsets.push({
			regexp: userRegExp,
			offset: offset + prev.length
		})
		return prev + ' '.repeat(userRegExp.length)
	})

	path = path.replace(/((?<prev>[^\\](\\\\)*)\([^/]*?([^\\](\\\\)*)\)(\*\*|\+\*|\+|\*)?)/g, (str, ...arg) => {
		const offset = arg.at(-3)
		const groups = arg.at(-1)
		const prev = groups.prev ?? ''
		const userRegExp = str.slice(prev.length)

		regexpOffsets.push({
			regexp: userRegExp,
			offset: offset + prev.length
		})
		return prev + ' '.repeat(userRegExp.length)
	})

	return {
		path,
		regexpOffsets
	}
}

function setCustomRegExpAfterDelete(path, regexpOffsets) {
	for (const regexpOffset of regexpOffsets) {
		path =
			path.slice(0, regexpOffset.offset) +
			regexpOffset.regexp +
			path.slice(regexpOffset.offset + regexpOffset.regexp.length)
	}

	return path
}

function serializeNamedRegExpToRegExp(path) {

	let regexpToString = path.replace(/(?<prev>[^\\](\\\\)*){(?<content>[^/]+([^\\](\\\\)*))}(?<setting>|\+|\+\*|\*|\*\*)?/g, (...arg) => {
		const content = arg.at(-1).content.trim()
		const setting = arg.at(-1).setting
		const prev = arg.at(-1).prev ?? ''
		let endRegExp = '[^/]+?'

		if (setting) {
			if (setting === '*' || setting === '+') {
				endRegExp = `${ setting }[^/]+?`
			}
			if (setting === '**') {
				endRegExp = `*?`
			}
			if (setting === '+*') {
				endRegExp = `+?`
			}
		}

		const regexpResult = content.match(/(?<name>[^/(\s]*)\s*(\((?<or>.*)\))?/)

		if (regexpResult && regexpResult.groups.or) {

			if (!setting) {
				endRegExp = ''
			}

			const customRegExp = regexpResult.groups.or.replace(/([^\\](\\\\)*)}/, str => `${ str.split(0, str.length - 1) }}`)

			if (regexpResult.groups.name) {
				return `${ prev }(?<${ regexpResult.groups.name }>(${ customRegExp })${ endRegExp })`
			} else {
				return `${ prev }((${ customRegExp })${ endRegExp })`
			}
		}
		return `${ prev }(?<${ content.trim() }>.${ endRegExp })`
	})

	return regexpToString
}