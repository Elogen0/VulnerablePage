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

  for (const config of configList) {
    const routeType = String(config.type || '').toLowerCase()
    const routeModule = require(config.file)
    const routeHandler = routeModule[config.method]
    const registerRoute = router[routeType].bind(router)

    // 취약점: 설정 파일 값이 잘못되어도 검증 없이 require와 라우터 등록을 진행한다.
    // 운영 코드에서는 핸들러 존재 여부와 HTTP 메서드 지원 여부를 확인해야 한다.
    // 공격 방식: 배포 설정이나 라우트 설정 파일을 바꿀 수 있는 내부자가 file/method 값을 조작해 의도하지 않은 모듈을 로드한다.
    // 서버 시작 시 검증이 없으면 잘못된 라우트가 조용히 붙거나, 장애를 유발해 서비스 거부 상태를 만들 수 있다.
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
  app.use('/', createRouter())
}
