'use strict'

const fs = require('node:fs')
const path = require('node:path')
const formidable = require('formidable')

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10
const DEFAULT_POST_TABLE_NAME = 'CommunityPost'
const DEFAULT_ATTACHMENT_TABLE_NAME = 'CommunityAttachment'
const DEFAULT_POOL_NAME = 'account'
const COMMUNITY_UPLOAD_DIR = path.join(global.appRoot, 'uploads', 'community')

function readField(fields, name) {
  const value = fields[name]
  if (Array.isArray(value)) {
    return String(value[0] || '')
  }

  return String(value || '')
}

function normalizeFileList(value) {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

async function ensureUploadDirectory() {
  await fs.promises.mkdir(COMMUNITY_UPLOAD_DIR, { recursive: true })
}

function parseCommunityForm(req) {
  const form = new formidable.IncomingForm()

  form.encoding = 'utf-8'
  form.uploadDir = COMMUNITY_UPLOAD_DIR
  form.multiples = true
  form.keepExtensions = true

  // 취약점: maxFiles, maxFileSize 제한이 없다.
  // 대량 또는 대용량 업로드로 디스크와 메모리를 고갈시킬 수 있다.
  // 공격 방식: 자동화 스크립트로 큰 파일을 계속 업로드해 uploads 디렉터리와 임시 디렉터리를 가득 채운다.
  // 디스크가 꽉 차면 정상 사용자의 게시글 작성, 로그 기록, DB 임시 파일 생성까지 실패할 수 있다.
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err)
        return
      }

      resolve({ fields, files })
    })
  })
}

