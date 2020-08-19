const CronJob = require('cron').CronJob

const config = require('../config')


const scheduler = {
    jobs: [],
}

scheduler.add = (expr, handle, option={}) => {
    const cronjob = new CronJob(expr, handle)

    if (option.env && option.env.split(' ').indexOf(config.env) === -1) {
        return
    }

    scheduler.jobs.push({
        expr,
        handle,
        cronjob,
    })

    cronjob.start()
}


module.exports = scheduler