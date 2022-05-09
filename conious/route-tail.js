

class RouteTail {

  constructor(controller, responseFunctions) {
    this.controller = controller
    this.responseFunctions = responseFunctions
  }

  noValid(callbackOrRedirect) {
    this.controller.hasNoValid = true

    const isFunction = callbackOrRedirect instanceof Function
    const isRedirect = typeof callbackOrRedirect === 'string'

    if (!isFunction && !isRedirect) {
      throw new Error('In method noValid need to pass callback or redirect string.')
    }

    if (isRedirect) {
      const is404Or500 = callbackOrRedirect === 'code400' || callbackOrRedirect === 'code500'
      
      if (!is404Or500 && !(callbackOrRedirect in this.responseFunctions)) {
        throw new Error(`No '${ callbackOrRedirect }' response function.`)
      }
    }

    this.controller.noValid.all = callbackOrRedirect
  }
}


module.exports = {
  RouteTail
}