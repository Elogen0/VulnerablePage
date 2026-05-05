'use strict'

const express = require('express')
const responseTime = require('response-time')

function logTimeOut(req, res, time) {
  // 3초 이상이면 log 남김
  if (time > 3000) {
    global.writeLog.warn(`response TimeOut! ${req.method}[${req.url}]: ${time}`)
  }
}

const loadResponseTimeLogger = async (app) => {
  console.log('use ResponseTimeLogger')
  app.use(responseTime(logTimeOut))
}

module.exports = loadResponseTimeLogger