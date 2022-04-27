

module.exports = {
  paramsParser(setting, rawParams, readyParams) {

    if (setting?.isParse) {
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
  
    if (setting?.isLoad) {
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
  const unique = Symbol('')
  const result = {}
  let isTrue = true
  

  // object
  if (scheme.object) {
    for (const schemeElement of scheme.objectElements) {
      // array
      if (schemeElement.array) {
        const values = raw[schemeElement.name] ?? []
        const validValues = []

        for (const value of values) {
          for (const schemeArrayElement of schemeElement.arrayElements) {

            // type
            if (schemeArrayElement.type) {
              if (schemeArrayElement.type === 'string') {
                validValues.push(value)
                break
              }
  
              if (schemeArrayElement.type === 'number') {
                const numberValue = +value
                if (isNaN(numberValue)) {
                  continue
                }
                validValues.push(numberValue)
                break
              }
            }

            // function
            if (schemeArrayElement.function) {
              const { ok, value: newValue } = schemeArrayElement.validFunction(value)
        
              if (!ok) {
                continue
              }
              validValues.push(newValue)
              break
            }

            // const
            if (schemeArrayElement.const === value) {
              validValues.push(value)
              break
            }
          }
        }
        result[schemeElement.name] = validValues
        continue
      }

      // function
      if (schemeElement.function && (raw[schemeElement.name] ?? unique) !== unique) {
        const { ok, value } = schemeElement.validFunction(raw[schemeElement.name][0])
        
        if (schemeElement.required && !ok) {
          isTrue = false
          break
        }
        if (ok) {
          result[schemeElement.name] = value
        }
        continue
      }

      // primitive value
      if (schemeElement.type) {
        if (raw[schemeElement.name] && raw[schemeElement.name].length === 1) {
          const value = raw[schemeElement.name][0]
          
          if (schemeElement.type === 'string') {
            result[schemeElement.name] = value
            continue
          }

          if (schemeElement.type === 'number') {
            const numberValue = +value

            if (isNaN(numberValue)) {
              if (schemeElement.required) {
                isTrue = false
                break
              }
              continue
            }
            result[schemeElement.name] = numberValue
            continue
          }

          if (schemeElement.type === 'boolean') {
            if (value === '') {
              result[schemeElement.name] = true
              continue
            }
            result[schemeElement.name] = false
            continue
          }

          if (schemeElement.required) {
            isTrue = false
            break
          }
          continue
        }
        if (raw[schemeElement.name] && raw[schemeElement.name].length === 0 && schemeElement.type === 'boolean') {
          result[schemeElement.name] = false
        }
      }
      if (schemeElement.required) {
        isTrue = false
        break
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