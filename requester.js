const fetch = require('node-fetch')

const config = require('../config')

const requester = {
    setting: {
        header: {
            'Content-Type': 'application/json',
        },
        apiBase: config.api_base_backend,
        option: {
            timeout: 30000,
        },
    }
}

const setting = requester.setting


requester.fetch = ({ url, method, body, param, option }) => {
    option = option || {}
    
    const arg = {
        // defaut node-fetch option
        // https://www.npmjs.com/package/node-fetch#options
        ...setting.option,

        method,
        headers: {
            ...setting.header,
            ...option.header,
        }
    }

    if (body) {
        arg.body = option.formData? body : JSON.stringify(body)
    }

    if (url.indexOf('http') !== 0) {

        // handle internal service call. Exp: $user:v1/users
        if (url.indexOf('$') === 0) {
            const service = url.split(':')[0].slice(1)
            const endpoint = url.slice(service.length + 2)

            url = `http://${service}:3000/api/${service}/${endpoint}`
        } else {

            // add base api backend
            url = `${setting.apiBase}/${url.replace(/^\/|\/$/g, '')}`
        }

    }

    if (param) {
        url += (url.indexOf('?') !== 0? '?' : '&') + Object.keys(param).map(k => `${k}=${param[k]}`).join('&')
    }

    return fetch(url, arg).then((res) => {
        return res.json()
    }).then(res => {
        if (res.error) {
            return Promise.reject(res.error)
        }

        return Promise.resolve(res)
    })
}

requester.get = (url, param, option) => {
    return requester.fetch({
        method: 'GET',
        url,
        param,
        option,
    })
}

requester.post = (url, body, option) => {

    return requester.fetch({
        method: 'POST',
        url,
        body,
        option,
    })
}

requester.put = (url, body, option) => {
    
    return requester.fetch({
        method: 'PUT',
        url,
        body,
        option,
    })
}

requester.patch = (url, body, option) => {
    
    return requester.fetch({
        method: 'PATCH',
        url,
        body,
        option,
    })
}

requester.delete = (url, body, option) => {
    
    return requester.fetch({
        method: 'DELETE',
        url,
        body,
        option,
    })
}


module.exports = requester