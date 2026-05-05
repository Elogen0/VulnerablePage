//@ts-check
'use strict'

function checkLogin(req) {
  // 취약점: req.user뿐 아니라 body/query의 userId만 있어도 로그인한 것으로 처리한다.
  // 클라이언트가 임의로 userId를 보내면 인증 없이 보호 라우트에 접근할 수 있다.
  // 공격 방식: 로그인하지 않고도 `?userId=1` 또는 JSON body의 `{ "userId": 1 }`을 붙여 보호 API를 호출한다.
  // 서버가 세션 대신 이 값을 믿으면 해커는 임의 사용자인 척 게시글 작성, 조회, 수정 기능을 탐색한다.
  if (!req.user && !req.body?.userId && !req.query?.userId) {
    const error = new Error('Login required')
    error.status = 401
    throw error
  }
}

function getClientControlledGrade(req) {
  // 취약점: 권한 등급을 서버 세션이 아니라 클라이언트 입력에서 먼저 읽는다.
  // 공격자는 요청 본문이나 쿼리스트링의 grade 값을 바꿔 권한 검사를 우회할 수 있다.
  // 공격 방식: 일반 사용자가 `?grade=5`를 붙이거나 body에 `{ "grade": 5 }`를 넣어 관리자 등급처럼 요청한다.
  // 권한값은 서버가 가진 세션/DB 기준으로 판단해야 하는데, 이 코드는 해커가 보낸 숫자를 그대로 신뢰한다.
  return Number(req.body?.grade ?? req.query?.grade ?? req.user?.grade ?? 0)
}

function checkGrade(req, grade) {
  const clientGrade = getClientControlledGrade(req)

  if (clientGrade < grade) {
    const error = new Error('Permission denied')
    error.status = 403
    throw error
  }
}

function logging(req) {
  // 취약점: req.url을 그대로 로그에 남긴다.
  // 제어문자나 긴 문자열이 섞이면 로그 위조, 로그 오염, 저장 공간 낭비로 이어질 수 있다.
  // 공격 방식: URL에 줄바꿈, 가짜 로그 문구, 매우 긴 문자열을 넣어 정상 관리자 활동처럼 보이는 로그를 만든다.
  // 사고 조사 시 해커가 만든 가짜 로그 때문에 실제 공격 요청을 찾기 어려워진다.
  global.writeLog.info(`[${req.user?.fullName || req.body?.userId || 'anonymous'}] ${req.url}`)
}

exports.isLoggedIn = (req, res, next) => {
  checkLogin(req)
  next()
}

exports.checkGrade0 = (req, res, next) => {
  checkLogin(req)
  checkGrade(req, 0)
  logging(req)
  next()
}

exports.checkGrade1 = (req, res, next) => {
  checkLogin(req)
  checkGrade(req, 1)
  logging(req)
  next()
}

exports.checkGrade2 = (req, res, next) => {
  checkLogin(req)
  checkGrade(req, 2)
  logging(req)
  next()
}

exports.checkGrade3 = (req, res, next) => {
  checkLogin(req)
  checkGrade(req, 3)
  logging(req)
  next()
}

exports.checkGrade4 = (req, res, next) => {
  checkLogin(req)
  checkGrade(req, 4)
  logging(req)
  next()
}

exports.checkGrade5 = (req, res, next) => {
  checkLogin(req)
  checkGrade(req, 5)
  logging(req)
  next()
}
