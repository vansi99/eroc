const mongodb = require('mongodb')

const shipper = {
    models: [],
    interval: null,
    delay: 3600000,
    warehouseUrl: 'mongodb://shovity:ytivohs@warehouse:27017',
}


shipper.add = (model) => {
    if (shipper.models.indexOf(model) === -1) {
        shipper.models.push(model)
    }
}

shipper.ship = () => {
    if (shipper.models.length === 0) {
        return
    }

    const threshold = Date.now() - shipper.delay

    // connect to warehouse
    mongodb.MongoClient.connect(shipper.warehouseUrl, { useUnifiedTopology: true }).then((client) => {

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
                    console.log(`Ship ${docs.length} documents of ${databaseName}.${collectionName} done`)
                }).catch((error) => {
                    console.error(`Ship ${docs.length} documents of ${databaseName}.${collectionName} error`, error)
                })
            }).catch(console.error)
        })
    }).catch(console.error)
}

shipper.start = () => {
    if (shipper.interval !== null) {
        clearInterval(shipper.interval)
        shipper.interval = null
    }

    shipper.interval = setInterval(shipper.ship, shipper.delay)
}


module.exports = shipper