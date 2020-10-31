const redis = require('redis')
const config = require('eroc/config')


const rediser = {
    client: redis.createClient({
        url: config.rediser_uri,
    }),
}

const client = rediser.client

client.on('connect', () => {
    console.log('rediser: 🐿 connected')
})

rediser.cmd = async (...arg) => {
    return new Promise((resolve, reject) => {
        client[arg[0]](...arg.slice(1), (error, reply) => {
            if (error) {
                return reject(error)
            }

            return resolve(reply)
        })
    })
}

rediser.get = async (key) => {
    return new Promise((resolve, reject) => {
        client.get(key, (error, reply) => {
            if (error) {
                return reject(error)
            }

            return resolve(reply)
        })
    })
}

rediser.set = async (key, value) => {
    return new Promise((resolve, reject) => {
        client.set(key, value, (error, reply) => {
            if (error) {
                return reject(error)
            }

            return resolve(reply)
        })
    })
}

rediser.hset = async (key, name, value) => {
    return new Promise((resolve, reject) => {
        client.hset(key, name, value, (error, reply) => {
            if (error) {
                return reject(error)
            }

            return resolve(reply)
        })
    })
}

rediser.hget = async (key, name) => {
    return new Promise((resolve, reject) => {
        client.hget(key, name, (error, reply) => {
            if (error) {
                return reject(error)
            }

            return resolve(reply)
        })
    })
}


module.exports = rediser