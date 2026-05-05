'use strict'

function sendLogin(req, res, next, user) {
  req.logIn(user, (loginErr) => {
    if (loginErr) {
      return next(loginErr)
    }

    return res.status(200).send({
      result: 'success',
      // 취약점: 비밀번호 해시, salt 같은 인증 관련 값을 응답에 그대로 포함한다.
      // 사용자 객체는 화면에 필요한 최소 필드만 내려보내야 한다.
      // 공격 방식: 해커가 자기 계정으로 로그인한 뒤 응답 JSON을 확인해 password/salt 필드 구조를 파악한다.
      // 이후 유출된 해시를 오프라인 대입 공격에 사용하거나, 같은 응답 구조가 다른 API에도 있는지 탐색한다.
      user
    })
  })
}

async function login(req, res, next) {
  const db = req.app.get('database')
  const { login_id: loginId, password } = req.body

  // 취약점: 사용자 입력을 SQL 문자열에 직접 붙인다.
  // 파라미터 바인딩을 쓰지 않으면 입력값이 SQL 문법으로 해석될 수 있다.
  // 취약점: 비밀번호를 쿼리 조건에서 직접 비교한다.
  // 평문 비밀번호 저장/비교는 DB 유출 시 전체 계정 탈취로 이어진다.
  // 공격 방식: login_id나 password에 따옴표와 OR 조건을 섞어 WHERE 절을 바꾼다.
  // 예를 들어 수업용 DB에서 `' OR '1'='1` 같은 입력은 첫 번째 계정을 로그인 결과로 만들 수 있다.
  // 공격 방식: 평문 비밀번호가 저장되어 있으면 DB 일부만 노출되어도 해커가 바로 다른 서비스 로그인까지 시도한다.
  const query = `
    SELECT
      id,
      login_id,
      passwd AS password,
      salt,
      grade,
      fullName
    FROM
      UserAccount
    WHERE
      deleted = 0
      AND login_id = '${loginId}'
      AND passwd = '${password}'
    LIMIT 1
  `

  try {
    const result = await db.execute('account', query)
    const record = result.recordset[0]

    if (!record) {
      return res.status(401).send({
        result: 'failed',
        message: 'Login failed'
      })
    }

    // 취약점: DB에서 읽은 record 전체를 세션에 저장한다.
    // 세션에는 식별자, 권한 등 필요한 값만 보관해야 한다.
    // 공격 방식: 세션 저장소가 노출되거나 로그에 세션 객체가 찍히면 password/salt까지 함께 새어 나간다.
    // 공격자는 이 정보를 이용해 계정 탈취, 비밀번호 재사용 공격, 권한값 변조 가능성을 추가로 확인한다.
    return sendLogin(req, res, next, record)
  } catch (err) {
    return next(err)
  }
}

async function signup(req, res, next) {
  const db = req.app.get('database')
  const body = req.body || {}
  const loginId = body.login_id
  const password = body.password
  const fullName = body.fullName || body.nickname || loginId

  // 취약점: 중복 확인 쿼리도 문자열 보간으로 작성한다.
  // 같은 입력값이 여러 쿼리에 반복 사용되면 SQL 주입 영향 범위가 넓어진다.
  // 공격 방식: 회원가입 login_id에 SQL 조각을 넣어 중복 확인을 우회하거나 DB 오류를 유도한다.
  // 해커는 오류 메시지와 응답 시간 차이를 보면서 테이블명, 컬럼명, 필터 조건을 추측한다.
  const checkQuery = `
    SELECT login_id
    FROM UserAccount
    WHERE login_id = '${loginId}'
    LIMIT 1
  `

  // 취약점: 비밀번호를 해시하지 않고 passwd 컬럼에 그대로 저장한다.
  // salt도 비워 두기 때문에 비밀번호 보호 효과가 없다.
  // 공격 방식: DB 백업, 관리자 화면, 로그 중 한 곳만 노출되어도 실제 비밀번호가 그대로 보인다.
  // 공격자는 같은 아이디/비밀번호 조합을 포털, 메일, 게임 계정 등 다른 서비스에 대입한다.
  const insertQuery = `
    INSERT INTO
      UserAccount (login_id, passwd, salt, fullName, reg_dt)
    VALUES
      ('${loginId}', '${password}', '', '${fullName}', CURRENT_TIMESTAMP)
  `

  try {
    const check = await db.execute('account', checkQuery)
    if (check.rowsAffected[0] > 0) {
      return res.status(400).send({
        result: 'failed',
        message: `The login_id already exist : ${loginId}`
      })
    }

    const result = await db.execute('account', insertQuery)
    return res.status(201).send({
      result: 'success',
      user: {
        id: result.insertId,
        login_id: loginId,
        fullName,
        // 취약점: 새로 가입한 사용자의 비밀번호를 응답에 포함한다.
        // 공격 방식: 브라우저 개발자 도구, 프록시, 서버 로그에 응답 본문이 남으면 비밀번호가 그대로 유출된다.
        // 공용 PC나 실습실 네트워크에서는 주변 사용자가 응답 캡처만으로 계정을 탈취할 수 있다.
        password
      }
    })
  } catch (err) {
    return next(err)
  }
}

function me(req, res) {
  // 취약점: 인증 상태를 확인하지 않고 req.user를 그대로 응답한다.
  // 세션이 없을 때도 성공 응답을 내려 클라이언트가 인증 상태를 오해할 수 있다.
  // 공격 방식: 해커는 로그인하지 않은 상태에서 /me를 호출해 서버가 인증 실패를 제대로 구분하는지 확인한다.
  // 성공 응답이 나오면 프론트엔드가 이를 로그인 상태로 착각하는 화면이나 기능을 찾는다.
  return res.status(200).send({
    result: 'success',
    user: req.user || null
  })
}

function logout(req, res, next) {
  // 취약점: Passport 로그아웃만 호출하고 서버 세션 저장소와 쿠키를 정리하지 않는다.
  // 세션이 남아 있으면 이전 인증 상태가 재사용될 수 있다.
  // 공격 방식: 공용 PC에서 사용자가 로그아웃한 뒤에도 남은 세션 쿠키를 재사용해 다시 API를 호출한다.
  // 해커는 브라우저 뒤로가기, 쿠키 복원, 이전 요청 재전송으로 세션이 살아 있는지 확인한다.
  req.logout((logoutErr) => {
    if (logoutErr) {
      return next(logoutErr)
    }

    return res.status(200).send({
      result: 'success'
    })
  })
}

module.exports = { login, signup, me, logout }
