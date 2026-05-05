const LocalStrategy = require('passport-local').Strategy
const { createCryptoPassword } = require('./crypto')

module.exports = new LocalStrategy(
  {
    usernameField: 'login_id',
    passwordField: 'password',
    passReqToCallback: true
  },
  async (req, login_id, password, done) => {
    try {
      const body = req.body || {}
      const fullName = body.fullName || body.nickname || login_id
      const db = req.app.get('database')
      const check = await db.execute(
        'account',
        'SELECT login_id FROM UserAccount WHERE login_id = ? LIMIT 1',
        [login_id]
      )

      if (check.rowsAffected[0] > 0) {
        return done(null, false, { message: `The login_id already exist : ${login_id}` })
      }

      const encrypted = await createCryptoPassword(password)

      const query = `
        INSERT INTO
          UserAccount (login_id, passwd, salt, fullName, reg_dt)
        VALUES
          (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `

      const result = await db.execute('account', query, [login_id, encrypted.password, encrypted.salt, fullName])
      return done(null, { id: result.insertId, login_id, fullName })
    } catch (err) {
      return done(err)
    }
  }
)
