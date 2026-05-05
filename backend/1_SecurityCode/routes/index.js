'use strict'

const { Router } = require('express')
const configList = require('./route-config')
const {
  checkGrade0,
  checkGrade1,
  checkGrade2,
  checkGrade3,
  checkGrade4,
  checkGrade5
} = require('./login-check')

const gradeMiddlewares = {
  0: checkGrade0,
  1: checkGrade1,
  2: checkGrade2,
  3: checkGrade3,
  4: checkGrade4,
  5: checkGrade5
}

function createRouter() {
  const router = Router()

  console.log('~~ routing modules number : %d ~~~', configList.length)
  console.table(configList)

  for (const config of configList) {
    const routeType = String(config.type || '').toLowerCase()
    const routeModule = require(config.file)
    const routeHandler = routeModule[config.method]
    const registerRoute = router[routeType]?.bind(router)

    if (typeof routeHandler !== 'function') {
      throw new Error(`Route handler does not exist: ${config.file}.${config.method}`)
    }

    if (typeof registerRoute !== 'function') {
      throw new Error(`Route method is not supported: ${routeType}`)
    }

    const gradeMiddleware = Number.isInteger(config.grade)
      ? gradeMiddlewares[config.grade]
      : undefined

    if (gradeMiddleware) {
      registerRoute(config.path, gradeMiddleware, routeHandler)
      continue
    }

    registerRoute(config.path, routeHandler)
  }

  return router
}

module.exports = function route(app) {
  console.log('set routes')
  app.use('/', createRouter())
}
