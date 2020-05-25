const authorer = {}


authorer.role = (roles, reject) => {

    roles = roles.split(' ')

    return (req, res, next) => {
        const user = req.user

        if (!user || !Array.isArray(user.roles)) {
            if (reject) {
                return reject(req, res, next)
            } else {
                return res.error(
                    {
                        message: '401 Unauthorized',
                    },
                    {
                        code: 401,
                    }
                )
            }
        }

        const accept = roles.find((r) => {
            return user.roles.indexOf(r) !== -1
        })

        if (!accept) {
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

        next()
    }
}


module.exports = authorer