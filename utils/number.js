const number = {}

number.encodeBase64URL = (value) => {
    const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

    if (typeof(value) !== 'number') {
        throw 'value is not number'
    }

    let result = ''

    do {
        const mod = value % 64
        result = ALPHA.charAt(mod) + result
        value = Math.floor(value / 64)
    } while(value > 0)

    return result
}

number.decodeBase64URL = (value) => {
    const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

    let result = 0

    for (let i = 0, len = value.length; i < len; i++) {
        result *= 64
        result += ALPHA.indexOf(value[i])
    }

    return result
}


module.exports = number