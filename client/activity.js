import logger from './logger'
import bus from './bus'

const activity = {}

activity.setting = {}

activity.push = (aaction, message, data, key='') => {

    if (!aaction) {
        return logger.error('activity: missing aaction')
    }

    if (!message) {
        return logger.error('activity: missing message')
    }

    if (!key) {
        key = window.screen_instance
    }

    bus.post('/activity/v1/activitys', { aaction, message, key, data }).then(() => {
        return logger.debug('activity: log activity success, action: ', aaction)
    }).catch((error) => {
        return logger.error('activity: push activity error:', error)
    })
}

export default activity