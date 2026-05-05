module.exports = function bindPoolListeners(pool, name = 'default') {
    if (!pool || typeof pool.on !== 'function') {
        return
    }

    pool.on('error', (err) => {
        console.error(`[mysql:${name}]`, err)
    })
}
