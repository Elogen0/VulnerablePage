'use strict'

const fs = require('node:fs')
const path = require('node:path')
const process = require('node:process')
const winston = require('winston')
require('winston-daily-rotate-file')

const { combine, colorize, printf, simple, timestamp } = winston.format
const logDir = path.join(process.cwd(), 'logs')

fs.mkdirSync(logDir, { recursive: true })

const lineFormat = printf(({ timestamp: createdAt, level, message }) => {
  return `{${createdAt}}[${level}] ${message}`
})

const transports = [
  new winston.transports.DailyRotateFile({
    level: 'info',
    datePattern: 'YYYY-MM-DD',
    dirname: logDir,
    filename: '%DATE%.log',
    maxFiles: '365d',
    zippedArchive: true
  }),
  new winston.transports.DailyRotateFile({
    level: 'error',
    datePattern: 'YYYY-MM-DD',
    dirname: logDir,
    filename: '%DATE%.error.log',
    maxFiles: '365d',
    zippedArchive: true
  })
]

if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: combine(colorize(), simple())
    })
  )
}

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS'
    }),
    lineFormat
  ),
  transports,
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      dirname: logDir,
      filename: '%DATE%.exception.log',
      maxFiles: '365d',
      zippedArchive: true
    })
  ]
})

module.exports = logger
