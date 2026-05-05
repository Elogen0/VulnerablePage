'use strict'

const API_BASE_URL = window.API_BASE_URL || (
  window.location.protocol === 'http:' || window.location.protocol === 'https:'
    ? `${window.location.origin}/api`
    : 'http://localhost:9001'
)

function createEndpoint(path) {
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`
}

async function postJson(path, payload) {
  return requestJson(path, {
    method: 'POST',
    payload
  })
}

async function getJson(path) {
  return requestJson(path, {
    method: 'GET'
  })
}

async function requestJson(path, options) {
  const requestOptions = {
    method: options.method,
    credentials: 'include'
  }

  if (Object.prototype.hasOwnProperty.call(options, 'payload')) {
    requestOptions.headers = {
      'Content-Type': 'application/json'
    }
    requestOptions.body = JSON.stringify(options.payload)
  }

  const response = await fetch(createEndpoint(path), requestOptions)

  const contentType = response.headers.get('content-type') || ''
  const data = contentType.includes('application/json')
    ? await response.json()
    : { message: await response.text() }

  if (!response.ok) {
    const error = new Error(data.message || '요청 처리에 실패했습니다.')
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

function getUserName(user, fallbackName) {
  return user?.fullName || user?.login_id || fallbackName || '사용자'
}

function setFormMessage(form, message, type) {
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

function setSubmitting(form, isSubmitting, loadingText) {
  const submitButton = form.querySelector('button[type="submit"]')
  if (!submitButton) {
    return
  }

  if (!submitButton.dataset.defaultText) {
    submitButton.dataset.defaultText = submitButton.textContent
  }

  submitButton.disabled = isSubmitting
  submitButton.textContent = isSubmitting ? loadingText : submitButton.dataset.defaultText
}

function renderLoginForm(form) {
  if (!form.dataset.loginFormTemplate) {
    return
  }

  form.innerHTML = form.dataset.loginFormTemplate
}

function renderLoggedInCard(form, user) {
  const account = document.createElement('div')
  account.className = 'login-account'

  const greeting = document.createElement('p')
  greeting.className = 'login-greeting'
  greeting.textContent = `${getUserName(user)}님 안녕하세요.`

  const actions = document.createElement('div')
  actions.className = 'login-account-actions'

  const settingsButton = document.createElement('button')
  settingsButton.className = 'secondary-button'
  settingsButton.type = 'button'
  settingsButton.textContent = '계정설정'

  const logoutButton = document.createElement('button')
  logoutButton.type = 'button'
  logoutButton.textContent = 'Logout'
  logoutButton.addEventListener('click', async () => {
    logoutButton.disabled = true
    logoutButton.textContent = 'Logout...'

    try {
      await requestJson('/logout', {
        method: 'POST'
      })
      renderLoginForm(form)
    } catch (error) {
      logoutButton.disabled = false
      logoutButton.textContent = 'Logout'
      setFormMessage(form, error.message, 'error')
    }
  })

  const message = document.createElement('p')
  message.className = 'form-message'
  message.setAttribute('data-form-message', '')
  message.setAttribute('role', 'status')
  message.setAttribute('aria-live', 'polite')

  actions.append(settingsButton, logoutButton)
  account.append(greeting, actions, message)
  form.innerHTML = ''
  form.append(account)
}

async function syncLoginState(form) {
  try {
    const data = await getJson('/me')
    renderLoggedInCard(form, data.user)
  } catch (error) {
    if (error.status !== 401) {
      setFormMessage(form, error.message, 'error')
    }
  }
}

function bindLoginForm() {
  const form = document.querySelector('.login-form')
  if (!form) {
    return
  }

  form.dataset.loginFormTemplate = form.innerHTML
  syncLoginState(form)

  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const formData = new FormData(form)
    const payload = {
      login_id: String(formData.get('login_id') || '').trim(),
      password: String(formData.get('password') || '')
    }

    if (!payload.login_id || !payload.password) {
      setFormMessage(form, '아이디와 비밀번호를 입력하세요.', 'error')
      return
    }

    try {
      setSubmitting(form, true, 'Login...')
      setFormMessage(form, '', null)

      const data = await postJson('/login', payload)
      renderLoggedInCard(form, data.user || { login_id: payload.login_id })
    } catch (error) {
      setFormMessage(form, error.message, 'error')
    } finally {
      setSubmitting(form, false, 'Login')
    }
  })
}

function bindSignupForm() {
  const form = document.querySelector('.signup-form')
  if (!form) {
    return
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const formData = new FormData(form)
    const password = String(formData.get('password') || '')
    const passwordConfirm = String(formData.get('passwordConfirm') || '')
    const payload = {
      login_id: String(formData.get('login_id') || '').trim(),
      password,
      nickname: String(formData.get('nickname') || '').trim()
    }

    if (!payload.login_id || !payload.password || !payload.nickname) {
      setFormMessage(form, '아이디, 닉네임, 비밀번호를 입력하세요.', 'error')
      return
    }

    if (password !== passwordConfirm) {
      setFormMessage(form, '비밀번호 확인이 일치하지 않습니다.', 'error')
      return
    }

    try {
      setSubmitting(form, true, '가입 중...')
      setFormMessage(form, '', null)

      await postJson('/signup', payload)
      setFormMessage(form, '회원가입이 완료되었습니다.', 'success')
      window.setTimeout(() => {
        window.location.href = './index.html'
      }, 800)
    } catch (error) {
      setFormMessage(form, error.message, 'error')
    } finally {
      setSubmitting(form, false, '가입하기')
    }
  })
}

document.addEventListener('DOMContentLoaded', () => {
  bindLoginForm()
  bindSignupForm()
})
