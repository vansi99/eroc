const requester = require('./requester')
const config = require('../config')


const slacker = {

    setting: {
        hook: 'https://hooks.slack.com/services/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'
    },
}

const setting = slacker.setting

slacker.send = (message, option={}) => {

    if (config.env !== 'pro') {
        return console.log('disable report in dev')
    }

    const body = option.raw || {
        channel: option.channel,
        attachments: [{
            color: option.color || '#00c0ef',
            title: option.title || '',
            text: message || '',
            footer: 'DC Slack API',
            // ts: 0,
        }]
    }

    requester.post(setting.hook, body, { parse: 'text' }).then((res) => {
        if (res !== 'ok') {
            return console.error('send message to slack error:', res)
        }
    }).catch((error) => {
        console.error('send message to slack error:', error)
    })
}


module.exports = slacker

