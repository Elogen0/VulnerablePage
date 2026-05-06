# VulnerablePage
취약점 공격 실습을 위한 프로젝트입니다.

## SQL 세팅
DB는 MySQL을 사용합니다.
`backend/sql`에 있는 SQL 파일을 실행해서 DB 테이블을 생성하세요.

- `schema.user.sql`
- `schema.notice.sql`
- `schema.community.sql`
- `schema.user-play-record.sql`

필요하면 insert SQL을 실행해서 더미 데이터를 넣으세요.

## Backend 실행
[Node.js](https://nodejs.org/ko/download)를 설치하세요.

```bat
cd backend
npm install
npm run dev
```

개발 서버는 기본적으로 `http://localhost:9001`에서 실행됩니다.
종료하려면 실행 중인 터미널에서 `Ctrl+C`를 누르세요.

## Frontend 실행
프론트엔드는 nginx로 `front/` 정적 파일을 제공합니다.

1. [nginx 1.30](https://nginx.org/download/nginx-1.30.0.zip)을 다운로드하고 압축을 풉니다.
2. 프로젝트 루트의 `nginx.conf` 파일을 nginx 설치 폴더의 `conf/nginx.conf` 위치에 복사해서 기존 파일을 교체합니다.
   - 예: `C:\nginx-1.30.0\conf\nginx.conf`
   - 현재 설정은 `C:/Project/Security/front`를 바라봅니다. 프로젝트 위치가 다르면 복사 전에 `nginx.conf`의 `root` 경로를 실제 `front` 폴더 경로로 수정하세요.
3. nginx 설치 폴더에서 nginx를 실행합니다.
nginx-on.bat 실행
또는
```bat
cd C:\nginx-1.30.0
nginx.exe
```

프론트 페이지 주소는 `http://localhost:9000`입니다.

nginx 종료:
nginx-off.bat 실행 
또는
```bat
cd C:\nginx-1.30.0
nginx.exe -s stop
```
