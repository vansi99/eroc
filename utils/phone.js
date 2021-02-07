const phone = {}

phone.refinePhoneNumber = (phoneNumber='') => {
    phoneNumber = phoneNumber.replace(/[^0-9]/g, '')
    return phoneNumber[0] === '0' ? `+84${phoneNumber.slice(1)}` : `+${phoneNumber}`
}


module.exports = phone