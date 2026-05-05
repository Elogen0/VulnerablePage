const BadRequestError = require('./bad-request')
const ExpiredTokenError = require('./expired-token')
const NotAllowedMethodError = require('./not-allowed-method')

/*
200: 클라이언트 요청 정사수행)
201: 리소스 생성 요청에 대한 정상처리
202: 리소스 생성 요청이 비동기적으로 처리
204: 클라이언트 요청 정상수행(응답에대한 메시지 미포함)
400: 클라이언트 요청이 부적절 ( 부적절이유를 응답 Body에 넣어줘야 함)
401: 클라이언트가 인증되지 않은 상태에서 보호된 리소스를 요청할 때 사용
403: 클라이언트가 인증상태와 무관하게 응답하고 싶지 않은 리소스를 요청(400사용권장)
404: 클라이언트가 요청한 리소스가 존재하지 않음
405: 클라이언트가 불가능한 메소드를 사용
*/

module.exports = { 
    BadRequestError, 
    ExpiredTokenError, 
    NotAllowedMethodError}