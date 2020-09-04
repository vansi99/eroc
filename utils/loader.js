const eroc = require('..')

const loader = {}


loader.loadPage = (page) => {
    const router = eroc.Router()

    Object.keys(page).forEach((key) => {
        let p = page[key]
        const args = []

        if (typeof p === 'string') {
            p = { template: p }
        }
        
        // add path
        args.push(`/${key.replace(/^\/|\/$/g, '')}`)

        args.push((req, res, next) => {
            // initial context
            res.context = {}
            next()
        })

        // add middleware handles
        if (p.handle) {
            if (typeof p.handle === 'function') {
                args.push(p.handle)
            } else if (Array.isArray(p.handle)) {
                args.push(...p.handle)
            }
        }

        // add render handle
        args.push((req, res, next) => {
            res.render(p.template, res.context || {})
        })

        router.get(...args)
    })

    return router
}


module.exports = loader