'use strict'

const webReq = 'server_announcement_req'
const proxyReq = 'server_announcement_proxy_req'
const proxyRes = 'server_announcement_proxy_res'

module.exports = (client, io, manager) => {
  client.on(webReq, (data = {}) => {
    global.writeLog.info(webReq)
    if (!manager.checkGrade(client, 1)) {
      return
    }

    if (!Array.isArray(data.servers) || data.servers.length === 0 || !data.keyword) {
      manager.notify(client.id, false, 'Invalid announcement request')
      return
    }

    global.writeLog.info(`message: ${data.keyword}`)
    global.writeLog.info(`servers: ${data.servers.join(',')}`)

    data.sender = client.id
    manager.getProxy()?.emit(proxyReq, data)
  })

  client.on(proxyRes, (server, sender, message) => {
    global.writeLog.info(proxyRes)
    global.writeLog.info(`server:${server}, sender:${sender}, message:${message}`)
  })
}
