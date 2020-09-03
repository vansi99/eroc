const Queue = require('bull')

const config = require('./config')


const queuer = {
    setting: {
        broker: config.redis_broker_uri,
    },
}

const setting = queuer.setting

queuer.create = (name, option={}) => {
    return new Queue(`${config.service}:${name}`, {
        redis: setting.broker,
        ...option,
    })
}

queuer.createGlobal = (name, option={}) => {
    return new Queue(name, {
        redis: setting.broker,
        ...option,
    })
}


module.exports = queuer
