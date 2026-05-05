'use strict'

module.exports = [
  { file: './auth', path: '/login', method: 'login', type: 'post' },
  { file: './auth', path: '/signup', method: 'signup', type: 'post' },
  { file: './auth', path: '/me', method: 'me', type: 'get' },
  { file: './auth', path: '/logout', method: 'logout', type: 'post' },
  { file: './notice', path: '/notice', method: 'getNoticeList', type: 'get' },
  { file: './notice', path: '/announcements', method: 'getNoticeList', type: 'get' },
  { file: './user-record', path: '/users/search', method: 'searchUserRecord', type: 'get' },
  { file: './community', path: '/community', method: 'getCommunityList', type: 'get' },
  { file: './community', path: '/community', method: 'createCommunityPost', type: 'post', grade: 0 },
  {
    file: './community',
    path: '/community/:postId/files/:fileId',
    method: 'downloadCommunityAttachment',
    type: 'get'
  },
  { file: './community', path: '/community/:id', method: 'getCommunityPost', type: 'get' }
]
