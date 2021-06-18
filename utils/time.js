const moment = require('moment')


const util = {}

util.timef = (utctime) => {
    return utctime ? moment.utc(utctime).utcOffset(7).format('HH:mm DD/MM/YYYY') : ''
}


module.exports = util