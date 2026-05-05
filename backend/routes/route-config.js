'use strict'

// 교육용 취약 라우트 설정입니다.
// 실제 앱의 backend/routes/route-config.js와 같은 URL 흐름을 유지하되,
// 이 폴더는 app.js에서 불러오지 않도록 분리되어 있습니다.
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
