const mongoose = require('mongoose')


const counter = {}
const Schema = mongoose.Schema

const schema = new Schema(
    {
        key: String,
        value: Number,
    },
    {
        timestamps: true
    },
)

schema.index({ key: 1 })

counter.Counter = mongoose.model('Counter', schema)

counter.get = async (key) => {
    const c = await counter.Counter.findOneAndUpdate(
        {
            key,
        },
        {
            $inc: {
                value: 1,
            },
        },
        {
            new: true,
            upsert: true,
        }
    )

    return c.value
}


module.exports = counter