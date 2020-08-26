const authorer = {

    handle: {},
}

const handle = authorer.handle

handle.checkRole = (user, roles) => {
    if (!user || !Array.isArray(user.roles)) {
        return
    }

    return roles.find(r => user.roles.indexOf(r) !== -1)
}

authorer.role = (role, reject) => {

    const roles = role.split(' ').filter(r => r)

    return (req, res, next) => {
        if (!handle.checkRole(req.user, roles)) {
            if (reject) {
                return reject(req, res, next)
            } else {
                return res.error(
                    {
                        message: '403 Forbidden',
                        require: roles,
                    },
                    {
                        code: 403,
                    }
                )
            }
        }

        return next()
    }
}


module.exports = authorer