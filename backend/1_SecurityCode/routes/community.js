'use strict'

const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const formidable = require('formidable')

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 100
const DEFAULT_POST_TABLE_NAME = 'CommunityPost'
const DEFAULT_ATTACHMENT_TABLE_NAME = 'CommunityAttachment'
const DEFAULT_POOL_NAME = 'account'
const FALLBACK_POOL_NAME = 'design'
const MAX_ATTACHMENT_COUNT = 3
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024
const COMMUNITY_UPLOAD_DIR = path.join(global.appRoot, 'uploads', 'community')

function createHttpError(status, message) {
  const error = new Error(message)
  error.status = status
  return error
}

function readPositiveInteger(value, fieldName, fallbackValue) {
  if (value === undefined) {
    return fallbackValue
  }

  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw createHttpError(400, `${fieldName} must be a positive integer`)
  }

  return parsed
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
    process.env.COMMUNITY_DB_POOL,
    DEFAULT_POOL_NAME,
    FALLBACK_POOL_NAME
  ].filter(Boolean)

  for (const poolName of candidatePoolNames) {
    if (dbManager.pools?.has(poolName)) {
      return poolName
    }
  }

  throw new Error('Community database pool is not configured')
}

function readField(fields, name) {
  const value = fields[name]
  if (Array.isArray(value)) {
    return String(value[0] || '').trim()
  }

  return String(value || '').trim()
}

function normalizeFileList(value) {
  if (!value) {
    return []
  }

  const files = Array.isArray(value) ? value : [value]
  return files.filter((file) => file && file.size > 0 && file.originalFilename)
}

function createStoredFileName(originalName) {
  const extension = path.extname(originalName || '').slice(0, 32)
  return `${Date.now()}-${crypto.randomUUID()}${extension}`
}

async function removeFiles(filePaths) {
  await Promise.all(filePaths.filter(Boolean).map(async (filePath) => {
    try {
      await fs.promises.unlink(filePath)
    } catch (_) {
      // best effort cleanup for rejected uploads
    }
  }))
}

async function ensureUploadDirectory() {
  await fs.promises.mkdir(COMMUNITY_UPLOAD_DIR, { recursive: true })
}

function parseCommunityForm(req) {
  const form = new formidable.IncomingForm({
    encoding: 'utf-8',
    uploadDir: COMMUNITY_UPLOAD_DIR,
    multiples: true,
    keepExtensions: true,
    maxFiles: MAX_ATTACHMENT_COUNT,
    maxFileSize: MAX_ATTACHMENT_SIZE
  })

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(createHttpError(400, err.message || 'File upload failed'))
        return
      }

      resolve({ fields, files })
    })
  })
}

