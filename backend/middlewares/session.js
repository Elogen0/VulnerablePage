'use strict'

const express = require('express')
const session = require('express-session')
const fileStore = require('session-file-store')(session)
const process = require('process')

const loadSession = (app) => {
  console.log('use sesssion')
  let config = {
    secret: process.env.SECRET_KEY, //암호화 하는데 쓰일 키
    resave: false, //세션 변경 사항이 없어도 항상 다시 저장할지 여부
    saveUninitialized: false, // 초기화 되지 않은 세션을 스토어(저장소)에 강제로 저장할 지 여부
    cookie: {
      httpOnly: true,
      secure: false, // true 이면 https 환경에서만 쿠키정보를
      maxAge: 1000 * 60 * 60 * 24 // 쿠키 유효시간 1일
    }
  }
  // if (process.env.NODE_ENV === 'production') {
  //   config.store = new fileStore() //세션 저상소로 fileStore 사용
  // }
  app.use(session(config))
}

module.exports = loadSession