import io from 'socket.io-client'

import event from './event'
import config from './config'
import logger from './logger'

let namespace = ''

if (config.env === 'dev' || config.env === 'loc') {
    namespace = 'dev'
} else if (config.env === 'pro') {
    namespace = 'pro'
}

const WEBSOCKET_URL = `https://socket.dichung.vn/${namespace}`
 
const client = io(WEBSOCKET_URL)

const socket = {
    joined_rooms: [],
}

socket.io = io

socket._io_client = client

client.on('connect', () => {
    socket.id = client.id
    event.emit('socket_connected')
    logger.info(`socket: connected to namespace -> ${namespace}`)

    // re-join rooms
    if (socket.joined_rooms.length !== 0) {
        client.emit('join_room', socket.joined_rooms.join(','))
    }
})

socket.listen = (action, handle) => {

    return client.on(action, handle)
}

socket.join = (name) => {
    if (socket.joined_rooms.indexOf(name) === -1) {
        socket.joined_rooms.push(name)
    }

    client.emit('join_room', name)
}

socket.leave = (name) => {
    socket.joined_rooms = socket.joined_rooms.filter(r => r !== name)
    client.emit('leave_room', name)
}

socket.emit = (name, payload, callback, ...args) => {
    client.emit(name, payload, callback, ...args)
}

export default socket