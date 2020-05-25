import config from './config'
import logger from './logger'

const command = (actionMixed=':', payload={}, option={}) => {
    let [ endpoint, action ] = actionMixed.split(':')

    if (!action) {
        action = endpoint
        endpoint = null
    }

    if (!endpoint) {
        endpoint = config.endpoint
    }

    if (endpoint.indexOf('http') !== 0) {
        endpoint = `/${endpoint}/`.replace(/\/\//g, '/')
    }

    if (payload.action) {
        return logger.error('command: payload can not contain key "action"')
    }

    const body = {
        action,
        ...payload,
    }

    logger.debug(`command: action=${action}, endpoint=${endpoint}, body=`, body)

    return fetch(`${endpoint}?action=${action}`, {
        method: 'POST',
        body: JSON.stringify(body),
    }).then(res => res.json())
}

export default command
