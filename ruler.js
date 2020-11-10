const requester = require('./requester')
const jwt = require('./jwt')
const config = require('./config')


const ruler = {}

ruler.get = async (req) => {
    const token = req.headers.token || req.cookies.token

    if (token) {
        return await jwt.verify(token)
    }
}

ruler.gate = (option={}) => {
    const rediser = require('./rediser')

    return (req, res, next) => {

        const handle = async () => {
            const token = req.headers.token || req.cookies.token

            if (!token) {
                if (option.weak) {
                    return next()
                }

                if (option.api) {
                    return res.error({ message: '401 Unauthorized' }, { code: 401 })
                } else {
                    return res.redirect('/login')
                }
            }

            req.u.user = await jwt.verify(token).catch((error) => {
                res.u.cookie('token', '')
                return next(error)
            })

            const tiat = await rediser.hget('user_tiat', req.u.user._id)

            if (req.u.user.iat < tiat) {
                const { data } = await requester.get(`$user:v1/users/token`, { token })
                req.u.user = await jwt.verify(data.token)

                if (req.headers.token) {
                    return res.error({
                        message: 'token_expired',
                        token: data.token,
                    })
                } else {
                    res.u.cookie('token', data.token)
                    req.cookies.token = data.token
                    req.headers.cookie = req.headers.cookie.replace(`token=${token}`, `token=${data.token}`)
                }
            }

            next()
        }

        handle().catch(next)
    }
}

ruler.detect = () => {
    return async (req, res, next) => {

        const handle = async () => {
            const token = req.headers.token || req.cookies.token

            if (token) {
                req.u.user = await jwt.verify(token).catch((error) => {
                    res.u.cookie('token', '')
                    return next(error)
                })
            }
    
            if (req.headers.client && config.clients) {
                req.u.client = config.clients.find(c => c.key === req.headers.client)
            }

            next()
        }

        handle().catch(next)
    }
}

ruler.check = (user, roles) => {
    if (!user || !Array.isArray(user.roles)) {
        return
    }

    return roles.find(r => user.roles.indexOf(r) !== -1)
}

ruler.role = (role, reject) => {
    const roles = role.split(' ').filter(r => r)

    return (req, res, next) => {
        if (!ruler.check(req.u.user, roles)) {
            return res.error({ message: '403 Forbidden', require: roles }, { code: 403 })
        }

        return next()
    }
}


module.exports = ruler