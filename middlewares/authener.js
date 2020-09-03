const jwt = require('../../core/jwt')
const requester = require('../../core/requester')
const config = require('../../config')

const RELOAD_TOKEN_TIME_S = 30 * 86400

const authener = {
    force: {
        reloads: new Set(),
        logouts: new Set(),
    },

    handle: {}
}

const handle = authener.handle

handle.getUser = async (req) => {
    const token = req.headers.token || req.cookies.token

    if (token) {
        return await jwt.verify(token)
    }
}

authener.simple = (req, res, next) => {
    const token = handle.getUser(req).then((user) => {
        req.u.user = user
        next()
    }).catch((error) => {
        res.u.cookie('token', '')
        return next(error)
    })

    if (req.headers.client && config.clients) {
        req.u.client = config.clients.find(c => c.key === req.headers.client)
    }
}

authener.ui = (req, res, next) => {

    const token = req.headers.token || req.cookies.token

    if (!token) {
        return res.redirect(`/login?next=${req.originalUrl}`)
    }

    jwt.verify(token, (error, data) => {
        let needReload = false

        if (error) {
            if (error.name !== 'TokenExpiredError') {
                return res.redirect(`/login?next=${req.originalUrl}&error=${error.message}`)
            }
            
            needReload = true
            data = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
        }

        if (authener.force.logouts.has(data._id)) {
            authener.force.logouts.delete(data._id)
            res.u.cookie('token', '')
            return res.redirect(`/login?next=${req.originalUrl}`)
        }

        if (authener.force.reloads.has(data._id)) {
            authener.force.reloads.delete(data._id)
            needReload = true
        }

        if (Math.floor(Date.now() / 1000) - RELOAD_TOKEN_TIME_S > data.iat || needReload) {
            requester.get(`$user:v1/users/token`, { token }).then(({ data }) => {

                if (!data || !data.token) {
                    res.u.cookie('token', '')
                    return next('error during reload token')
                }

                res.u.cookie('token', data.token)

                jwt.verify(data.token, (error, data) => {
                    if (error) {
                        res.u.cookie('token', '')
                        return next(error)
                    }

                    req.user = data
                    res.locals.pass.user = data
                    next()
                })
            }).catch((error) => {
                res.u.cookie('token', '')
                next(error)
            })

            return
        }

        req.user = data
        res.locals.pass.user = data
        next()
    })
}


module.exports = authener