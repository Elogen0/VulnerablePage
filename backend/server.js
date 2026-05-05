'use strict'
const application = require('./app')

async function startServer() {
    await application.ready()
    console.log('server is ready')
    application.httpServer.listen(process.env.SERVER_PORT, ()=> {
        console.log('server listenling port :', process.env.SERVER_PORT)
    })
}

startServer()