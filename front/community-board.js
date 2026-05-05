'use strict'

const COMMUNITY_PAGE_SIZE = 10

function resolveCommunityApiBaseUrl() {
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

const COMMUNITY_API_BASE_URL = resolveCommunityApiBaseUrl()

function createCommunityEndpoint(path) {
  return `${COMMUNITY_API_BASE_URL.replace(/\/$/, '')}${path}`
}

function createCommunityListPath(searchKeyword) {
  const params = new URLSearchParams({
    page: '1',
    pageSize: String(COMMUNITY_PAGE_SIZE)
  })
  const keyword = String(searchKeyword || '').trim()

  if (keyword) {
    params.set('search', keyword)
  }

  return `/community?${params.toString()}`
}

function formatCommunityDate(value) {
  if (!value) {
    return '-'
  }

  const text = String(value)
  const matchedDate = text.match(/^\d{4}-\d{2}-\d{2}/)
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
  return `${year}-${month}-${day}`
}

function clearCommunityRows(boardElement) {
  boardElement.querySelectorAll('.board-row').forEach((row) => {
    row.remove()
  })
}

function setCommunityStatus(statusElement, message, type) {
  if (!statusElement) {
    return
  }

  statusElement.textContent = message
  statusElement.hidden = !message
  statusElement.classList.toggle('is-error', type === 'error')
}

function createCommunityRow(post) {
  const row = document.createElement('a')
  row.className = 'board-row'
  row.href = `./community-detail.html?id=${encodeURIComponent(post.id)}`
  row.target = '_top'

  const badge = document.createElement('span')
  badge.className = 'board-badge'
  badge.textContent = post.category || '자유'

  const title = document.createElement('strong')
  title.textContent = post.title || '제목 없음'

  const attachmentCount = Number(post.attachmentCount ?? post.attachment_count ?? 0)
  if (attachmentCount > 0) {
    const attachment = document.createElement('em')
    attachment.className = 'attachment-count'
    attachment.textContent = `첨부 ${attachmentCount}`
    title.append(attachment)
  }

  const author = document.createElement('span')
  author.textContent = post.author || post.name || '-'

  const date = document.createElement('span')
  date.textContent = formatCommunityDate(
    post.regDate || post.createdAt || post.reg_dt || post.created_at
  )

  row.append(badge, title, author, date)
  return row
}

async function loadCommunityPosts(boardElement, statusElement, searchKeyword = '') {
  setCommunityStatus(statusElement, '게시글을 불러오는 중입니다.')

  const response = await fetch(
    createCommunityEndpoint(createCommunityListPath(searchKeyword)),
    { credentials: 'include' }
  )

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() }

  if (!response.ok) {
    throw new Error(data.message || '게시글을 불러오지 못했습니다.')
  }

  const posts = Array.isArray(data.items) ? data.items : []
  clearCommunityRows(boardElement)

  if (posts.length === 0) {
    const message = String(searchKeyword || '').trim()
      ? '검색 결과가 없습니다.'
      : '등록된 게시글이 없습니다.'
    setCommunityStatus(statusElement, message)
    return
  }

  const fragment = document.createDocumentFragment()
  posts.forEach((post) => {
    fragment.append(createCommunityRow(post))
  })

  boardElement.append(fragment)
  setCommunityStatus(statusElement, '')
}

document.addEventListener('DOMContentLoaded', () => {
  const boardElement = document.querySelector('[data-community-board]')
  const statusElement = document.querySelector('[data-community-status]')
  const searchParams = new URLSearchParams(window.location.search)
  const initialSearchKeyword = searchParams.get('q') || ''

  if (!boardElement) {
    return
  }

  const reloadCommunityPosts = (searchKeyword = '') => {
    loadCommunityPosts(boardElement, statusElement, searchKeyword).catch((error) => {
      clearCommunityRows(boardElement)
      setCommunityStatus(statusElement, error.message, 'error')
    })
  }

  reloadCommunityPosts(initialSearchKeyword)
})
