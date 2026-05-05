'use strict'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 100
const DEFAULT_TABLE_NAME = 'Notice'
const DEFAULT_POOL_NAME = 'design'
const FALLBACK_POOL_NAME = 'account'

function readPositiveInteger(value, fieldName, fallbackValue) {
  if (value === undefined) {
    return fallbackValue
  }

  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < 1) {
    const error = new Error(`${fieldName} must be a positive integer`)
    error.status = 400
    throw error
  }

  return parsed
}

function resolveTableName() {
  const tableName = process.env.NOTICE_TABLE || DEFAULT_TABLE_NAME
  if (!/^[A-Za-z0-9_]+$/.test(tableName)) {
    const error = new Error('NOTICE_TABLE contains unsupported characters')
    error.status = 500
    throw error
  }

  return tableName
}

function resolvePoolName(dbManager) {
  const candidatePoolNames = [
    process.env.NOTICE_DB_POOL,
    DEFAULT_POOL_NAME,
    FALLBACK_POOL_NAME
  ].filter(Boolean)

  for (const poolName of candidatePoolNames) {
    if (dbManager.pools?.has(poolName)) {
      return poolName
    }
  }

  throw new Error('Notice database pool is not configured')
}

async function getNoticeList(req, res) {
  const dbManager = req.app.get('database')
  const page = readPositiveInteger(req.query.page, 'page', DEFAULT_PAGE)
  const pageSize = Math.min(
    readPositiveInteger(req.query.pageSize, 'pageSize', DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE
  )
  const offset = (page - 1) * pageSize
  const tableName = resolveTableName()
  const poolName = resolvePoolName(dbManager)

  const countQuery = `SELECT COUNT(*) AS totalCount FROM ${tableName}`
  const listQuery = `
    SELECT
      id,
      type,
      name,
      title,
      message,
      view_count AS viewCount,
      DATE_FORMAT(reg_dt, '%Y-%m-%d') AS regDate,
      DATE_FORMAT(reg_dt, '%Y-%m-%d %H:%i:%s') AS createdAt
    FROM
      ${tableName}
    ORDER BY
      reg_dt DESC,
      id DESC
    LIMIT ? OFFSET ?
  `

  const [countResult, listResult] = await Promise.all([
    dbManager.execute(poolName, countQuery),
    dbManager.execute(poolName, listQuery, [pageSize, offset])
  ])

  const totalCount = Number(countResult.recordset[0]?.totalCount ?? 0)
  const totalPages = totalCount === 0 ? 0 : Math.ceil(totalCount / pageSize)

  res.status(200).send({
    page,
    pageSize,
    totalCount,
    totalPages,
    items: listResult.recordset
  })
}

module.exports = { getNoticeList }
