import logger from './logger'
import event from './event'
import socket from './socket'

let inited = false

const init = () => {
    if (inited) {
        return
    }
    
    inited = true

    logger.info('init: initial script executed')

    // add custom prototype
    HTMLElement.prototype.addClass = function (className) {
        const regex = new RegExp( `^${className}$|^${className} | ${className}$| ${className}( )`, 'g')
        if (!regex.test(this.className)) {
            this.className = `${this.className} ${className}`.trim()
        }
    }
    
    HTMLElement.prototype.removeClass = function (className) {
        const regex = new RegExp( `^${className}$|^${className} | ${className}$| ${className}( )`, 'g')
        this.className = this.className.replace(regex, '$1').trim()
    }

    HTMLCollection.prototype.toArray = function () {
        return [...this]
    }

    NodeList.prototype.toArray = function () {
        return [...this]
    }

    Number.prototype.separators = function (postfix='') {
        return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + postfix
    }

    // parse search query
    window.query = {}
    location.search.slice(1).split('&').forEach(q => {
        const [ key, value ] = q.split('=')
        if (key === '') {
            return
        }
        window.query[key] = value
    })

    // create default screen identification
    window.screen_name = location.pathname.replace(/[0-9a-f]{24}/g, '').replace(/^\/+|\/+$/g, '').replace(/\/\//g, '/')
    window.screen_instance = location.pathname.replace(/^\/+|\/+$/g, '')

    // login websocket
    event.listen('socket_connected', () => {

        const user = window.pass.user || {}

        socket._io_client.emit(
            'login',
            {
                id: user._id || 'anonymous',
                username: user.username || 'anonymous',
                email: user.email || '',
                avatar: user.avatar || '',
                href: location.href || '',
            },
            data => {
                event.emit('socket_logged_in', data)
                logger.info('init: socket logged in')
            }
        )
    })
}

export default init