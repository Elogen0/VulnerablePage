'use strict'

const passport = require('passport')

function login(req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err)
    }

    if (!user) {
      return res.status(401).send({
        result: 'failed',
        message: info?.message || 'Login failed'
      })
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) {
        return next(loginErr)
      }

      return res.status(200).send({
        result: 'success',
        user
      })
    })
  })(req, res, next)
}

function signup(req, res, next) {
  passport.authenticate('local-signup', (err, user, info) => {
    if (err) {
      return next(err)
    }

    if (!user) {
      return res.status(400).send({
        result: 'failed',
        message: info?.message || 'Signup failed'
      })
    }

    return res.status(201).send({
      result: 'success',
      user
    })
  })(req, res, next)
}

function me(req, res) {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).send({
      result: 'failed',
      message: 'Login required'
    })
  }

  return res.status(200).send({
    result: 'success',
    user: req.user
  })
}

function logout(req, res, next) {
  if (!req.isAuthenticated?.()) {
    return res.status(200).send({
      result: 'success'
    })
  }

  req.logout((logoutErr) => {
    if (logoutErr) {
      return next(logoutErr)
    }

    if (!req.session) {
      return res.status(200).send({
        result: 'success'
      })
    }

    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        return next(sessionErr)
      }

      res.clearCookie('connect.sid')
      return res.status(200).send({
        result: 'success'
      })
    })
  })
}

module.exports = { login, signup, me, logout }
