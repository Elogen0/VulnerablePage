function createConfig(prefix = 'DB') {
  return {
    host: process.env[`${prefix}_HOST`] || process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env[`${prefix}_PORT`] || process.env.DB_PORT || 3306),
    user: process.env[`${prefix}_USER`] || process.env.DB_USER || 'userName',
    password: process.env[`${prefix}_PASSWORD`] || process.env.DB_PASSWORD || 'password123',
    database: process.env[`${prefix}_NAME`] || process.env.DB_NAME || 'DATABASE_NAME',
    waitForConnections: true,
    connectionLimit: Number(process.env[`${prefix}_POOL_MAX`] || process.env.DB_POOL_MAX || 5),
    queueLimit: 0
  }
}

module.exports = {
  account: createConfig('DB'),
  design: createConfig('DESIGN_DB')
}
