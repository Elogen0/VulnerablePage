'use strict'

const cron = require('node-cron')

function executePerHour() {
  try {
    global.writeLog?.info(`hourly cron tick: ${new Date().toISOString()}`)
  } catch (error) {
    console.log(error.message)
  }
}

module.exports = function startCron() {
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  console.log('start cron')
  const hourCron = cron.schedule('1 * * * *', executePerHour)
  hourCron.start()
}
