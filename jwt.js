const jsonwebtoken = require('jsonwebtoken')

const config = require('../config')

const jwt = {}


jwt.sign = (data, option={}) => {
    return jsonwebtoken.sign(data, option.secret || config.secret_key, {
        expiresIn: '1000y',
    })
}

jwt.verify = (token, option={}, done) => {

    if (typeof option === 'function') {
        done =  option
        option = {}
    }

    const promise = new Promise((resolve, reject) => {
        jsonwebtoken.verify(token, option.secret || config.secret_key, (error, data) => {
            if (error) {
                reject(error)
            }

            resolve(data)
        })
    })

    if (!done) {
        return promise
    } else {
        promise.then((data) => {
            done(null, data)
        }).catch(done)
    }
}

module.exports = jwt