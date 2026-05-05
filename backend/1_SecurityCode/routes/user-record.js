'use strict'

const DEFAULT_USER_TABLE_NAME = 'UserAccount'
const DEFAULT_RECORD_TABLE_NAME = 'UserPlayRecord'
const DEFAULT_POOL_NAME = 'account'
const FALLBACK_POOL_NAME = 'design'

function createHttpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function readQueryString(value) {
  if (Array.isArray(value)) {
    return String(value[0] || '').trim()
  }

  return String(value || '').trim()
}

function resolveTableName(envName, defaultName) {
  const tableName = process.env[envName] || defaultName
  if (!/^[A-Za-z0-9_]+$/.test(tableName)) {
    throw createHttpError(500, `${envName} contains unsupported characters`)
  }

  return tableName
}

function resolvePoolName(dbManager) {
  const candidatePoolNames = [
    process.env.USER_RECORD_DB_POOL,
    DEFAULT_POOL_NAME,
    FALLBACK_POOL_NAME
  ].filter(Boolean)

  for (const poolName of candidatePoolNames) {
    if (dbManager.pools?.has(poolName)) {
      return poolName
    }
  }

  throw new Error('User record database pool is not configured')
}

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
  const fullName = readQueryString(req.query.fullName ?? req.query.fullname)

  if (!fullName) {
    throw createHttpError(400, 'fullName query is required')
  }

  const userTableName = resolveTableName('USER_TABLE', DEFAULT_USER_TABLE_NAME)
  const recordTableName = resolveTableName('USER_PLAY_RECORD_TABLE', DEFAULT_RECORD_TABLE_NAME)
  const poolName = resolvePoolName(dbManager)

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
      AND fullName = ?
    ORDER BY
      id ASC
    LIMIT 1
  `
  const userResult = await dbManager.execute(poolName, userQuery, [fullName])
  const user = userResult.recordset[0]

  if (!user) {
    throw createHttpError(404, 'User not found')
  }

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
      user_id = ?
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
      user_id = ?
    ORDER BY
      updated_at DESC,
      id DESC
  `

  const [summaryResult, recordsResult] = await Promise.all([
    dbManager.execute(poolName, summaryQuery, [user.id]),
    dbManager.execute(poolName, recordsQuery, [user.id])
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
