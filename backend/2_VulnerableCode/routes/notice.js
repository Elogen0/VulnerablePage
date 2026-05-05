'use strict'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10
const DEFAULT_TABLE_NAME = 'Notice'
const DEFAULT_POOL_NAME = 'design'

function resolveTableName() {
  // 취약점: 환경변수 값을 테이블명으로 그대로 사용한다.
  // 식별자도 허용 문자 검증을 거치지 않으면 의도하지 않은 SQL 조각이 붙을 수 있다.
  // 공격 방식: 환경변수나 배포 설정을 만질 수 있는 사람이 테이블명 뒤에 SQL 조각을 붙여 다른 테이블 조회를 시도한다.
  // 외부 입력뿐 아니라 설정값도 신뢰 경계 밖 데이터로 보고 허용 문자 검증을 해야 한다.
  return process.env.NOTICE_TABLE || DEFAULT_TABLE_NAME
}

async function getNoticeList(req, res) {
  const dbManager = req.app.get('database')
  const page = req.query.page || DEFAULT_PAGE
  const pageSize = req.query.pageSize || DEFAULT_PAGE_SIZE
  const offset = (page - 1) * pageSize
  const tableName = resolveTableName()

  // 취약점: page/pageSize를 숫자로 검증하지 않고 LIMIT/OFFSET에 직접 넣는다.
  // 비정상 값이나 매우 큰 값이 들어오면 SQL 오류 또는 DB 부하가 발생할 수 있다.
  // 공격 방식: pageSize에 매우 큰 값을 넣어 한 번에 대량 조회를 시키거나, 숫자가 아닌 SQL 조각을 넣어 오류를 유도한다.
  // 해커는 오류 응답과 처리 시간을 보며 DB 종류, 쿼리 구조, 성능 한계를 추측한다.
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
    LIMIT ${pageSize} OFFSET ${offset}
  `

  const [countResult, listResult] = await Promise.all([
    dbManager.execute(DEFAULT_POOL_NAME, countQuery),
    dbManager.execute(DEFAULT_POOL_NAME, listQuery)
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
