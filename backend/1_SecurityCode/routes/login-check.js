//@ts-check
'use strict'

function createHttpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function checkLogin (req) {
  if (req.user === undefined || req.user === null) {
    throw createHttpError(401, 'Login required')
  }
}

function checkGrade (req, grade) {
  if (req.user.grade < grade) {
    throw createHttpError(403, 'Permission denied')
  }
}

function logging (req) {
  global.writeLog.info(`[${req.user.fullName}] ${req.url}`)
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
