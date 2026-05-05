//@ts-check
'use strict'

const webReq = 'concurrent_user_req'
const webRes = 'concurrent_user_res'
const proxyReq = 'concurrent_user_proxy_req'
const proxyRes = 'concurrent_user_proxy_res'

const dbManager = global.dbManager

module.exports = (client, io, manager) => {
  client.on(proxyRes, async (server, amount, sender, time) => {
    try {
      if (sender === 'backend_concurrent') {
        const query = 'INSERT INTO tb_concurrent_user VALUES (?, ?, ?)'

        const result = await dbManager.execute('design', query, [server, amount, time])
        if (result.rowsAffected[0] === 0) {
          throw new Error('?붿껌???ㅽ뙣?섏??듬땲??')
        }
      }
    } catch (err) {
      console.log(err.message)
    }
  })
}
