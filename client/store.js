import logger from './logger'
import event from './event'

const KEY_BLACK_LIST = [ 'origin', 'layer' ]
const WATCH_EVENT = 'change'
const SOURCE_TAGS = ['INPUT', 'TEXTAREA', 'SELECT']

const store = {
    state: {},
    subs: [],
    layer: {},
    scan: (name) => {
        const dom = document.querySelector(`[store-bind="${name}"]`)

        if (!dom) {
            logger.error('store: store.origin.scan, key not found', name)
            return ''
        }

        const tagName = dom.tagName
        const ta = dom.getAttribute('store-ta')
        
        if (ta) {
            if (ta === 'innerHTML') {
                return dom.innerHTML
            }
            return dom.getAttribute(ta)
        }
        
        if (SOURCE_TAGS.indexOf(tagName) !== -1) {
            if (dom.type === 'checkbox' || dom.type === 'radio') {
                return dom.checked
            }
            return dom.value
        }
        
        if (tagName === 'IMG') {
            return dom.src
        }
        
        return dom.innerHTML
    }
}

const handler = {}

handler.get = (target, key) => {
    if (key === 'origin') {
        return target
    }

    if (key === 'layer') {
        return target.layer
    }


    return target.state[key]
}


/**
 * Execute when set store property
 * The set method should return a boolean value.
 * Return true to indicate that assignment succeeded.
 * If the set method returns false, and the assignment happened in strict-mode code, a TypeError will be thrown.
 * @param value
 *  - string: auto detect target view
 *  - object: option: {
 *              value: string
 *              ta: string - target attribite
 *            }
 */
handler.set = (target, key, value) => {
    if (KEY_BLACK_LIST.indexOf(key) !== -1) {
        return logger.error('store: key can not use', key)
    }

    let option = {}

    if (typeof value === 'object' && value !== null) {
        if (value.value !== undefined) {
            option = value
            value = value.value
        } else {
            return logger.error('store: complex value invalid, { value, ta (target attribute), ... }, received:', value)
        }
    }

    // render change
    {
        const bindDoms = document.querySelectorAll(`[store-bind="${key}"]`).toArray()
        bindDoms.forEach(dom => {
            const tagName = dom.tagName
            const ta = option.ta || dom.getAttribute('store-ta')

            if (ta) {
                if (ta === 'innerHTML') {
                    dom.innerHTML = value
                } else if (ta === 'outerHTML') {
                    dom.outerHTML = value
                } else {
                    dom.setAttribute(ta, value)
                }
            } else if (SOURCE_TAGS.indexOf(tagName) !== -1) {
                if (dom.type === 'checkbox' || dom.type === 'radio') {
                    dom.checked = value
                } else {
                    dom.value = value
                }
            } else if (tagName === 'IMG') {
                dom.src = value
            } else {
                dom.innerHTML = value
            }
        })
    }

    const oldValue = target.state[key]

    // update store state
    target.state[key] = value

    // update store layer
    if (target.layer[key] !== undefined) {
        target.layer[key] = value
    }

    // emit event
    event.emit('store_setted', { key, value, oldValue, ...option })

    return true
}


/**
 * execute when datasource change 
 */
const subHandle = ({ target }) => {
    const key = target.getAttribute('store-bind')
    const isLayer = target.getAttribute('layer') !== null

    let value = null

    // update layer data if has
    if (isLayer) {
        store.layer[key] = value
    }

    if (target.type === 'checkbox' || target.type === 'radio') {
        value = target.checked
    } else {
        value = target.value
    }

    handler.set(store, key, value)
}


/**
 * option:
 *  - loadValue: add store state when watch
 */
store.watch = (option={loadValue: true}) => {
    if (store.subs.length !== 0) {
        store.subs.forEach(sub => {
            sub.removeEventListener(WATCH_EVENT, subHandle)
        })
    }

    const inputs = document.querySelectorAll('input[store-bind], textarea[store-bind], select[store-bind]').toArray()
    inputs.forEach(input => {
        store.subs.push(input)

        const storeEvent = input.getAttribute('store-event')
        const watchEvents = (storeEvent || WATCH_EVENT).split(' ')

        watchEvents.forEach((watchEvent) => {
            input.addEventListener(watchEvent, subHandle)
        })

        if (option.loadValue) {
            subHandle({ target: input })
        }
    })
}

store.share = (...keys) => {

    if (!keys) {
        return
    }

    const hash = location.hash.slice(1)
    let shareState = {}

    // apply share state
    if (hash.startsWith('ss_')) {
        shareState = JSON.parse(atob(hash.slice(3)))

        Object.keys(shareState).forEach((key) => {
            handler.set(store, key, shareState[key])
        })
    }

    // watch share state
    event.listen('store_setted', ({ key, value }) => {
        if (keys.indexOf(key) !== -1) {
            shareState[key] = value

            const hash = `ss_${btoa(JSON.stringify(shareState))}`
            location.hash = hash
        }
    })
}

const storeProxy = new Proxy(store, handler)

export default storeProxy
