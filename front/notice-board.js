'use strict'

const NOTICE_PAGE_SIZE = 10
const NOTICE_API_BASE_URL = window.API_BASE_URL || (
  window.location.protocol === 'http:' || window.location.protocol === 'https:'
    ? `${window.location.origin}/api`
    : 'http://localhost:9001'
)

function createNoticeEndpoint(path) {
  return `${NOTICE_API_BASE_URL.replace(/\/$/, '')}${path}`
}

function formatNoticeDate(value) {
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

function formatNoticeCount(value) {
  const count = Number(value ?? 0)
  return Number.isFinite(count) ? count.toLocaleString('ko-KR') : '-'
}

function clearNoticeRows(boardElement) {
  boardElement.querySelectorAll('.board-row').forEach((row) => {
    row.remove()
  })
}

function setNoticeStatus(statusElement, message, type) {
  if (!statusElement) {
    return
  }

  statusElement.textContent = message
  statusElement.hidden = !message
  statusElement.classList.toggle('is-error', type === 'error')
}

function createNoticeRow(notice) {
  const row = document.createElement('a')
  row.className = 'board-row'
  row.href = '#'
  row.addEventListener('click', (event) => {
    event.preventDefault()
  })

  const badge = document.createElement('span')
  badge.className = 'board-badge'
  badge.textContent = notice.type || notice.category || '공지'

  const title = document.createElement('strong')
  title.textContent = notice.title || '제목 없음'

  const date = document.createElement('span')
  date.textContent = formatNoticeDate(
    notice.regDate || notice.createdAt || notice.reg_dt || notice.created_at
  )

  const viewCount = document.createElement('span')
  viewCount.textContent = formatNoticeCount(
    notice.viewCount ?? notice.view_count ?? notice.views
  )

  row.append(badge, title, date, viewCount)
  return row
}

async function loadNotices(boardElement, statusElement) {
  setNoticeStatus(statusElement, '공지사항을 불러오는 중입니다.')

  const response = await fetch(createNoticeEndpoint(`/notice?page=1&pageSize=${NOTICE_PAGE_SIZE}`), {
    credentials: 'include'
  })

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() }

  if (!response.ok) {
    throw new Error(data.message || '공지사항을 불러오지 못했습니다.')
  }

  const notices = Array.isArray(data.items) ? data.items : []
  clearNoticeRows(boardElement)

  if (notices.length === 0) {
    setNoticeStatus(statusElement, '등록된 공지사항이 없습니다.')
    return
  }

  const fragment = document.createDocumentFragment()
  notices.forEach((notice) => {
    fragment.append(createNoticeRow(notice))
  })

  boardElement.append(fragment)
  setNoticeStatus(statusElement, '')
}

document.addEventListener('DOMContentLoaded', () => {
  const boardElement = document.querySelector('[data-notice-board]')
  const statusElement = document.querySelector('[data-notice-status]')

  if (!boardElement) {
    return
  }

  loadNotices(boardElement, statusElement).catch((error) => {
    clearNoticeRows(boardElement)
    setNoticeStatus(statusElement, error.message, 'error')
  })
})