async function getCommunityList(req, res) {
  const dbManager = req.app.get('database')
  const page = readPositiveInteger(req.query.page, 'page', DEFAULT_PAGE)
  const pageSize = Math.min(
    readPositiveInteger(req.query.pageSize, 'pageSize', DEFAULT_PAGE_SIZE),
    MAX_PAGE_SIZE
  )
  const offset = (page - 1) * pageSize
  const postTableName = resolveTableName('COMMUNITY_POST_TABLE', DEFAULT_POST_TABLE_NAME)
  const attachmentTableName = resolveTableName(
    'COMMUNITY_ATTACHMENT_TABLE',
    DEFAULT_ATTACHMENT_TABLE_NAME
  )
  const poolName = resolvePoolName(dbManager)
  const rawSearchKeyword = req.query.search ?? req.query.keyword ?? req.query.q ?? ''
  const searchKeyword = Array.isArray(rawSearchKeyword)
    ? String(rawSearchKeyword[0] || '').trim()
    : String(rawSearchKeyword).trim()
  const searchFilter = searchKeyword
    ? 'WHERE p.title LIKE ? OR p.name LIKE ? OR p.category LIKE ? OR p.message LIKE ?'
    : ''
  const searchParams = searchKeyword
    ? Array(4).fill(`%${searchKeyword}%`)
    : []

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
    LIMIT ? OFFSET ?
  `

  const [countResult, listResult] = await Promise.all([
    dbManager.execute(poolName, countQuery, searchParams),
    dbManager.execute(poolName, listQuery, [...searchParams, pageSize, offset])
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
  const postId = readPositiveInteger(req.params.id, 'id')
  const postTableName = resolveTableName('COMMUNITY_POST_TABLE', DEFAULT_POST_TABLE_NAME)
  const attachmentTableName = resolveTableName(
    'COMMUNITY_ATTACHMENT_TABLE',
    DEFAULT_ATTACHMENT_TABLE_NAME
  )
  const poolName = resolvePoolName(dbManager)

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
      id = ?
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
      post_id = ?
    ORDER BY
      id ASC
  `

  const [postResult, attachmentResult] = await Promise.all([
    dbManager.execute(poolName, postQuery, [postId]),
    dbManager.execute(poolName, attachmentQuery, [postId])
  ])
  const post = postResult.recordset[0]

  if (!post) {
    throw createHttpError(404, 'Community post not found')
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
  const postTableName = resolveTableName('COMMUNITY_POST_TABLE', DEFAULT_POST_TABLE_NAME)
  const attachmentTableName = resolveTableName(
    'COMMUNITY_ATTACHMENT_TABLE',
    DEFAULT_ATTACHMENT_TABLE_NAME
  )
  const poolName = resolvePoolName(dbManager)
  const { fields, files } = await parseCommunityForm(req)
  const attachments = normalizeFileList(files.attachments)
  const cleanupFilePaths = attachments.map((file) => file.filepath)
  let connection

  try {
    if (attachments.length > MAX_ATTACHMENT_COUNT) {
      throw createHttpError(400, `Attachments can include up to ${MAX_ATTACHMENT_COUNT} files`)
    }

    const oversizedFile = attachments.find((file) => file.size > MAX_ATTACHMENT_SIZE)
    if (oversizedFile) {
      throw createHttpError(400, `Each attachment must be ${MAX_ATTACHMENT_SIZE} bytes or smaller`)
    }

    const author = String(req.user?.fullName || '').trim()
    const category = readField(fields, 'category')
    const title = readField(fields, 'title')
    const message = readField(fields, 'body') || readField(fields, 'message')

    if (!author) {
      throw createHttpError(401, 'Login required')
    }

    if (!category || !title || !message) {
      throw createHttpError(400, 'category, title, and body are required')
    }

    const pool = dbManager.getPool(poolName)
    connection = await pool.getConnection()
    await connection.beginTransaction()

    const insertPostQuery = `
      INSERT INTO ${postTableName}
        (category, name, title, message)
      VALUES
        (?, ?, ?, ?)
    `
    const [postResult] = await connection.query(
      insertPostQuery,
      [category, author, title, message]
    )
    const postId = postResult.insertId
    const savedAttachments = []

    for (const file of attachments) {
      const storedName = createStoredFileName(file.originalFilename)
      const storagePath = path.posix.join('uploads', 'community', storedName)
      const targetPath = path.join(COMMUNITY_UPLOAD_DIR, storedName)

      await fs.promises.rename(file.filepath, targetPath)
      cleanupFilePaths.push(targetPath)

      const insertAttachmentQuery = `
        INSERT INTO ${attachmentTableName}
          (post_id, original_name, stored_name, mime_type, file_size, storage_path)
        VALUES
          (?, ?, ?, ?, ?, ?)
      `
      const [attachmentResult] = await connection.query(
        insertAttachmentQuery,
        [
          postId,
          file.originalFilename,
          storedName,
          file.mimetype || 'application/octet-stream',
          file.size,
          storagePath
        ]
      )

      savedAttachments.push({
        id: attachmentResult.insertId,
        originalName: file.originalFilename,
        size: file.size
      })
    }

    await connection.commit()
    cleanupFilePaths.length = 0

    res.status(201).send({
      result: 'success',
      id: postId,
      attachments: savedAttachments
    })
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback()
      } catch (_) {
        // keep the original error
      }
    }

    await removeFiles(cleanupFilePaths)
    throw error
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

async function downloadCommunityAttachment(req, res) {
  const dbManager = req.app.get('database')
  const postId = readPositiveInteger(req.params.postId, 'postId')
  const fileId = readPositiveInteger(req.params.fileId, 'fileId')
  const attachmentTableName = resolveTableName(
    'COMMUNITY_ATTACHMENT_TABLE',
    DEFAULT_ATTACHMENT_TABLE_NAME
  )
  const poolName = resolvePoolName(dbManager)
  const attachmentQuery = `
    SELECT
      original_name AS originalName,
      stored_name AS storedName
    FROM
      ${attachmentTableName}
    WHERE
      id = ?
      AND post_id = ?
  `

  const attachmentResult = await dbManager.execute(poolName, attachmentQuery, [fileId, postId])
  const attachment = attachmentResult.recordset[0]

  if (!attachment) {
    throw createHttpError(404, 'Attachment not found')
  }

  const filePath = path.join(COMMUNITY_UPLOAD_DIR, attachment.storedName)
  if (!fs.existsSync(filePath)) {
    throw createHttpError(404, 'Attachment file not found')
  }

  res.download(filePath, attachment.originalName)
}

module.exports = {
  getCommunityList,
  getCommunityPost,
  createCommunityPost,
  downloadCommunityAttachment
}
