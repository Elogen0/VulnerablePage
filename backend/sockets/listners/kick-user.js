//@ts-check
'use strict'

const webReq = 'kick_user_req'
const webRes = 'kick_user_res'
const proxyReq = 'kick_user_proxy_req'
const proxyRes = 'kick_user_proxy_res'

const dbManager = global.dbManager

module.exports = (client, io, manager) => {
  client.on(webReq, async (data) => {
    global.writeLog.info(webReq)
    if (!manager.checkGrade(client, 1)) return
    
    manager.notify(client.id, true, 'Kick 처리 되었습니다.')
    manager.getProxy()?.emit(proxyReq, data)
  })

  client.on(proxyRes, (server, message) => {
    client.broadcast.emit(webRes, server, message)
  })
}