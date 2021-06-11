const http = require('http')

const ruler = require('../ruler')
const event = require('../event')


const createUtil = (req, res, next) => {
    const util = new event.Event()

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

    const limit = +req.gp('limit', res.u.paging)
    const offset = +req.gp('offset', 0) + limit
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

    req.gp = (key, defaultValue, convert) => {
        const value = [req.body[key], req.query[key], req.params[key], defaultValue].find(v => v !== undefined)

        if (value === undefined) {
            // need throw exception to break api handle
            // express error will catch it
            throw `missing param ${key}`
        }

        return convert ? convert(value) : value
    }

    req.gtp = (key, defaultValue) => {
        const value = req.gp(key, defaultValue)

        if (!value && value !== defaultValue) {
            throw `missing or null param ${key}`
        }

        return value
    }

    req.auth = {
        login: async () => {
            if (!await ruler.get(req)) {
                throw 'require login'
            }
        },
        role: async (role) => {
            const roles = role.split(' ').filter(r => r)
            const user = await ruler.get(req)

            if (!user) {
                throw 'require login'
            }

            if (!ruler.check(user, roles)) {
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

        res.u.emit('success', response)
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