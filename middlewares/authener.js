const jwt = require('../../core/jwt')
const requester = require('../../core/requester')

const RELOAD_TOKEN_TIME_S = 30 * 86400

const authener = {
    force: {
        reloads: new Set(),
        logouts: new Set(),
    }
}

authener.simple = (req, res, next) => {
    const token = req.cookies.token || req.headers.token

    if (token) {
        jwt.verify(token, (error, data) => {
            if (error) {
                return next()
            }

            req.user = data
            next()
        })
    } else {
        next()
    }
}

authener.gateway = (req, res, next) => {

    const token = req.cookies.token || req.headers.token

    if (!token) {
        return res.redirect(`/login?next=${req.originalUrl}`)
    } else {

        jwt.verify(token, (error, data) => {
            let needReload = false

            if (error) {
                return res.redirect(`/login?next=${req.originalUrl}&error=${error.message}`)
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
                requester.get(`$user:v1/users/${data._id}/token`, {
                    token,
                }).then(({ data }) => {

                    if (!data || !data.token) {

                        // logout user
                        res.u.cookie('token', '')

                        return next('error during reload token')
                    }

                    res.u.cookie('token', data.token)

                    jwt.verify(data.token, (error, data) => {
                        if (error) {

                            // logout user
                            res.u.cookie('token', '')

                            return next(error)
                        }

                        req.user = data
                        res.locals.pass.user = data
                        next()
                    })
                }).catch((error) => {
                    
                    // logout user
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
}


module.exports = authener