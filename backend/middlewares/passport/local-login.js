const LocalStrategy = require('passport-local').Strategy
const { getCryptoPassword } = require('./crypto')

module.exports = new LocalStrategy(
  {
    usernameField: 'login_id',
    passwordField: 'password',
    passReqToCallback: true
  },
  async (req, login_id, password, done) => {
    try {
      const db = req.app.get('database')
      const query = `
      SELECT
        id,
        login_id,
        passwd as password,
        salt,
        grade,
        fullName
      FROM
        UserAccount
      WHERE
        deleted = 0 AND login_id = ?
      LIMIT 1
      `

      const result = await db.execute('account', query, [login_id])
      if (result.rowsAffected[0] < 1) {
        return done(null, false, { message: `?대떦 ?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎.` })
      }

      const record = result.recordset[0]
      const id = record.id
      const dbLoginId = record.login_id
      const dbPassword = record.password
      const salt = record.salt
      const grade = record.grade
      const fullName = record.fullName

      if (grade === 0) {
        return done(null, false, { message: '媛???뱀씤???붿슂?⑸땲?덈떎' })
      }

      const cryptedPassword = await getCryptoPassword(password, salt)
      if (cryptedPassword !== dbPassword) {
        return done(null, false, { message: '鍮꾨?踰덊샇媛 ?쇱튂?섏? ?딆뒿?덈떎' })
      }

      global.writeLog.info(`login success : ${dbLoginId}`)
      const user = { id, login_id: dbLoginId, grade, fullName }
      return done(null, user)
    } catch (err) {
      return done(err)
    }
  }
)
