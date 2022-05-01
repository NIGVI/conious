

const {
  getParamsOrFieldFromRawString,
  schemeMappingForFormOrParams
} = require('./reuse-functions-params-and-form.js')


module.exports = {
  paramsParser(setting, rawParams, reusedData) {

    if (setting?.isParse) {

      // getting params
      if (reusedData.params === null) {
        reusedData.params = getParamsOrFieldFromRawString(rawParams)
      }
      const resultParams = JSON.parse(JSON.stringify(reusedData.params))
      // end getting params

      // returning and validation
      if (setting.isParse) {
        const { ok, result: params } = schemeMappingForFormOrParams(setting.scheme, resultParams, new URLSearchParams(rawParams))
        return { ok, params }
      }
  
      return {
        ok: true,
        params: resultParams
      }
      // end returning and validation
    }
  
    if (setting?.isLoad) {
      return {
        ok: true,
        params: rawParams
      }
    }
  
    return {
      ok: true,
      params: null
    }
  }
}