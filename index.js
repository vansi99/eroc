const http = require('http')
const path = require('path')
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const exphbs = require('express-handlebars')
const mongoose = require('mongoose')
const expressListEndpoints = require('express-list-endpoints')

const config = require('./config')
const requestio = require('./middlewares/requestio')
const authener = require('./middlewares/authener')


const eroc = {
    mongoose
}

eroc.config = config

eroc.createApplication = (middle) => {
    const app = express()

    const hbs = exphbs.create({
        extname: 'html',
        helpers: {
            stringify: (data) => {
                return JSON.stringify(data)
            }
        }
    })

    // view engine
    app.engine('html', hbs.engine)
    app.set('views', path.join(__dirname, '../../views'))
    app.set('view engine', 'html')

    app.use(requestio)
    app.use(express.json({ limit: '10mb' }))
    app.use(express.urlencoded({ extended: false }))
    app.use(cookieParser())
    app.use(cors())
    app.use(authener.simple)

    if (middle) {
        middle(app)
    }

    // catch 404
    app.use((req, res, next) => {
        return res.error(
            {
                message: '404 Not found',
                service: config.service,
                url: req.originalUrl,
                method: req.method,
                env: config.env,
            },
            {
                code: 404,
            },
        )
    })

    // top level handle exception
    app.use((error, req, res, next) => {
        // handle express error
        // error throw from sync handle and next(err)

        const response = {
            message: error.message || error || 'server error',
            service: config.service,
            url: req.originalUrl,
            method: req.method,
            env: config.env,
            level: 'fatal',
        }

        if (typeof error === 'object') {
            Object.assign(response, error)
        }

        console.error(response)
        console.error(error)

        return res.error(response)
    })

    app.start = () => {
        const server = http.createServer(app)

        server.listen(config.port, () => {
            console.log(`eroc: 🍑 server ${config.service} running at port ${config.port}`)
        })

        return server
    }

    console.log('eroc: 🧬 list apis')
    expressListEndpoints(app).forEach((api) => {
        api.methods.forEach((m) => {
            console.log(`    ${m.padEnd(6)} ${api.path}`)
        })
    })

    return app
}


eroc.Router = (...params) => {
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

eroc.ui = (template, command={}) => {
    const router = eroc.Router()

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


module.exports = eroc