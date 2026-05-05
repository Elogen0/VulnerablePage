class NotAllowedMethodError extends Error {
    status = 405
    constructor(message = '사용할 수 없는 메소드 입니다.') {
        super(message)
        this.name = 'Not Allowed Method'
    }
}
module.exports = NotAllowedMethodError