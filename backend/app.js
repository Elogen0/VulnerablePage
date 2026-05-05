'use strict'

require('./env')
const path = require('path')
const process = require('process')
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
require('express-async-errors')

const logger = require('./utils/logger')

const middleware = require('./middlewares')
const route = require('./routes')
const socketManager = require('./sockets')

const startDatabase = require('./sql')
const exl = require('./exl')

const startCron = require('./cron')

class App {
    constructor () {
        if (!App.instance) {
            this.setGlobal()
            this.app = express()
            this.httpServer = createServer(this.app)
            this.io = new Server(
                this.httpServer, 
                {
                    cors: {
                        origin: 'http://localhost:5500',
                        //else cors option
                        methods: ['GET', 'POST']
                    },
                    cookie: {
                        name: 'dsr-cookie',
                        httpOnly: true,
                        sameSite: 'strict',
                        maxAge: 1000 * 60 * 60 * 24
                    }
                },
            )
            App.instance = this;
        }
        return App.instance
    }

    async ready() {
        await startDatabase(this.app)
        await middleware(this.app)
        this.setListener()
        this.errorHandler()
        startCron()
    }

    async close() {

    }

    setGlobal() {
        global.appRoot = path.resolve(__dirname).replace(/\\/g, '/')
        
        global.writeLog = logger
        global.ErrorTypes = require('./errors')
        global.gameData = exl
    }

    //정적 디렉토리 추가
    setStatic() {
        this.app.use('/public', express.static('public'))
    }

    //로컬 변수
    setLocals() {
        // 템플릿 변수
        this.app.use( (req, res, next) => {
            this.app.locals.isLogin = true;
            this.app.locals.req_path = req.path;
            next();
        })
    }

    //이벤트리스너
    setListener () {
        route(this.app)
        socketManager.accept(this.io)
    }

    errorHandler() {
        //404 페이지를 찾을수가 없음
        this.app.use( (req , res, _) => {
            res.status(404).send({
                result: 'failed',
                name: 'Page not found',
                message: 'Page not found'
            })
            console.log('Page not found')
        })

        this.app.all('*', (res, req) => {
            res.send({
                result: 'failed',
                name: 'Page not found',
                message: 'Page not found'
            })
            console.log('page not found')
        })

        this.app.use( (err, req, res, _) => {
            res.status(err.status || 500)
            .send({
                result: err.status || 500,
                name: err.name || 'Internal Server Error',
                message: err.message || '서버 내부에서 오류가 발생했습니다.'
            })
            console.log(err.stack)
            console.log(err.message)
        })

        process.on('unhandledRejection', (reson, promise) => {
            writeLog.warn('unhandledRejection', reson)
        })
    }
}

const application = new App()
Object.freeze(application)

module.exports = application
