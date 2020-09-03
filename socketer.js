const config = require('./config')
const requester = require('./requester')

const socketer = {
    setting: {
        client: config.websocket_client,
        hook: config.websocket_emitter_hook,
    }
}

const setting = socketer.setting

socketer.setting = setting


/**
 * Emitter all socket by default
 * @param option { sid, uid, room }
 */
socketer.emit = (event, data, option={}) => {

    const body = {
        event: event,
        client: setting.client,
    }

    if (data !== undefined) {
        body.data = data
    }

    if (option.sid) {
        body.sid = option.sid
    }
    
    if (option.uid) {
        body.uid = option.uid
    }
    
    if (option.room) {
        body.room = option.room
    }

    return requester.post(setting.hook, body)
}

module.exports = socketer
