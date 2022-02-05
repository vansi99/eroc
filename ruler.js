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

ruler.buidPermisisons = (user) => {
    if (!user?.permission || user.permissions) {
        return
    }

    user.permissions = user.permission.split(';').map((p) => {
        const [ role, scope, permission ] = p.split(':')

        return {
            role,
            scope,
            permissions: permission.split(',')
        }
    })
}



ruler.detect = () => {
    return async (req, res, next) => {

        const handle = async () => {
            const token = req.headers.token || req.cookies.token

            if (token) {
                req.u.user = await jwt.verify(token).catch((error) => {
                    res.cookie('token', '')
                    return next(error)
                })
            }

            next()
        }

        handle().catch((error) => {
            res.cookie('token', '')
            return next('Có lỗi trong quá trình đang nhập, vui lòng thử lại')
        })
    }
}

ruler.checkRole = (user, roles) => {
    if (!user || !Array.isArray(user.roles)) {
        return
    }

    return roles.find(r => user.roles.indexOf(r) !== -1)
}

ruler.checkPermission = (user, role, scope, permissions) => {
    if (!user) {
        return
    }

    ruler.buidPermisisons(user)

    permissions = permissions.filter(p => p)

    return user.permissions.find((p) => {
        if (p.role !== role) {
            return
        }

        if (p.scope !== scope) {
            return
        }

        if (permissions.length) {

            for (const per of permissions) {
                if (p.permissions.includes(per)) {
                    return true
                }
            }

            return
        }

        return true
    })
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

ruler.permission = (role, scope, permissions, reject) => {

    return (req, res, next) => {
        if (!ruler.checkPermission(req.u.user, role, scope, permissions)) {
            return res.error({ message: '403 Forbidden', require: [role, scope, permissions] }, { code: 403 })
        }

        return next()
    }
}


module.exports = ruler