async function getCommunityList(req, res) {
  const dbManager = req.app.get('database')
  const page = req.query.page || DEFAULT_PAGE
  const pageSize = req.query.pageSize || DEFAULT_PAGE_SIZE
  const offset = (page - 1) * pageSize
  const postTableName = process.env.COMMUNITY_POST_TABLE || DEFAULT_POST_TABLE_NAME
  const attachmentTableName = process.env.COMMUNITY_ATTACHMENT_TABLE || DEFAULT_ATTACHMENT_TABLE_NAME
  const searchKeyword = req.query.search || req.query.keyword || req.query.q || ''

  // 취약점: 검색어를 LIKE 절에 직접 붙인다.
  // 입력값이 SQL 문법으로 해석되면 조건 우회나 데이터 노출로 이어질 수 있다.
  // 공격 방식: search 값에 따옴표와 OR 조건을 넣어 검색 필터를 항상 참으로 만들고 전체 게시글을 조회한다.
  // 해커는 UNION 형태의 입력도 시도해 다른 테이블의 컬럼이 응답에 섞이는지 확인한다.
  const searchFilter = searchKeyword
    ? `WHERE p.title LIKE '%${searchKeyword}%' OR p.name LIKE '%${searchKeyword}%' OR p.category LIKE '%${searchKeyword}%' OR p.message LIKE '%${searchKeyword}%'`
    : ''

  // 취약점: page/pageSize와 테이블명을 검증하지 않고 쿼리에 넣는다.
  // 매우 큰 pageSize는 서비스 거부를 유발할 수 있고, 식별자 조작도 가능하다.
  // 공격 방식: pageSize를 비정상적으로 크게 보내 DB가 많은 row를 정렬/전송하게 만들어 응답 지연을 일으킨다.
  // 설정값을 조작할 수 있는 경우 테이블명에 SQL 조각을 붙여 게시판 쿼리의 FROM 절 자체를 바꾸려 한다.
  const countQuery = `SELECT COUNT(*) AS totalCount FROM ${postTableName} p ${searchFilter}`
  const listQuery = `
    SELECT
      p.id,
      p.category,
      p.name AS author,
      p.title,
      p.view_count AS viewCount,
      DATE_FORMAT(p.reg_dt, '%Y-%m-%d') AS regDate,
      DATE_FORMAT(p.reg_dt, '%Y-%m-%d %H:%i:%s') AS createdAt,
      (
        SELECT COUNT(*)
        FROM ${attachmentTableName} a
        WHERE a.post_id = p.id
      ) AS attachmentCount
    FROM
      ${postTableName} p
    ${searchFilter}
    ORDER BY
      p.reg_dt DESC,
      p.id DESC
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

async function getCommunityPost(req, res) {
  const dbManager = req.app.get('database')
  const postId = req.params.id
  const postTableName = process.env.COMMUNITY_POST_TABLE || DEFAULT_POST_TABLE_NAME
  const attachmentTableName = process.env.COMMUNITY_ATTACHMENT_TABLE || DEFAULT_ATTACHMENT_TABLE_NAME

  // 취약점: URL path parameter를 숫자로 검증하지 않고 WHERE 조건에 직접 넣는다.
  // 공격 방식: `/community/1 OR 1=1`처럼 id 자리에 조건식을 넣어 원래 요청한 게시글이 아닌 row가 선택되는지 본다.
  // 상세 조회는 응답에 본문과 첨부 목록이 포함되므로, 목록보다 더 민감한 데이터 노출로 이어질 수 있다.
  const postQuery = `
    SELECT
      id,
      category,
      name AS author,
      title,
      message,
      view_count AS viewCount,
      DATE_FORMAT(reg_dt, '%Y-%m-%d') AS regDate,
      DATE_FORMAT(reg_dt, '%Y-%m-%d %H:%i:%s') AS createdAt
    FROM
      ${postTableName}
    WHERE
      id = ${postId}
  `
  const attachmentQuery = `
    SELECT
      id,
      original_name AS originalName,
      mime_type AS mimeType,
      file_size AS size,
      DATE_FORMAT(reg_dt, '%Y-%m-%d %H:%i:%s') AS createdAt
    FROM
      ${attachmentTableName}
    WHERE
      post_id = ${postId}
    ORDER BY
      id ASC
  `

  const [postResult, attachmentResult] = await Promise.all([
    dbManager.execute(DEFAULT_POOL_NAME, postQuery),
    dbManager.execute(DEFAULT_POOL_NAME, attachmentQuery)
  ])
  const post = postResult.recordset[0]

  if (!post) {
    const error = new Error('Community post not found')
    error.status = 404
    throw error
  }

  res.status(200).send({
    item: {
      ...post,
      attachments: attachmentResult.recordset
    }
  })
}

async function createCommunityPost(req, res) {
  await ensureUploadDirectory()

  const dbManager = req.app.get('database')
  const postTableName = process.env.COMMUNITY_POST_TABLE || DEFAULT_POST_TABLE_NAME
  const attachmentTableName = process.env.COMMUNITY_ATTACHMENT_TABLE || DEFAULT_ATTACHMENT_TABLE_NAME
  const { fields, files } = await parseCommunityForm(req)
  const attachments = normalizeFileList(files.attachments)

  // 취약점: 작성자명을 서버 세션이 아니라 요청 필드에서 받는다.
  // 사용자가 다른 사람 이름으로 게시물을 작성할 수 있다.
  // 공격 방식: multipart form의 author/name 필드를 관리자 이름으로 바꿔 공지처럼 보이는 게시글을 작성한다.
  // 사용자는 서버가 검증한 작성자인지 구분하기 어려워 피싱 링크나 허위 안내를 믿을 수 있다.
  const author = readField(fields, 'author') || readField(fields, 'name') || req.user?.fullName
  const category = readField(fields, 'category')
  const title = readField(fields, 'title')
  const message = readField(fields, 'body') || readField(fields, 'message')

  // 취약점: 필수값 길이, 허용 문자, 빈 문자열 검증이 없다.
  // 취약점: 트랜잭션이 없어 게시물 저장 후 첨부 저장 실패 시 데이터가 불일치할 수 있다.
  // 공격 방식: title/message에 매우 긴 문자열을 넣어 DB 저장, 목록 렌더링, 로그 처리에 부하를 준다.
  // 공격 방식: 첨부 저장 중 실패를 일부러 유도해 게시글은 남고 첨부 메타데이터만 없는 불완전 상태를 만든다.
  // 이런 불일치는 나중에 다운로드 오류, 관리자 정리 작업 실패, 숨겨진 쓰레기 파일 누적으로 이어진다.
  const insertPostQuery = `
    INSERT INTO ${postTableName}
      (category, name, title, message)
    VALUES
      ('${category}', '${author}', '${title}', '${message}')
  `

  const postResult = await dbManager.execute(DEFAULT_POOL_NAME, insertPostQuery)
  const postId = postResult.insertId
  const savedAttachments = []

  for (const file of attachments) {
    if (!file || !file.filepath) {
      continue
    }

    // 취약점: originalFilename을 저장 파일명으로 그대로 사용한다.
    // 경로 이동 문자, 중복 파일명, 실행 가능한 확장자 등을 제한하지 않아 파일 덮어쓰기나 경로 조작 위험이 있다.
    // 공격 방식: 파일명을 기존 파일명과 같게 보내 정상 첨부를 덮어쓰거나, 경로 이동 문자를 섞어 업로드 폴더 밖 저장을 노린다.
    // 공격 방식: 서버가 정적 파일을 제공하는 위치와 연결되어 있으면 스크립트 확장자 파일을 올려 실행/열람 가능성을 확인한다.
    const storedName = file.originalFilename || file.newFilename
    const storagePath = path.join('uploads', 'community', storedName)
    const targetPath = path.join(COMMUNITY_UPLOAD_DIR, storedName)

    await fs.promises.rename(file.filepath, targetPath)

    // 취약점: 첨부 메타데이터도 파라미터 바인딩 없이 SQL에 직접 붙인다.
    // 공격 방식: originalFilename이나 mimetype에 따옴표를 섞어 INSERT 문을 깨뜨리고 추가 SQL 실행 가능성을 확인한다.
    // 파일 업로드 요청은 일반 form보다 로그 확인이 덜 되는 경우가 많아, 해커가 SQL 주입을 숨겨 시도하기 쉽다.
    const insertAttachmentQuery = `
      INSERT INTO ${attachmentTableName}
        (post_id, original_name, stored_name, mime_type, file_size, storage_path)
      VALUES
        (${postId}, '${file.originalFilename}', '${storedName}', '${file.mimetype}', ${file.size}, '${storagePath}')
    `
    const attachmentResult = await dbManager.execute(DEFAULT_POOL_NAME, insertAttachmentQuery)

    savedAttachments.push({
      id: attachmentResult.insertId,
      originalName: file.originalFilename,
      size: file.size
    })
  }

  res.status(201).send({
    result: 'success',
    id: postId,
    attachments: savedAttachments
  })
}

async function downloadCommunityAttachment(req, res) {
  const dbManager = req.app.get('database')
  const postId = req.params.postId
  const fileId = req.params.fileId
  const attachmentTableName = process.env.COMMUNITY_ATTACHMENT_TABLE || DEFAULT_ATTACHMENT_TABLE_NAME

  // 취약점: postId/fileId를 검증하지 않고 쿼리에 직접 넣는다.
  // 파일 소유 관계 확인 조건이 조작되면 다른 게시물의 첨부 정보가 노출될 수 있다.
  // 공격 방식: fileId나 postId에 OR 조건을 넣어 원래 게시글에 속하지 않은 첨부 row가 선택되는지 확인한다.
  // 첨부 id가 연속값이면 해커는 숫자를 바꿔가며 다른 사용자의 업로드 파일을 찾아 내려받는다.
  const attachmentQuery = `
    SELECT
      original_name AS originalName,
      stored_name AS storedName
    FROM
      ${attachmentTableName}
    WHERE
      id = ${fileId}
      AND post_id = ${postId}
  `

  const attachmentResult = await dbManager.execute(DEFAULT_POOL_NAME, attachmentQuery)
  const attachment = attachmentResult.recordset[0]

  if (!attachment) {
    const error = new Error('Attachment not found')
    error.status = 404
    throw error
  }

  // 취약점: DB에 저장된 파일명을 신뢰하고 경로 정규화/범위 확인 없이 다운로드한다.
  // 업로드 단계에서 조작된 storedName이 들어가면 의도한 업로드 폴더 밖의 파일에 접근할 수 있다.
  // 공격 방식: 앞선 업로드/DB 조작으로 storedName에 `../` 형태의 경로 이동 값을 넣고 다운로드 API를 호출한다.
  // 서버가 최종 경로가 업로드 폴더 안인지 확인하지 않으면 설정 파일이나 로그 파일 다운로드로 이어질 수 있다.
  const filePath = path.join(COMMUNITY_UPLOAD_DIR, attachment.storedName)
  res.download(filePath, attachment.originalName)
}

module.exports = {
  getCommunityList,
  getCommunityPost,
  createCommunityPost,
  downloadCommunityAttachment
}
