const path = require('path')
const dotenv = require('dotenv')


const config = {}
const env = dotenv.config({ path: path.join(__dirname, '../../.env') }).parsed
const envOverride = dotenv.config({ path: path.join(__dirname, '../../.env.override') }).parsed

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

config.mongo_option = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,

    auth: {
        authSource: 'admin',
    },
}

config.clients = [
    {
        key: 'internal.c2hvdml0eQ',
        name: 'internal',
    },
]

module.exports = config