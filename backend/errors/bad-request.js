class BadRequestError extends Error {
    status = 400
    constructor(message = 'Bad request') {
        super(message)
        this.name = 'Bad Request'
    }
}

module.exports = BadRequestError
