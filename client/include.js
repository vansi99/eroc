import event from './event'
import prog from './prog'

const include = {}


/**
 * Include scirpt by url
 *
 * @param {String|Array} urls Javascript source url
 * @param {Boolean} pass Flag to resolve instance
 * @param {String} waitEvent Event need to wait for script include complete
 * @returns {Promise}
 */
include.script = (urls, pass, waitEvent) => {

    if (pass) {
        return Promise.resolve()
    }

    let ready = false

    if (waitEvent) {
        event.listen(waitEvent, () => {
            if (!ready) {
                prog.error('Thư viện chưa được tại xong, hãy thử lại')
            }
        })
    }

    if (typeof urls === 'string') {
        urls = [ urls ]
    }
    
    const pros = []

    urls.forEach(u => {
        if (u.indexOf('/') === -1) {
            u = '/static/main/js/exts/' + u + '.bundle.js'
        }

        const script = document.createElement('script')
        script.src = u

        pros.push(new Promise((resolve, rejects) => {
            script.onload = () => {
                resolve(u)
            }

            script.onerror = () => {
                rejects(u)
            }
        }))

        document.head.appendChild(script)
    })    

    return Promise.all(pros).then(() => {
        ready = true
        return Promise.resolve()
    })
}

include.ui = (url, target) => {

    return fetch(url).then((res) => {
        if (res.status !== 200) {
            throw 'http status code !== 200'
        }

        return res.text()
    }).then((text) => {
        const content = document.createElement('div')
        content.innerHTML  = text

        const scripts = content.querySelectorAll('script').toArray()

        scripts.forEach((script) => {
            script.parentNode.removeChild(script)
        })

        target.appendChild(content)

        scripts.forEach((script) => {
            const cloneScript = document.createElement('script')
            
            if (script.src) {
                cloneScript.src = script.src
            } else {
                cloneScript.innerHTML = script.innerHTML
            }

            document.head.appendChild(cloneScript)
        })
        
        return Promise.resolve()
    }).catch((error) => {
        console.error(error)
        window.content.innerHTML = `
        Cố gắng lấy dữ liệu thất bại! <br>
        Kiểm tra UI component <strong>${url}</strong>`
    })
}


export default include