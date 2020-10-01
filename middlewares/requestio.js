const http = require('http')

const authener = require('./authener')
const authorer = require('./authorer')


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

const genNextUrl = (data, req, res) => {

    if (!Array.isArray(data)) {
        return ''
    }

    const limit = +req.getParam('limit', res.u.paging)
    const offset = +req.getParam('offset', 0) + limit
    const query = { ...req.query }

    if (data.length < limit) {
        return ''
    }
    
    query.offset = offset

    return `${req.originalUrl.split('?')[0]}?${Object.keys(query).map(k => `${k}=${query[k]}`).join('&')}`
}

const requestio = (req, res, next) => {

    res.u = createUtil(res, res, next)
    req.u = res.u

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

    req.auth = {
        login: async () => {
            if (!await authener.handle.getUser(req)) {
                throw 'require login'
            }
        },
        role: async (role) => {
            const roles = role.split(' ').filter(r => r)
            const user = await authener.handle.getUser(req)

            if (!user) {
                throw 'require login'
            }

            if (!authorer.handle.checkRole(user, roles)) {
                throw {
                    message: '403 Forbidden',
                    require: roles,
                }
            }
        },
    }

    res.success = (data, option) => {
        const response = {}

        if (!option) {
            option = {}
        }

        if (option.meta) {
            response.meta = option.meta
        }

        if (data !== undefined) {
            response.data = data
        }

        if (res.u.paging) {
            response.meta = response.meta || {}
            response.meta.next = genNextUrl(data, req, res)
        }

        res.status(option.code || 200)
        res.json(response)
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

    next()
}


module.exports = requestio