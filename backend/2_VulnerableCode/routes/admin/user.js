'use strict'

async function selectUser(req, res) {
  const { id } = req.query
  const dbManager = req.app.get('database')

  // 취약점: 관리자 기능인데 별도 인증/권한 확인이 없다.
  // 취약점: id를 SQL에 직접 붙이므로 조건 조작이 가능하다.
  // 취약점: password 컬럼을 그대로 조회해 응답으로 보낸다.
  // 공격 방식: 로그인하지 않은 사용자가 관리자 API 경로를 직접 호출해 사용자 정보를 조회한다.
  // id에 OR 조건을 넣으면 여러 계정의 account/password가 한 번에 응답될 수 있다.
  // 해커는 얻은 비밀번호를 그대로 로그인하거나 다른 서비스에 재사용해 본다.
  const query = `SELECT account, password FROM Account WHERE id = ${id} LIMIT 5`

  try {
    const result = await dbManager.execute('account', query)
    res.status(200).send({ data: result.recordset })
  } catch (err) {
    throw new Error(err)
  }
}

async function updateUser(req, res) {
  const { passwd, id } = req.body
  const dbManager = req.app.get('database')

  // 취약점: 본인 확인, 현재 비밀번호 확인, 관리자 권한 확인 없이 비밀번호를 바꾼다.
  // 취약점: passwd/id를 파라미터 바인딩하지 않아 SQL 주입이 가능하다.
  // 공격 방식: 다른 사람의 id를 body에 넣어 비밀번호를 공격자가 정한 값으로 바꾼다.
  // id 조건에 OR 조건을 넣으면 여러 계정의 비밀번호가 한 번에 바뀌는 대형 사고로 이어질 수 있다.
  const query = `UPDATE Account SET passwd = '${passwd}' WHERE szAccount = '${id}'`

  try {
    const result = await dbManager.execute('account', query)
    res.status(200).send({ data: result.rowsAffected[0] })
  } catch (err) {
    throw new Error(err)
  }
}

module.exports = { selectUser, updateUser }
