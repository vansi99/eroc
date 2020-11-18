const { Kafka, logLevel } = require('kafkajs')

const event = require('./event')
const config = require('./config')


const kafker = new event.Event()

const setting = {
    broker_uri: config.kafker_broker_uri || '',
}

kafker.ready = false
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
})

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

    if (kafker.consumer[topic]) {
        return console.error(`kafker: consumer already already exists, topic=${topic}`)
    }

    option = Object.assign({
        group: `${config.service}:${topic}`,
        fromBeginning: true,
    }, option)

    const consumer = kafker.client.consumer({
        groupId: option.group,
    })

    kafker.consumer[topic] = {
        group: option.group,
        consumer,
    }

    await consumer.connect()

    await consumer.subscribe({
        topic,
        fromBeginning: option.fromBeginning,
    })

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            return handle(JSON.parse(message.value.toString()), { topic, partition, message })
        },
    })
}


module.exports = kafker