'use strict'

class SocketManager {
  constructor() {
    if (!SocketManager.instance) {
      this.users = new Map()
      this.proxy = null
      SocketManager.instance = this
    }

    return SocketManager.instance
  }

  accept(io) {
    global.writeLog.info('socketIO accepting...')

    io.on('connection', (client) => {
      global.writeLog.info(`${client.id} connected`)

      client.emit('hi', client.id, (handShakeData = {}) => {
        this.registerUser(client, handShakeData)
      })

      client.on('disconnect', () => {
        this.deleteUser(client)
      })

      client.on('proxy_response_result', (sender, result, message) => {
        this.notify(sender, result, message)
      })

      this.registerListeners(client, io)
    })
  }

  registerListeners(client, io) {
    require('./listners/announcement')(client, io, this)
  }

  registerUser(client, handShakeData = {}) {
    const user = {
      name: handShakeData.name || 'unknown',
      grade: Number(handShakeData.grade ?? 0),
      client
    }

    global.writeLog.info(`[${user.name}(${user.grade})] register`)
    this.users.set(client.id, user)

    if (user.name === 'proxy') {
      this.proxy = client
    }
  }

  deleteUser(client) {
    global.writeLog.info(`${client.id} disconnected`)
    const user = this.getUser(client.id)
    if (!user) {
      return
    }

    global.writeLog.info(`[${user.name}(${user.grade})] unregistered`)
    if (user.client === this.proxy) {
      this.proxy = null
    }

    this.users.delete(client.id)
  }

  getUser(userId) {
    return this.users.get(userId)
  }

  getProxy() {
    return this.proxy
  }

  notify(senderId, result, message) {
    const user = this.getUser(senderId)
    if (!user) {
      return
    }

    global.writeLog.info(`[${user.name}(${user.grade})] ${result}: ${message}`)
    user.client.emit('notify_result', { result, message })
  }

  checkGrade(client, accessibleGrade) {
    const user = this.getUser(client.id)

    if (!user) {
      this.notify(client.id, false, 'Login is required.')
      return false
    }

    global.writeLog.info(`[${user.name}(${user.grade})] grade check`)
    if (user.grade < accessibleGrade) {
      this.notify(client.id, false, 'Permission denied.')
      return false
    }

    return true
  }
}

const socketManager = new SocketManager()

module.exports = socketManager
