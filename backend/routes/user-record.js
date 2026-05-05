'use strict'

const DEFAULT_USER_TABLE_NAME = 'UserAccount'
const DEFAULT_RECORD_TABLE_NAME = 'UserPlayRecord'
const DEFAULT_POOL_NAME = 'account'

function toNumber(value) {
  return Number(value || 0)
}

function normalizeSummary(row) {
  const matches = toNumber(row?.matches)
  const wins = toNumber(row?.wins)
  const losses = toNumber(row?.losses)
  const draws = toNumber(row?.draws)
  const kills = toNumber(row?.kills)
  const deaths = toNumber(row?.deaths)
  const assists = toNumber(row?.assists)
  const score = toNumber(row?.score)

  return {
    matches,
    wins,
    losses,
    draws,
    kills,
    deaths,
    assists,
    score,
    winRate: matches > 0 ? Number(((wins / matches) * 100).toFixed(1)) : 0
  }
}

async function searchUserRecord(req, res) {
  const dbManager = req.app.get('database')
  const fullName = req.query.fullName || req.query.fullname || ''
  const userTableName = process.env.USER_TABLE || DEFAULT_USER_TABLE_NAME
  const recordTableName = process.env.USER_PLAY_RECORD_TABLE || DEFAULT_RECORD_TABLE_NAME

  // 취약점: fullName을 파라미터 바인딩하지 않고 SQL에 직접 붙인다.
  // 검색 조건이 공격자의 입력에 의해 바뀌면 다른 사용자의 전적을 조회할 수 있다.
  // 취약점: 테이블명 환경변수도 검증하지 않아 SQL 식별자 조작 위험이 있다.
  // 공격 방식: fullName에 OR 조건을 넣어 특정 이름이 아니어도 첫 번째 사용자가 선택되게 만든다.
  // 그 다음 응답으로 돌아온 user.id를 통해 다른 사용자의 전적, 등급, 가입일 같은 정보를 수집한다.
  // 공격 방식: 설정값을 조작할 수 있는 상황이면 USER_TABLE을 다른 테이블명처럼 바꿔 의도하지 않은 데이터를 조회한다.
  const userQuery = `
    SELECT
      id,
      login_id AS loginId,
      fullName,
      grade,
      DATE_FORMAT(reg_dt, '%Y-%m-%d') AS regDate,
      DATE_FORMAT(reg_dt, '%Y-%m-%d %H:%i:%s') AS createdAt
    FROM
      ${userTableName}
    WHERE
      deleted = 0
      AND fullName = '${fullName}'
    ORDER BY
      id ASC
    LIMIT 1
  `

  const userResult = await dbManager.execute(DEFAULT_POOL_NAME, userQuery)
  const user = userResult.recordset[0]

  if (!user) {
    const error = new Error('User not found')
    error.status = 404
    throw error
  }

  // 취약점: 앞선 쿼리에서 나온 user.id를 검증 없이 다시 문자열에 붙인다.
  // 주입된 결과가 다음 쿼리까지 전파될 수 있다.
  // 공격 방식: 첫 번째 SQL 주입으로 조작된 id나 예상 밖 row를 얻은 뒤, 두 번째/세 번째 쿼리에서 더 넓은 정보를 가져온다.
  // 이렇게 한 번의 취약 입력이 여러 DB 조회로 이어지는 흐름을 2차 SQL 주입 또는 오염된 데이터 전파로 설명할 수 있다.
  const summaryQuery = `
    SELECT
      COALESCE(SUM(matches), 0) AS matches,
      COALESCE(SUM(wins), 0) AS wins,
      COALESCE(SUM(losses), 0) AS losses,
      COALESCE(SUM(draws), 0) AS draws,
      COALESCE(SUM(kills), 0) AS kills,
      COALESCE(SUM(deaths), 0) AS deaths,
      COALESCE(SUM(assists), 0) AS assists,
      COALESCE(SUM(score), 0) AS score
    FROM
      ${recordTableName}
    WHERE
      user_id = ${user.id}
  `
  const recordsQuery = `
    SELECT
      id,
      season,
      mode,
      matches,
      wins,
      losses,
      draws,
      kills,
      deaths,
      assists,
      score,
      DATE_FORMAT(updated_at, '%Y-%m-%d %H:%i:%s') AS updatedAt
    FROM
      ${recordTableName}
    WHERE
      user_id = ${user.id}
    ORDER BY
      updated_at DESC,
      id DESC
  `

  const [summaryResult, recordsResult] = await Promise.all([
    dbManager.execute(DEFAULT_POOL_NAME, summaryQuery),
    dbManager.execute(DEFAULT_POOL_NAME, recordsQuery)
  ])

  res.status(200).send({
    result: 'success',
    user,
    summary: normalizeSummary(summaryResult.recordset[0]),
    records: recordsResult.recordset.map((record) => ({
      ...record,
      matches: toNumber(record.matches),
      wins: toNumber(record.wins),
      losses: toNumber(record.losses),
      draws: toNumber(record.draws),
      kills: toNumber(record.kills),
      deaths: toNumber(record.deaths),
      assists: toNumber(record.assists),
      score: toNumber(record.score)
    }))
  })
}

module.exports = { searchUserRecord }
