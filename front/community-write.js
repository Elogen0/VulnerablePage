'use strict'

function resolveCommunityWriteApiBaseUrl() {
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

const COMMUNITY_WRITE_API_BASE_URL = resolveCommunityWriteApiBaseUrl()
const MAX_ATTACHMENT_COUNT = 3
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024

function createCommunityWriteEndpoint(path) {
  return `${COMMUNITY_WRITE_API_BASE_URL.replace(/\/$/, '')}${path}`
}

function formatFileSize(size) {
  if (!Number.isFinite(size)) {
    return '-'
  }

  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)}MB`
  }

  if (size >= 1024) {
    return `${Math.ceil(size / 1024)}KB`
  }

  return `${size}B`
}

function setWriteMessage(form, message, type) {
  const messageElement = form.querySelector('[data-form-message]')
  if (!messageElement) {
    return
  }

  messageElement.textContent = message
  messageElement.classList.remove('is-success', 'is-error')

  if (type) {
    messageElement.classList.add(`is-${type}`)
  }
}

function setWriteSubmitting(form, isSubmitting) {
  const submitButton = form.querySelector('button[type="submit"]')
  if (!submitButton) {
    return
  }

  if (!submitButton.dataset.defaultText) {
    submitButton.dataset.defaultText = submitButton.textContent
  }

  submitButton.disabled = isSubmitting
  submitButton.textContent = isSubmitting ? '등록 중...' : submitButton.dataset.defaultText
}

function getSelectedFiles(form) {
  const input = form.querySelector('input[type="file"][name="attachments"]')
  return input ? Array.from(input.files || []) : []
}

function renderSelectedFiles(form) {
  const list = form.querySelector('[data-file-list]')
  if (!list) {
    return
  }

  list.innerHTML = ''
  const files = getSelectedFiles(form)

  files.forEach((file) => {
    const item = document.createElement('li')
    item.className = 'file-item'

    const name = document.createElement('span')
    name.textContent = file.name

    const size = document.createElement('span')
    size.textContent = formatFileSize(file.size)

    item.append(name, size)
    list.append(item)
  })
}

function validateWriteForm(form) {
  const formData = new FormData(form)
  const category = String(formData.get('category') || '').trim()
  const title = String(formData.get('title') || '').trim()
  const body = String(formData.get('body') || '').trim()

  if (!category || !title || !body) {
    return '말머리, 제목, 내용을 입력하세요.'
  }

  return validateSelectedFiles(form)
}

function validateSelectedFiles(form) {
  const files = getSelectedFiles(form)

  if (files.length > MAX_ATTACHMENT_COUNT) {
    return `첨부파일은 최대 ${MAX_ATTACHMENT_COUNT}개까지 등록할 수 있습니다.`
  }

  const oversizedFile = files.find((file) => file.size > MAX_ATTACHMENT_SIZE)
  if (oversizedFile) {
    return `${oversizedFile.name} 파일은 10MB를 초과합니다.`
  }

  return ''
}

async function readResponse(response) {
  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() }

  if (!response.ok) {
    throw new Error(data.message || '게시글 등록에 실패했습니다.')
  }

  return data
}

function bindCommunityWriteForm() {
  const form = document.querySelector('[data-community-write-form]')
  if (!form) {
    return
  }

  const fileInput = form.querySelector('input[type="file"][name="attachments"]')
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      renderSelectedFiles(form)
      const validationMessage = validateSelectedFiles(form)
      setWriteMessage(form, validationMessage, validationMessage ? 'error' : null)
    })
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const validationMessage = validateWriteForm(form)
    if (validationMessage) {
      setWriteMessage(form, validationMessage, 'error')
      return
    }

    try {
      setWriteSubmitting(form, true)
      setWriteMessage(form, '', null)

      const response = await fetch(createCommunityWriteEndpoint('/community'), {
        method: 'POST',
        credentials: 'include',
        body: new FormData(form)
      })
      const data = await readResponse(response)

      setWriteMessage(form, '게시글이 등록되었습니다.', 'success')
      window.setTimeout(() => {
        window.location.href = `./community-detail.html?id=${encodeURIComponent(data.id)}`
      }, 500)
    } catch (error) {
      setWriteMessage(form, error.message, 'error')
    } finally {
      setWriteSubmitting(form, false)
    }
  })
}

document.addEventListener('DOMContentLoaded', bindCommunityWriteForm)
