class ExpiredTokenError extends Error {
    status = 419
    constructor(message = '유효하지 않은 토큰입니다.') {
        super(message)
        this.name = 'Expired Token'
    }
}

module.exports = ExpiredTokenError