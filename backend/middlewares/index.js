//@ts-check
'use strict'

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const throttle = require('express-throttle-bandwidth')

const loadMorgan = require('./morgan')
const loadResponseTimeLogger = require('./response-time-logger')
const loadSession = require('./session')
const loadPassport = require('./passport')

const middleware = async (app) => {
  console.log('set Middlewares')
  const bandwidthThrottle = throttle(1024 * 128)

  app.use(cors(
    {
      origin:
      [
        'http://localhost:9000',
        'http://127.0.0.1:9000',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        //any http
      ],
      credentials: true
    }
  ))
  app.use((req, res, next) => {
    const contentType = String(req.headers['content-type'] || '').toLowerCase()
    if (contentType.startsWith('multipart/form-data')) {
      return next()
    }

    return bandwidthThrottle(req, res, next)
  })
  app.use(cookieParser(process.env.SECRET_KEY))
  app.use(express.json({ limit: '1tb'})) // for parsing application/json
  app.use(express.urlencoded({ limit: '1tb', extended: true })) // for parsing application/x-www-form-urlencoded

  loadSession(app)

  loadPassport(app, passport)
  await loadMorgan(app)
  await loadResponseTimeLogger(app)
}

module.exports = middleware
