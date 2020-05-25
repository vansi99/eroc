const express = require('express')

const core = {}


core.Router = (...params) => {
    const router = express.Router(...params)
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'option', 'use', 'all']

    methods.forEach((m) => {
        // move origin method to private
        router[`_${m}`] = router[m]

        // add new custon method
        router[m] = (...params) => {
            for (let i = 0, l = params.length; i < l; i++) {
                if (typeof params[i] === 'function' && params[i].constructor.name === 'AsyncFunction') {
                    const asyncHanle = params[i]
                    params[i] = (req, res, next) => {
                        return asyncHanle(req, res, next).catch(next)
                    }
                }
            }

            router[`_${m}`](...params)
        }
    })
    
    return router
}

core.ui = (template, command={}) => {
    const router = core.Router()

    router.get('/', (req, res, next) => {
        const context = {
            layout: false,
        }

        command.context && Object.assign(context, command.context(req, res, next))

        res.render(template, context)
    })

    router.post('/', (req, res, next) => {
        const _command = req.query._command
        let handle = command[_command]

        res.assert(_command, 'missing command name')
        res.assert(typeof handle === 'function', `command "${_command}" not found`)

        if (typeof handle === 'function' && handle.constructor.name === 'AsyncFunction') {
            const asyncHanle = handle
            handle = (req, res, next) => {
                return asyncHanle(req, res, next).catch(next)
            }
        }

        handle(req, res, next)
    })

    return router
}


module.exports = core