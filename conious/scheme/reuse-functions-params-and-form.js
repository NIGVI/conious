

module.exports = {
  getParamsOrFieldFromRawString,
  schemeMappingForFormOrParams
}

function getParamsOrFieldFromRawString(rawParams) {
  const params = Object.create(null)
  
  if (rawParams && rawParams !== '?') {
    const paramEntries = new URLSearchParams(rawParams).entries()

    for (const [name, value] of paramEntries) {
      if (!params[name]) {
        params[name] = []
      }
      params[name].push(value)
    }
  }
  return params
}


function schemeMappingForFormOrParams(scheme, raw, argForTopLevelFunction) {
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
      if (schemeElement.function && raw[schemeElement.name]) {
        let isValid = false
      
        for (const value of raw[schemeElement.name]) {
          const { ok, value: newValue } = schemeElement.validFunction(value)
      
          if (ok) {
            result[schemeElement.name] = newValue
            isValid = true
            break
          }
        }
      
        if (schemeElement.required && !isValid) {
          isTrue = false
          break
        }
        continue
      }

      // primitive value
      if (schemeElement.type) {
        if (raw[schemeElement.name]) {
          let isValid = false

          for (const value of raw[schemeElement.name]) {
          
            if (schemeElement.type === 'string') {
              result[schemeElement.name] = value
              isValid = true
              break
            }
  
            if (schemeElement.type === 'number') {
              const numberValue = +value
  
              if (isNaN(numberValue)) {
                continue
              }
              result[schemeElement.name] = numberValue
              isValid = true
              break
            }
  
            if (schemeElement.type === 'boolean') {
              if (value === '') {
                result[schemeElement.name] = true
                isValid = true
                break
              }
              result[schemeElement.name] = false
              isValid = true
              break
            }
          }

          if (schemeElement.required && !isValid) {
            isTrue = false
            break
          } 
          continue
        }
        if (!raw[schemeElement.name] && schemeElement.type === 'boolean') {
          result[schemeElement.name] = false
        }
      }

      // required
      if (schemeElement.required) {
        isTrue = false
        break
      }
    }
  }

  // function
  if (scheme.function) {
    const { ok, value } = scheme.validFunction(argForTopLevelFunction)
    return { ok, result: value }
  }
  
  return { ok: isTrue, result }
}