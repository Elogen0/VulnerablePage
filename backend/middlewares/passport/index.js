'use strict'

const localLogin = require('./local-login')
const localSignup = require('./local-signup')

const loadPassport = (app, passport) => {
  passport.use('local', localLogin)
  passport.use('local-signup', localSignup)

  app.use(passport.initialize())
  app.use(passport.session())

  passport.serializeUser((user, done) => {
    done(null, user)
  })

  passport.deserializeUser((user, done) => {
    done(null, user)
  })
}

module.exports = loadPassport
