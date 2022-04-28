

const {
  getParamsOrFieldFromRawString,
  schemeMappingForFormOrParams
} = require('./reuse-functions-params-and-form.js')


module.exports = {
  paramsParser(setting, rawParams, readyParams) {

    if (setting?.isParse) {
      let newReadyParams = null
  
      if (!readyParams) {
        const params = getParamsOrFieldFromRawString(rawParams)
        newReadyParams = params
      } else {
        newReadyParams = readyParams
      }
      const resultParams = JSON.parse(JSON.stringify(newReadyParams))
  

      if (setting.isParse) {
        const { ok, result: params } = schemeMappingForFormOrParams(setting.scheme, resultParams, new URLSearchParams(rawParams))
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