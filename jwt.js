const jsonwebtoken = require('jsonwebtoken')

const config = require('../config')

const jwt = {}


jwt.sign = (data, option={}) => {
    return jsonwebtoken.sign(data, option.secret || config.secret_key, {
        expiresIn: '30d',
    })
}

jwt.verify = (token, option={}, done) => {

    if (typeof option === 'function') {
        done =  option
        option = {}
    }

    return new Promise((resolve, reject) => {
        jsonwebtoken.verify(token, option.secret || config.secret_key, (error, data) => {
            if (error) {
                done && done(error)
                reject(error)
            }

            done && done(null, data)
            resolve(data)
        })
    })
}

module.exports = jwt