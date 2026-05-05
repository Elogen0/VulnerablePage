'use strict'

document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.querySelector('[data-community-page-search-form]')
  const searchInput = document.querySelector('[data-community-page-search-input]')
  const boardFrame = document.querySelector('[data-community-board-frame]')

  if (!searchForm || !boardFrame) {
    return
  }

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault()

    const keyword = String(searchInput?.value || '').trim()
    const params = new URLSearchParams()

    if (keyword) {
      params.set('q', keyword)
    }

    const query = params.toString()
    boardFrame.src = `./community-board.html${query ? `?${query}` : ''}`
  })
})
