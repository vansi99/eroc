const http = require('http')


const createUtil = (req, res, next) => {
    const util = {}

    util.cookie = (key, value, option={}) => {

        option = {
            maxAge: 31104000000,
            ...option
        }

        res.cookie(key, value, option)
    }

    return util
}


const requestio = (req, res, next) => {

    req.getParam = (key, defaultValue) => {
        const value = [req.body[key], req.query[key], req.params[key], defaultValue].find(v => v !== undefined)

        if (value === undefined) {
            // need throw exception to break api handle
            // express error will catch it
            throw `missing param ${key}`
        }

        return value
    }

    req.getTrueParam = (key, defaultValue) => {
        const value = req.getParam(key, defaultValue)

        if (!value && value !== defaultValue) {
            throw `missing or null param ${key}`
        }

        return value
    }

    res.success = (data, option) => {
        const resopnse = {}

        if (!option) {
            option = {}
        }

        if (option.meta) {
            resopnse.meta = option.meta
        }

        if (data) {
            resopnse.data = data
        }

        res.status(option.code || 200)
        res.json(resopnse)
    }

    res.error = (error, option={}) => {
        res.status(option.code || 400)

        if (typeof error === 'string') {
            error = {
                message: error,
            }
        }

        res.json({
            error: {
                url: req.originalUrl,
                method: req.method,
                ...error,
            }
        })
    }

    res.assert = (cond, message) => {
        if (!cond) {
            throw message
        }
    }

    res.u = createUtil(res, res, next)

    next()
}

module.exports = requestio