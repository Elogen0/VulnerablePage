# VulnerablePage
취약점 공격실습을 위한 프로젝트 입니다.

## SQL 세팅
DB는 MySQL을 사용합니다.  
backend sql에 있는 sql파일들을 sql에서 실행하여 DB테이블들을 모두 만드세요.  
- schema.user.sql
- schema.notice.sql  
- schema.community.sql
- schema.user-play-record.sql
필요하면 insert를 통해 Dummy Data를 넣으세요.  

## Backend 실행
[nodejs](https://nodejs.org/ko/download) 여기서 nodejs를 다운로드받아 설치하세요.  
backend 에서 커맨드 프롬프트를 열고 npm install을 통해 관련 모듈들을 모두 설치하세요.  
모두 설치가 되었으면 npm run dev를 쳐서 develop모드로 서버를 실행합니다.  
끄는건 ctrl+C를 통해 끄면 됩니다.

## Frontend 실행
[nginx 1.30](https://nginx.org/download/nginx-1.30.0.zip)를 다운받고 압축을 푼다음 nginx_on.bat을 실행하면 frontend를 실행합니다.  
테스트를 마쳤다면 ngonx_off.bat을 통해 nginx를 종료하세요.  

웹페이지는  http://localhost:9000번입니다.  
