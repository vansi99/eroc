const getSync = url => {
    const request = new XMLHttpRequest()
    request.open('GET', url, false)
    request.send(null)
    return request.responseText
}

const execScript = content => {
    const script = document.createElement('script')
    script.innerHTML = content
    document.head.appendChild(script)
}

const loadScriptSync = url => {
    if (url.indexOf('/') === -1) {
        url = '/static/js/exts/' + url + '.bundle.js'
    }
        
    const script = getSync(url)

    execScript(script)
}

// check and load(sync) polyfill if needed
if (![].find) {
    loadScriptSync('polyfill_babel')
}

if (!window.Promise) {
    loadScriptSync('polyfill_es6-promise')
}

if (!window.fetch) {
    loadScriptSync('polyfill_whatwg-fetch')
}

if (!window.Proxy) {
    loadScriptSync('polyfill_proxy')
}

import './index'
