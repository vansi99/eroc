

class Event {

    constructor() {
        this._eventPools = []
        this.iid = `${Date.now()}${Math.random()}`
    }

    listen(name, handle) {
        name.split(' ').forEach(name => {
            const existsEvent = this._eventPools.find(e => e.name === name)
    
            if (existsEvent) {
                existsEvent.handles.push(handle)
            } else {
                const newEvent = { name, handles: [ handle ] }
                this._eventPools.push(newEvent)
            }
        })
    }

    emit(name, ...payload) {
        const hitEvent = this._eventPools.find(e => e.name === name)
        hitEvent && hitEvent.handles.forEach(handle => handle(...payload))
    }

    next(timeout, ...arg) {
        if (typeof timeout !== 'number') {
            arg.unshift(timeout)
            timeout = 0
        }

        if (timeout === 0) {
            process.nextTick(this.emit, ...arg)
        } else {
            setTimeout(this.emit, timeout, ...arg)
        }
    }
}

const event = new Event()
event.Event = Event


module.exports = event