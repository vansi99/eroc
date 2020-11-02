const rediser = require('eroc/rediser')
const requester = require('eroc/requester')

const jwt = require('./jwt')


const ruler = {}

ruler.gate = () => {
    return (req, res, next) => {
        
        const handle = async () => {
            const token = req.headers.token || req.cookies.token
            req.u.user = await jwt.verify(token)
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
                }
            }

            if (res.locals.pass) {
                res.locals.pass.user = req.u.user
            }

            next()
        }

        handle().catch(next)
    }
}

ruler.checkRole = (user, roles) => {
    if (!user || !Array.isArray(user.roles)) {
        return
    }

    return roles.find(r => user.roles.indexOf(r) !== -1)
}

ruler.role = (role, reject) => {
    const roles = role.split(' ').filter(r => r)

    return (req, res, next) => {
        if (!ruler.checkRole(req.u.user, roles)) {
            return res.error({ message: '403 Forbidden', require: roles }, { code: 403 })
        }

        return next()
    }
}


module.exports = ruler