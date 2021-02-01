const { Kafka, logLevel } = require('kafkajs')

const event = require('./event')
const config = require('./config')


const kafker = new event.Event()

const setting = {
    broker_uri: config.kafker_broker_uri || '',
}

kafker.consumer = {}

kafker.logger = (level) => {
    return ({ namespace, level, label, log }) => {
        const { timestamp, logger, message, ...others } = log

        console.log(`kafker: ${message}`)
    }
}

kafker.client = new Kafka({
    clientId: config.service,
    brokers: setting.broker_uri.split(','),
    logLevel: logLevel.WARN,
    logCreator: kafker.logger,

    retry: {
        initialRetryTime: 200,
        retries: 100,
    },
})

console.log(`kafker: 🚕 connecting ${setting.broker_uri}`)

kafker.pub = async (topic, message) => {

    if (!kafker.producer) {
        kafker.producer = kafker.client.producer()
        await kafker.producer.connect()
    }

    await kafker.producer.send({
        topic,
        messages: [{
            value: JSON.stringify(message),
        }],
    })
}

kafker.sub = async (topic, handle, option) => {

    if (typeof option === 'function') {
        const tmp = handle
        handle = option
        option = tmp
    }

    if (kafker.consumer[topic]) {
        return console.error(`kafker: consumer already exists, topic=${topic}`)
    }

    option = Object.assign({
        group: `${config.service}:${topic}`,
        fb: true,
    }, option)

    const consumer = kafker.client.consumer({
        groupId: option.group,

        retry: {
            initialRetryTime: 100,
            retries: 10,

            restartOnFailure: async (error) => {
                console.error(`kafker: all retries failed, topic=${topic}`, error)
                return false
            }
        },
    })

    kafker.consumer[topic] = {
        group: option.group,
        consumer,
    }

    await consumer.connect()

    await consumer.subscribe({
        topic,
        fromBeginning: option.fb,
    })

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            return handle(JSON.parse(message.value.toString()), { topic, partition, message })
        },
    })
}


module.exports = kafker