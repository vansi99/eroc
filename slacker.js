const requester = require('./requester')
const config = require('../config')


const slacker = {

    setting: {
        token: 'Bearer xoxb-2240935972-1278362662806-us43xS64D8Q5n1gLJwitDIyI'
    },
}

const setting = slacker.setting

slacker.send = (message, option={}) => {

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

    if (config.env !== 'pro') {
        body.channel = '#test-report'
    }

    requester.post(
        'https://slack.com/api/chat.postMessage',
        body,
        {
            header: {
                Authorization: setting.token,
            },
        },
    ).then((res) => {
        // console.log(res)
    }).catch((error) => {
        console.error('send message to slack error:', error)
    })
}


module.exports = slacker

