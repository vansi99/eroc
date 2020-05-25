const jsonwebtoken = require('jsonwebtoken')

const config = require('../config')

const jwt = {}


jwt.sign = (data) => {
    return jsonwebtoken.sign(data, config.secret_key, {
        expiresIn: '30d',
    })
}

jwt.verify = (token, done) => {
    return jsonwebtoken.verify(token, config.secret_key, done)
}

module.exports = jwt