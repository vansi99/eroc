const phone = {}

phone.refinePhoneNumber = (phoneNumber='') => {
    if (phoneNumber[0] === ' ') {
        return `+${phoneNumber.slice(1)}`
    }

    return phoneNumber[0] === '0'? `+84${phoneNumber.slice(1)}` : phoneNumber
}


module.exports = phone