'use strict'
const dotenv = require('dotenv')

dotenv.config();
const environment = (process.env.NODE_ENV || 'development').trim().toLowerCase()
const normalizedEnvironment = environment === 'prouction' ? 'production' : environment
const allowedEnvironments = new Set(['development', 'qa', 'production', 'local'])

process.env.NODE_ENV = allowedEnvironments.has(normalizedEnvironment)
  ? normalizedEnvironment
  : 'development'
