//@ts-check
'use strict'

const morgan = require('morgan')
const express = require('express')

const format = ()=>{
  const result = process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
  return result
}

// 로그 작성을 위한 Output Stream 옴션
const stream = {
  write: (message) => {
    global.writeLog.info(
      //이상한 특수문자 출력 replace
      message.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "")
    )
  }
}

//로깅 스킵여부
//배포환경일 때
//코드가 400 미만이라면 함수를 리턴해버려서 로그기록을 남기지 않음
//코드가 400 이상이면 로그 기록 함
const skip = (_, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.statusCode < 400
  }
  return false;
}

const loadMorgan = async (app) => {
  console.log('use morgan')
  app.use(morgan(format(), {stream, skip}))
}

module.exports = loadMorgan