import logger from './logger'
import config from './config'
import prog from './prog'
import store from './store'
import activity from './activity'

const bus = {}

const setting = {
    /**
     * show progress when make requset, message will auto gen from action_name
     * this setting can change in each page
     */
    prog: true,
    
    apiBase: '',
    prefix: '',
    uiURL: '',
    
    // default headers
    header: {
        'Content-Type': 'application/json',
    },
}

bus.setting = setting

const startFetch = (endpoint, action, payload, option) => {

    if (setting.prog) {
        prog.push(option.progMessage || action.toLowerCase().replace(/\_/g, ' '))
    }

    if (option.btn) {
        let btns = []

        if (typeof option.btn === 'string') {
            btns = document.querySelectorAll(option.btn).toArray()
        } else {
            btns = [option.btn]
        }

        btns.forEach(btn => {
            btn.addClass('btn-loading')
        })
    }
}

const successFetch = (endpoint, action, payload, option) => {
    if (option.activity) {
        activity.push(
            action,
            option.activity,
            {
                ...store.layer,
                ...payload,
            },
        )
    }
}

const finalFetch = (endpoint, action, payload, option) => {

    if (setting.prog) {
        prog.remove(option.progMessage || action.toLowerCase().replace(/\_/g, ' '))
    }

    if (option.btn) {
        let btns = []

        if (typeof option.btn === 'string') {
            btns = document.querySelectorAll(option.btn).toArray()
        } else {
            btns = [option.btn]
        }

        btns.forEach(btn => {
            btn.removeClass('btn-loading')
        })
    }
}

bus.ale = (error) => {
    logger.error(error)

    if (swal) {
        return swal('', error.message || 'unknow error', 'error')
    }
}

bus.fetch = ({ url, method, body, param, option }) => {
    option = option || {}
    url = url || ''
    
    const arg = {
        method,
        headers: {
            ...setting.header,
            ...option.header,
        }
    }

    // add store.layer if has
    if (Object.keys(store.layer).length !== 0) {
        if (['get', 'head'].indexOf(method.toLowerCase()) !== -1) {
            param = {
                ...store.layer,
                ...(param || {}),
            }
        } else {
            body = {
                ...store.layer,
                ...(body || {}),
            }
        }
    }

    if (body) {
        arg.body = JSON.stringify(body)
    }

    // add api base
    if (url.indexOf('http') !== 0) {
        const upaths = ['', setting.apiBase ]

        if (url[0] !== '/') {
            upaths.push(setting.prefix)
        }

        upaths.push(url)

        url = upaths.join('/').replace(/\/\//g, '/')
    }

    if (param) {
        url += (url.indexOf('?') !== 0? '?' : '&') + Object.keys(param).map(k => `${k}=${param[k]}`).join('&')
    }

    logger.info(`bus.fetch: ${method} ${url}`, body)

    startFetch(url, 'loading', body || param, option)

    return fetch(url, arg).then(res => res.json()).then(res => {
        if (res.error) {
            return Promise.reject(res.error)
        }

        successFetch(url, 'loading', body || param, option)
        finalFetch(url, 'loading', body || param, option)

        return Promise.resolve(res)
    }).catch(error => {
        finalFetch(url, 'loading', body || param, option)
        throw error
    })
}

bus.get = (url, param, option) => {

    return bus.fetch({
        method: 'GET',
        url,
        param,
        option,
    })
}

bus.post = (url, body, option) => {

    return bus.fetch({
        method: 'POST',
        url,
        body,
        option,
    })
}

bus.put = (url, body, option) => {
    
    return bus.fetch({
        method: 'PUT',
        url,
        body,
        option,
    })
}

bus.patch = (url, body, option) => {
    
    return bus.fetch({
        method: 'PATCH',
        url,
        body,
        option,
    })
}

bus.delete = (url, body, option) => {
    
    return bus.fetch({
        method: 'DELETE',
        url,
        body,
        option,
    })
}

bus.ui = (command, body, option) => {
    
    return bus.fetch({
        method: 'POST',
        url: `${setting.uiURL}?_command=${command}`,
        body,
        option,
    })
}


export default bus