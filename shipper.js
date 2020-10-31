const mongodb = require('mongodb')

const config = require('./config')


const shipper = {
    models: [],
    interval: null,

    setting: {
        delay: config.shipper_delay || 3600000,
        mongo_uri: config.shipper_mongo_uri,
    },
}

const setting = shipper.setting


shipper.add = (model) => {
    if (shipper.models.indexOf(model) === -1) {
        shipper.models.push(model)
    }
}

shipper.ship = () => {
    if (shipper.models.length === 0) {
        return
    }

    const threshold = Date.now() - setting.delay

    // connect to warehouse
    mongodb.MongoClient.connect(setting.mongo_uri, { useUnifiedTopology: true }).then((client) => {

        shipper.models.forEach((model) => {
            const collectionName = model.collection.collectionName
            const databaseName = model.db.name

            const db = client.db(databaseName)
            const bulk = db.collection(collectionName).initializeUnorderedBulkOp()

            const query = {
                updatedAt: {
                    $gt: threshold - 1000,
                }
            }
            
            model.find(query).then((docs) => {
                if (docs.length === 0) {
                    return
                }

                docs.forEach(doc => {
                    bulk.find({ _id: doc._id }).upsert().replaceOne(doc)
                })
                
                bulk.execute().then(() => {
                    console.log(`shipper: ship ${docs.length} documents of ${databaseName}.${collectionName} done`)
                }).catch((error) => {
                    console.error(`shipper: ship ${docs.length} documents of ${databaseName}.${collectionName} error`, error)
                })
            }).catch(console.error)
        })
    }).catch(console.error)
}

shipper.start = () => {
    if (setting.mongo_uri) {
        return console.error(`shipper: misisng config.shipper_mongo_uri`)
    }

    if (shipper.interval !== null) {
        clearInterval(shipper.interval)
        shipper.interval = null
    }

    shipper.interval = setInterval(shipper.ship, setting.delay)
}


module.exports = shipper