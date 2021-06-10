const util = {}

util.refine = (place) => {

    if (typeof place === 'string') {
        place = JSON.parse(place)
    }
    
    place.components = place.address_components
        .map((c) => {
            return c.long_name.replace(/tỉnh|thành phố|tp\.|quận|huyện|phường|xã/gi, '').trim()
        })
        .reverse()

    return place
}


module.exports = util