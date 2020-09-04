const path = require('path')
const dotenv = require('dotenv')


const config = {}
const env = dotenv.config({ path: path.join(__dirname, '../../.env') }).parsed
const envOverride = dotenv.config({ path: path.join(__dirname, '../../.env.override') }).parsed

config.clients = [
    {
        key: 'internal.c2hvdml0eQ',
        name: 'internal',
    },
]

config.client = 'internal.c2hvdml0eQ'

// load env from .env
Object.keys(env || {}).forEach((key) => {
    config[key.toLowerCase()] = env[key]

    if (process.env[key] === undefined) {
        process.env[key] = env[key]
    }
})

// override env from .env.override
Object.keys(envOverride || {}).forEach((key) => {
    process.env[key] = envOverride[key]
})

if (config.mongo_uri) {
    const mongoose = require('mongoose')

    mongoose.set('useFindAndModify', false)
    
    mongoose.connect(config.mongo_uri, {
        useUnifiedTopology: true,
        useNewUrlParser: true,
        useCreateIndex: true,
    
        auth: {
            authSource: 'admin',
        },
    })

    mongoose.connection.on('error', error => console.error('BOOT: mongodb connect error', error))
    mongoose.connection.once('open', () => console.log('BOOT: mongodb connected'))
    
}

console.log(`BOOT: env = ${config.env}`)


module.exports = config