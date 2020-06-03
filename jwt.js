const jsonwebtoken = require('jsonwebtoken')

const config = require('../config')

const jwt = {}


jwt.sign = (data, option={}) => {
    return jsonwebtoken.sign(data, option.secret || config.secret_key, {
        expiresIn: '30d',
    })
}

jwt.verify = (token, option, done) => {
    if (!done) {
        done =  option
        option = {}
    }

    return jsonwebtoken.verify(token, option.secret || config.secret_key, done)
}

module.exports = jwt