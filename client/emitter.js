import logger from './logger' 
import event from './event'
import config from './config'
import storage from './storage'

const emitter = {}
const mounted = {}

emitter.mounted = mounted


/**
 * Emitter generator
 * @param name {string} Emitter name
 * @param handle {function} Call one time for setup emitter
 */
emitter.gen = (name, handle) => {

    if (emitter[name] || !/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(name)) {
        return logger.error(`emitter: name "${name}" existed or invalid`)
    }

    emitter[name] = () => {
        if (mounted[name]) {
            return logger.error(`emitter: duplicate mount emitter ${name}`)
        }

        handle()

        mounted[name] = true
    }
}


// Define emitter


emitter.gen('click', () => {

    function handleClickR(target, domEvent, up=0) {
            
        if (up > 5 || !target) {
            return
        }
        
        const clickEmit = target.getAttribute('click-emit')

        if (!clickEmit) {
            return handleClickR(target.parentElement, domEvent, up + 1)
        }

        const name = clickEmit.split(':')[0]

        let payload = clickEmit.split(':').slice(1).join(':')
        
        // handle object payload
        if (payload[0] === '?') {
            const payloadObject = {}
            payload.slice(1).split('&').forEach(q => {
                const [ key, value ] = q.split('=')
                if (key === '') {
                    return
                }
                payloadObject[key] = value
            })
            payload = payloadObject
        }

        event.next(name, payload, { target, domEvent })
    }

    window.document.body.addEventListener('click', domEvent => {
        handleClickR(domEvent.target, domEvent)
    })

    logger.info('emiter: click emiter mounted')
})

emitter.gen('scroll', () => {

    let lock = false

    const handle = dEvent => {
        if (lock) {
            return
        }

        lock = true

        window.requestAnimationFrame(() => {
            event.next('window_scroll', dEvent)
            lock = false
        })
    }

    window.addEventListener('scroll', handle)

    logger.info('emiter: add event window_scroll')
})

emitter.gen('visit', () => {

    let visitedPages = storage.visitedPages || []
        
    if (visitedPages.indexOf(location.pathname) === -1) {
        event.next('first_time_vist_page', location.pathname)
        
        // add visited page
        visitedPages.push(location.pathname)
        visitedPages = visitedPages.slice(-100)
        storage.visitedPages = visitedPages
    }

    logger.info('emiter: add event first_time_vist_page')
})


export default emitter