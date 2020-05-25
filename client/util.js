import logger from './logger'
import include from './include'

const util = {}

util.createCirleCall = (timeout=200) => {
    const instance = {
        block: false,
        handle: null,
    }

    instance.execute = (handle, ...args) => {
        instance.handle = handle

        if (!instance.block) {
            instance.handle(...args)
            instance.handle = null
            instance.block = true

            setTimeout(() => {
                instance.block = false
                if (instance.handle) {
                   instance.execute(instance.handle, ...args)
                }
            }, timeout)
        }
    }

    return instance
}

util.createTimeoutCall = (timeout=200, fn, ...args) => {
    const instance  = {}
    instance.timeout = timeout
    instance.fn = fn
    instance.args = args
    instance.call_timeout = null
    

    instance.execute = fn => {
        if (fn) {
            instance.fn = fn
        }

        if (!instance.fn) {
            return logger.error('util: createTimeoutCall: missing fn')
        }

        clearTimeout(instance.call_timeout)
        instance.call_timeout = setTimeout(() => {
            fn(...instance.args)
        }, instance.timeout)
    }

    return instance
}

util.getCookie = cname => {
    const name = cname + "="
    const cookies = decodeURIComponent(document.cookie).split(';')
    for (let i = 0, l = cookies.length; i < l; i++) {
        let c = cookies[i]
        while (c.charAt(0) == ' ') {
            c = c.substring(1)
        }

        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length)
        }
    }

    return ""
}

util.setCookie = (cname, cvalue, exms=31104000000) => {
    const d = new Date()
    d.setTime(d.getTime() + exms)
    const expires = "expires=" + d.toUTCString()
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/"
}

util.export = (rows, name, option) => {

    const run = (rows, name, option) => {

        const workbook = XLSX.utils.book_new()
        workbook.Props = { Title: 'Export', Subject: '', ...option }
        workbook.SheetNames.push("Sheet1")
        workbook.Sheets["Sheet1"] = XLSX.utils.aoa_to_sheet(rows)

        XLSX.writeFile(workbook, `${name}.xlsx`, { bookType: 'xlsx', bookSST: false })
    }

    if (!window.XLSX) {
        include.script('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.13.1/xlsx.full.min.js').then(() => {
            run(rows, name, option)
        })
    } else {
        run(rows, name, option)
    }
}

util.encodeHTML = (value) => {
    const ta = window.document.createElement('textarea')
    ta.innerText = value || ''
    return ta.innerHTML.replace(/"/g, '&quot;')
}
    
util.decodeHTML = (value) => {
    const ta = window.document.createElement('textarea')
    ta.innerHTML = value
    return ta.value
}

util.copy = (value) => {
    const inp = document.createElement('textarea')
    inp.style = 'position:fixed; bottom: -50px'
    document.body.appendChild(inp)
    inp.value = value
    inp.select()
    inp.setSelectionRange(0, value.length)
    document.execCommand('copy')
    document.body.removeChild(inp)
}

util.tformat = (utctime) => {
    return utctime? moment.utc(utctime).local().format('HH:mm DD/MM/YYYY') : ''
}

util.uuid = () => {
    
    // v4 uuid
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => {
        return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    })
}


export default util