'use strict'

function resolveCommunityDetailApiBaseUrl() {
  if (window.API_BASE_URL) {
    return window.API_BASE_URL
  }

  if (window.location.protocol === 'file:') {
    return 'http://localhost:9001'
  }

  const { origin, hostname, port } = window.location
  if (port === '9000') {
    return `${origin}/api`
  }

  if ((hostname === 'localhost' || hostname === '127.0.0.1') && port !== '9001') {
    return 'http://localhost:9001'
  }

  return `${origin}/api`
}

const COMMUNITY_DETAIL_API_BASE_URL = resolveCommunityDetailApiBaseUrl()

function createCommunityDetailEndpoint(path) {
  return `${COMMUNITY_DETAIL_API_BASE_URL.replace(/\/$/, '')}${path}`
}

function formatDetailDate(value) {
  if (!value) {
    return '-'
  }

  const text = String(value)
  const matchedDate = text.match(/^\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2})?/)
  if (matchedDate) {
    return matchedDate[0]
  }

  const parsedDate = new Date(text)
  if (Number.isNaN(parsedDate.getTime())) {
    return text
  }

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getDate()).padStart(2, '0')
  const hour = String(parsedDate.getHours()).padStart(2, '0')
  const minute = String(parsedDate.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function formatDetailFileSize(size) {
  const numberSize = Number(size)
  if (!Number.isFinite(numberSize)) {
    return '-'
  }

  if (numberSize >= 1024 * 1024) {
    return `${(numberSize / 1024 / 1024).toFixed(1)}MB`
  }

  if (numberSize >= 1024) {
    return `${Math.ceil(numberSize / 1024)}KB`
  }

  return `${numberSize}B`
}

async function readDetailResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() }

  if (!response.ok) {
    throw new Error(data.message || '게시글을 불러오지 못했습니다.')
  }

  return data
}

function setDetailStatus(container, message, type) {
  const status = container.querySelector('[data-community-detail-status]')
  if (!status) {
    return
  }

  status.textContent = message
  status.hidden = !message
  status.classList.toggle('is-error', type === 'error')
}

function createMeta(post) {
  const meta = document.createElement('div')
  meta.className = 'post-meta'

  const category = document.createElement('span')
  category.className = 'board-badge'
  category.textContent = post.category || '자유'

  const author = document.createElement('span')
  author.textContent = post.author || '-'

  const date = document.createElement('span')
  date.textContent = formatDetailDate(post.createdAt || post.regDate || post.reg_dt)

  meta.append(category, author, date)
  return meta
}

function createBody(post) {
  const body = document.createElement('div')
  body.className = 'post-body'
  body.textContent = post.message || ''
  return body
}

function createAttachmentList(postId, attachments) {
  const section = document.createElement('section')
  section.className = 'attachment-section'

  const title = document.createElement('h3')
  title.textContent = '첨부파일'
  section.append(title)

  if (!attachments.length) {
    const empty = document.createElement('p')
    empty.className = 'attachment-empty'
    empty.textContent = '첨부파일이 없습니다.'
    section.append(empty)
    return section
  }

  const list = document.createElement('ul')
  list.className = 'attachment-list'

  attachments.forEach((attachment) => {
    const item = document.createElement('li')
    item.className = 'attachment-item'

    const link = document.createElement('a')
    link.href = createCommunityDetailEndpoint(
      `/community/${encodeURIComponent(postId)}/files/${encodeURIComponent(attachment.id)}`
    )
    link.textContent = attachment.originalName || 'download'

    const size = document.createElement('span')
    size.textContent = formatDetailFileSize(attachment.size)

    item.append(link, size)
    list.append(item)
  })

  section.append(list)
  return section
}

function renderCommunityPost(container, post) {
  const titleElement = document.querySelector('[data-post-title]')
  const summaryElement = document.querySelector('[data-post-summary]')
  const status = container.querySelector('[data-community-detail-status]')

  if (titleElement) {
    titleElement.textContent = post.title || '게시글'
  }

  if (summaryElement) {
    summaryElement.textContent = `${post.author || '-'} · ${formatDetailDate(post.createdAt || post.regDate)}`
  }

  container.innerHTML = ''
  if (status) {
    container.append(status)
  }

  const title = document.createElement('h2')
  title.className = 'post-title'
  title.textContent = post.title || '제목 없음'

  const attachments = Array.isArray(post.attachments) ? post.attachments : []
  container.append(
    title,
    createMeta(post),
    createBody(post),
    createAttachmentList(post.id, attachments)
  )
  setDetailStatus(container, '')
}

async function loadCommunityPost() {
  const container = document.querySelector('[data-community-detail]')
  if (!container) {
    return
  }

  const postId = new URLSearchParams(window.location.search).get('id')
  if (!postId) {
    setDetailStatus(container, '게시글 번호가 없습니다.', 'error')
    return
  }

  try {
    setDetailStatus(container, '게시글을 불러오는 중입니다.')
    const response = await fetch(
      createCommunityDetailEndpoint(`/community/${encodeURIComponent(postId)}`),
      { credentials: 'include' }
    )
    const data = await readDetailResponse(response)
    renderCommunityPost(container, data.item)
  } catch (error) {
    setDetailStatus(container, error.message, 'error')
  }
}

document.addEventListener('DOMContentLoaded', loadCommunityPost)
