

const { Setting } = require('./setting.js')

module.exports = {
  getParamsSetting(params) {
		return getBodySetting({
			mode: params.mode,
			type: 'params',
			scheme: params.scheme
		})
	},

	getBodySetting(body) {
		return getBodySetting({
			mode: body.mode,
			type: body.type,
			scheme: body.scheme
		})
	}
}


function getBodySetting(body) {
  const noSetting = { isLoad: false, isParse: false, isScheme: false, mode: 'none', type: 'any', scheme: null }

  if (typeof body === 'string') {
    if (body === 'parse') {
      return { isLoad: true, isParse: true, isScheme: false, mode: body, type: 'any', scheme: null }
    }
    if (body === 'raw') {
      return { isLoad: true, isParse: false, isScheme: false, mode: body, type: 'any', scheme: null }
    }
    return noSetting
  }

  if (body.mode === 'raw') {
    return { isLoad: true, isParse: false, isScheme: false, mode: body.mode, type: 'any', scheme: null }
  }

  if (body.mode === 'parse') {
    if (body.scheme) {
      const scheme = parseForSchemeTopLevel(body.scheme, false, body.type ?? 'any')
      return { isLoad: true, isParse: true, isScheme: false, mode: body.mode, type: body.type ?? 'any', scheme: scheme }
    }
    return { isLoad: true, isParse: true, isScheme: false, mode: body.mode, type: body.type ?? 'any', scheme: null }
  }

  if (body.mode === 'scheme' && body.scheme) {
    const scheme = parseForSchemeTopLevel(body.scheme, true, body.type ?? 'any')
    return { isLoad: true, isParse: true, isScheme: true, mode: body.mode, type: body.type ?? 'any', scheme: scheme }
  }

  if (body.mode === 'scheme' && !body.scheme) {
    throw new Error('No schema specified inside body options.')
  }

  return noSetting
}


function parseForSchemeTopLevel(scheme, required, type) {

  // object
  if (isObject(scheme)) {
    const setting = objectSetting(scheme, true, type)
    setting.objectElements.map(el => {
      if (required === false) el.required = false
      return el
    })
    if (required === false) {
      setting.required = false
    }
    return setting
  }

  // array
  if (isArray(scheme)) {
    if (type === 'json') {
      const setting = arraySetting(scheme, type)
      setting.required = required
      return setting
    }
    if (type !== 'json') {
      throw new Error('Non json cannot have a array at the top.')
    }
  }

  // setting
  if (isSetting(scheme)) {
    // todo

    if (type !== 'json') {
      if ([].array || [].object) {
        throw new Error('Non json cannot have in an array such types as object or other array.')
      }
    }
  }

  // primitive value
  if (isPrimitiveValue(scheme)) {
    if (type === 'json') {
      if (typeof scheme === 'string') {
        return getElement({ required: required, type: scheme })
      } else {
        return getElement({ required: required, const: scheme })
      }
    }
    if (type !== 'json') {
      throw new Error('Non json cannot have a primitive type at the top.')
    }
  }

  // function
  if (scheme instanceof Function) {
    return getElement({
      required: required,
      function: true,
      validFunction: scheme
    })
  }
}


function parseForScheme(scheme, type) {

  // object
  if (isObject(scheme)) {
    return objectSetting(scheme, false, type)
  }

  // array
  if (isArray(scheme)) {
    return arraySetting(scheme, type)
  }

  // setting
  if (isSetting(scheme)) {
    // todo

    if (type !== 'json') {
      if ([].array || [].object) {
        throw new Error('Non json cannot have in an array such types as object or other array.')
      }
    }
  }

  // primitive value
  if (isPrimitiveValue(scheme)) {
    if (typeof scheme === 'string') {
      return getElement({ type: scheme })
    } else {
      return getElement({ const: scheme })
    }
  }

  // function
  if (scheme instanceof Function) {
    return getElement({
      function: true,
      validFunction: scheme
    })
  }
}


function objectSetting(scheme, topObject, schemeType) {
  const resultScheme = []

  for (let name of Object.keys(scheme)) {
    let requiredItem = true
    let valueFromScheme = scheme[name]
    let type = null
    let fun = null
    const isFunction = valueFromScheme instanceof Function

    
    if (name.endsWith('?')) {
      requiredItem = false
      name = name.slice(0, name.length - 1)
    }
    if (typeof valueFromScheme === 'string') {
      type = valueFromScheme
    }
    if (isFunction) {
      fun = valueFromScheme
    }

    if ((topObject || schemeType === 'json') && !isPrimitiveValue(valueFromScheme)) {
      const branchInScheme = parseForScheme(valueFromScheme, schemeType)
      branchInScheme.name = name
      branchInScheme.required = requiredItem
      resultScheme.push(branchInScheme)
      continue
    }

    resultScheme.push(getElement({
      name,
      type,
      required: requiredItem,
      function: isFunction,
      validFunction: fun
    }))
  }

  return getElement({
    object: true,
    objectElements: resultScheme
  })
}


function arraySetting(scheme, type) {
  const result = { array: true, arrayElements: [] }

  for (const element of scheme) {
    const elementSetting = parseForScheme(element, type)
    if (type !== 'json') {
      if (elementSetting.array || elementSetting.object) {
        throw new Error('Non json cannot have in an array such types as object or other array.')
      }
    }
    result.arrayElements.push(elementSetting)
  }

  return getElement(result)
}


function getElement(options) {
  return Object.assign({
    name: null,
    required: true,
    const: null,
    type: null,
    array: false,
    arrayElements: [],
    object: false,
    objectElements: [],
    function: false,
    validFunction: null
  }, options)
}
function isPrimitiveValue(scheme) {
  return !isArray(scheme) && !isObject(scheme) && !isSetting(scheme) && !(scheme instanceof Function)
}
function isArray(scheme) {
  return scheme instanceof Array
}
function isObject(scheme) {
  return typeof scheme === 'object' && scheme !== null && !(scheme instanceof Setting) && !(scheme instanceof Array) && !(scheme instanceof Function)
}
function isSetting(scheme) {
  return scheme instanceof Setting
}