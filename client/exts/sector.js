const dchost = document.currentScript.src.split('/static')[0]

window.dichungSectorInit = () => {
    const box = document.querySelector('[dc-key]')

    if (!box) {
        return console.error('dichung sector: missing box')
    }

    const key = box.getAttribute('dc-key')
    const xhttp = new XMLHttpRequest()

    const listen = (message, handle) => {
        window.addEventListener('message', (e) => {
            let data = {}

            try {
                data = JSON.parse(e.data)
            } catch (error) {
                
            }

            if (data && data.message === message) {
                handle(data.data)
            }
        })
    }
    
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            box.innerHTML = this.responseText

            if (query && query.dev) {
                box.innerHTML = this.responseText.replace('https://hubdev.dichungtaxi.com', 'https://localhost:3001')
            }

            listen('full_screen', () => {
                window.dichung_con.className = 'dichung-con dichung-con-full'
            })

            listen('set_height', (value) => {
                window.dichung_con.style.height = value
            })

            window.dichung_con_close.addEventListener('click', () => {
                window.dichung_con.className = 'dichung-con'
                window.dichungSectorInit()
            })
        } 
    }

    xhttp.open('GET', `${dchost}/api/sector/v1/boxs/${key}?hostname=${location.hostname}`, true)
    xhttp.send()
}

window.dichungSectorInit()