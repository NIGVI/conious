

module.exports = {
  paramsParser(setting, rawParams, readyParams) {

    if (setting.isParse) {
      let newReadyParams = null
      let resultParams = null
  
      if (!readyParams) {
        let params = Object.create(null)
        if (rawParams && rawParams !== '?') {
          const paramEntries = new URLSearchParams(rawParams).entries()
    
          for (const [name, value] of paramEntries) {
            if (!params[name]) {
              params[name] = []
            }
            params[name].push(value)
          }
        }
        // for (const name of Object.keys(params)) {
        // 	// if (params[name].length === 1) {
        // 	// 	params[name] = params[name][0] === '' ? true : params[name][0]
        // 	// 	continue
        // 	// }
          
        // 	for (let i = 0; i < params[name].length; i++) {
        // 		params[name][i] = params[name][i] === '' ? true : params[name][i]
        // 	}
        // }
        newReadyParams = params
      } else {
        newReadyParams = readyParams
      }
      resultParams = JSON.parse(JSON.stringify(newReadyParams))
  
      if (setting.isParse) {
        const { ok, result: params } = schemaParameterMatching(setting.scheme, resultParams, new URLSearchParams(rawParams))
        return { ok, params, newReadyParams }
      }
  
      return {
        ok: true,
        params: resultParams,
        newReadyParams
      }
    }
  
    if (setting.isLoad) {
      return {
        ok: true,
        params: rawParams,
        newReadyBody: readyParams
      }
    }
  
    return {
      ok: true,
      params: null,
      newReadyParams: readyParams
    }
  }
}


function schemaParameterMatching(scheme, raw, searchParams) {
  let isTrue = true
  let result = {}

  // object
  if (scheme.object) {
    for (const element of scheme.objectElements) {
      // array
      if (element.array) {
        const value = raw[element.name] ?? []
        const validValue = []

        for (const element of value) {
          for (const schemeElement of element.arrayElements) {

            // type
            if (schemeElement.type) {
              if (schemeElement.type === 'string') {
                validValue.push(element)
                break
              }
  
              if (schemeElement.type === 'number') {
                const numberValue = +value
                if (isNaN(numberValue)) {
                  continue
                }
                validValue.push(numberValue)
                break
              }
            }

            // function
            if (schemeElement.function) {
              const { ok, value } = schemeElement.validFunction(element)
        
              if (!ok) {
                continue
              }
              validValue.push(value)
              break
            }

            // const
            if (schemeElement.const === value) {
              validValue.push(value)
              break
            }
          }
        }
        result[element.name] = validValue
        continue
      }

      // function
      if (element.function) {
        const { ok, value } = scheme.validFunction(raw[element.name] ?? [])
        
        if (element.required && !ok) {
          isTrue = false
          break
        }
        if (ok) {
          result[element.name] = value
        }
        continue
      }

      // primitive value
      if (element.type) {
        if (raw[element.name] && raw[element.name].length === 1) {
          const value = raw[element.name][0]
          
          if (element.type === 'string') {
            result[element.name] = value
            continue
          }

          if (element.type === 'number') {
            const numberValue = +value
            if (isNaN(numberValue)) {
              if (element.required) {
                isTrue = false
                break
              }
              continue
            }
            result[element.name] = numberValue
            continue
          }

          if (element.type === 'boolean') {
            if (value === '') {
              result[element.name] = true
              continue
            }
            result[element.name] = false
            continue
          }

          if (element.required) {
            isTrue = false
            break
          }
          continue
        }
        if (raw[element.name] && raw[element.name].length === 0 && element.type === 'boolean') {
          result[element.name] = false
        }
      }
    }
  }

  // function
  if (scheme.function) {
    const { ok, value } = scheme.validFunction(searchParams)
    return { ok, result: value }
  }
  
  return { ok: isTrue, result }
}