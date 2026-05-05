'use strict'

async function selectUser(req, res) {
    const { id } = req.query
    const dbManager = req.app.get('database')
    const query = 'SELECT account, password FROM Account WHERE id = ? LIMIT 5'

    try {
        const result = await dbManager.execute('account', query, [id])
        res.status(200).send({ data: result.recordset })
    } catch (err) {
        throw new Error(err)
    }
}

async function updateUser(req, res) {
    const { passwd, id } = req.body
    const dbManager = req.app.get('database')
    const query = 'UPDATE Account SET passwd = ? WHERE szAccount = ?'

    try {
        const result = await dbManager.execute('account', query, [passwd, id])
        res.status(200).send({ data: result.rowsAffected[0] })
    } catch (err) {
        throw new Error(err)
    }
}

module.exports = { selectUser, updateUser }
