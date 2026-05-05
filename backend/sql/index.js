const DBManager = require('./db-manager')

function loadConfig(mode) {
    const normalizedMode = (mode || 'development').toLowerCase()
    const fileMap = {
        production: './db-config.production',
        qa: './db-config.qa',
        development: './db-config.development',
        local: './db-config.development'
    }

    const modulePath = fileMap[normalizedMode] || fileMap.development

    try {
        return require(modulePath)
    } catch (error) {
        if (error.code !== 'MODULE_NOT_FOUND' || modulePath === fileMap.development) {
            throw error
        }

        return require(fileMap.development)
    }
}

function createManager(entries) {
    const dbManager = new DBManager()
    for (const [key, config] of entries) {
        dbManager.setPool(key, config)
    }
    return dbManager
}

module.exports = async function startDatabase(app) {
    console.log(`~~~ start Database [mode: ${process.env.NODE_ENV}]~~~`)

    const entries = Object.entries(loadConfig(process.env.NODE_ENV))
    const entriesQA = Object.entries(
        process.env.NODE_ENV === 'development' ? loadConfig('development') : loadConfig('qa')
    )
    const entriesDev = Object.entries(loadConfig('development'))

    const dbManager = createManager(entries)
    global.dbManager = dbManager
    app?.set('database', dbManager)
    console.log('\n--- live DB----')
    dbManager.printConnections()
    console.log('\n---------------')

    const dbManagerQA = createManager(entriesQA)
    global.dbManagerQA = dbManagerQA
    app?.set('database-qa', dbManagerQA)
    console.log('\n--- qa DB----')
    dbManagerQA.printConnections()
    console.log('\n---------------')

    const dbManagerDev = createManager(entriesDev)
    global.dbManagerDev = dbManagerDev
    app?.set('database-dev', dbManagerDev)
    console.log('\n--- dev DB----')
    dbManagerDev.printConnections()
    console.log('\n---------------')
}
