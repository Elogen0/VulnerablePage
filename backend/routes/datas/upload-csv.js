const formidable = require('formidable')
const path = require('node:path')
const fs = require('node:fs')

const folder = path.normalize(__dirname + '../../DataTable')

async function uploadCSV(req, res) {
  const form = new formidable.IncomingForm()
  form.encoding = 'utf-8'
  form.uploadDir = folder
  form.multiples = true
  form.keepExtensions = true

  // 취약점: CSV 확장자, MIME 타입, 파일 크기, 파일 개수를 검증하지 않는다.
  // 취약점: 업로드 폴더가 없으면 요청 중에 생성하거나 실패 원인을 그대로 노출할 수 있다.
  // 공격 방식: CSV가 아닌 실행 파일, 압축 폭탄, 매우 큰 파일을 CSV 업로드 API에 보낸다.
  // 서버가 파일 종류와 크기를 확인하지 않으면 저장 공간 고갈, 관리자 PC 감염, 후속 처리기 오류로 이어진다.
  form.parse(req, (err, fields, files) => {
    if (err) {
      throw err
    }

    for (const key in files) {
      const fileList = Array.isArray(files[key]) ? files[key] : [files[key]]

      for (const file of fileList) {
        // 취약점: originalFilename을 서버 저장 경로에 그대로 사용한다.
        // 경로 이동 문자나 기존 파일명 충돌을 막지 않아 파일 덮어쓰기, 임의 위치 저장 위험이 있다.
        // 공격 방식: 파일명에 `../` 또는 기존 CSV 파일명을 넣어 업로드 폴더 밖 저장이나 기존 데이터 덮어쓰기를 시도한다.
        // 이후 서버의 데이터 로딩 기능이 오염된 CSV를 읽으면 잘못된 게임 데이터나 계정 데이터가 반영될 수 있다.
        const fileName = path.join(folder, file.originalFilename || key)

        // 취약점: 동기 파일 작업을 요청 처리 중 수행한다.
        // 큰 파일이나 느린 디스크 상황에서 이벤트 루프가 막혀 전체 API 응답이 느려질 수 있다.
        // 공격 방식: 여러 사용자가 동시에 큰 파일 업로드를 반복하면 Node.js 이벤트 루프가 막혀 다른 API까지 느려진다.
        // 해커는 짧은 시간에 병렬 요청을 보내 정상 사용자의 요청이 타임아웃되게 만든다.
        fs.renameSync(file.filepath, fileName)
      }
    }

    res.status(200).send({
      data: Object.keys(files),
      message: 'uploaded'
    })
  })
}

module.exports = { uploadCSV }
