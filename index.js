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

    router.get('/', async (req, res, next) => {
        const handle = command.context
        
        let context = null

        if (!handle) {
            return res.render(template, { layout: false })
        }

        if (handle.constructor.name === 'AsyncFunction') {
            context = await handle(req, res, next)
        } else {
            context = handle(req, res, next)
        }

        if (!context) {
            return
        }

        return res.render(template, {
            layout: false,
            ...context,
        })
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