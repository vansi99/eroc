import logger from './logger'

const dom = {}

dom.setting = {

}

dom.html = (parts, ...exps) => {
    let html = ''

    exps.push('')

    parts.forEach((part, index) => {
        
        let es = exps[index]
        let er = ''

        if (es instanceof HTMLCollection || es instanceof NodeList) {
            es = [ ...es ]
        }

        if (!Array.isArray(es)) {
            es = [ es ]
        }

        es.forEach(e => {
            if (e instanceof HTMLElement) {
                er += e.outerHTML
            } else {
                er += e
            }
        })

        html += part + er
    })

    const fakePE = document.createElement('div')
    fakePE.innerHTML = html

    if (fakePE.childElementCount === 0) {
        logger.error('dom.html: dom must has only on child')
        return document.createElement('div')
    } else if (fakePE.childElementCount > 1) {
        return fakePE
    }

    return fakePE.firstElementChild
}

dom.raw = (parts, ...exps) => dom.html(parts, ...exps).outerHTML

dom.render = (values, target) => {

    if (!Array.isArray(values)) {
        values = [ values ]
    }

    if (typeof value === 'string') {
        target.innerHTML = value
    } else if (value instanceof HTMLElement) {
        target.innerHTML = ''
        target.appendChild(value)
    }
}

export default dom