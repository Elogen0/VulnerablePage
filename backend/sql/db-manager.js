'use strict'

const mysql = require('mysql2/promise')

function normalizeConfig(config) {
    return {
        host: config.host || config.server || '127.0.0.1',
        port: Number(config.port || 3306),
        user: config.user,
        password: config.password,
        database: config.database,
        waitForConnections: config.waitForConnections ?? true,
        connectionLimit: config.connectionLimit ?? config.pool?.max ?? 5,
        queueLimit: config.queueLimit ?? 0
    }
}

function formatResult(rows) {
    if (Array.isArray(rows)) {
        return {
            recordset: rows,
            rowsAffected: [rows.length]
        }
    }

    return {
        recordset: [],
        rowsAffected: [rows?.affectedRows ?? 0],
        insertId: rows?.insertId
    }
}

class DBManager {
    constructor() {
        this.pools = new Map()
    }

    setPool(name, config) {
        if (this.pools.has(name)) {
            return this.pools.get(name)
        }

        if (!config) {
            throw new Error(`Pool config does not exist: ${name}`)
        }

        const connectionConfig = normalizeConfig(config)
        const pool = mysql.createPool(connectionConfig)
        const end = pool.end.bind(pool)
        pool.codexConfig = connectionConfig

        pool.end = async (...args) => {
            this.pools.delete(name)
            return end(...args)
        }

        this.pools.set(name, pool)
        return pool
    }

    printConnections() {
        this.pools.forEach((pool, key) => {
            const { database, host, port } = pool.codexConfig
            console.log(`${key} => ${database}(${host}:${port})`)
        })
    }

    getPool(name) {
        const pool = this.pools.get(name)
        if (!pool) {
            throw new Error(`Pool does not exist: ${name}`)
        }

        return pool
    }

    async execute(name, sql, params = []) {
        const pool = this.getPool(name)
        const [rows] = await pool.query(sql, params)
        return formatResult(rows)
    }

    async request(name) {
        const pool = this.getPool(name)
        return {
            query: async (sql, params = []) => this.execute(name, sql, params),
            pool
        }
    }

    async closeAll() {
        await Promise.all(Array.from(this.pools.values()).map((pool) => pool.end()))
    }
}

module.exports = DBManager
