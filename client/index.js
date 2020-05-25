/**
 * CORE don't suport old browser
 * use variant core.safe.js for cross browser
 */

import init from './init'

init()

import event from './event'
import stream from './stream'
import command from './command'
import storage from './storage'
import config from './config'
import logger from './logger'
import emitter from './emitter'
import include from './include'
import configer from './configer'
import store from './store'
import util from './util'
import bus from './bus'
import wrapper from './wrapper'
import prog from './prog'
import socket from './socket'
import dom from './dom'
import activity from './activity'

// create global core object
const core = {}
window.core = core

// mount components to core
core.event = event
core.stream = stream
core.command = command
core.storage = storage
core.config = config
core.logger = logger
core.emitter = emitter
core.include = include
core.configer = configer
core.store = store
core.util = util
core.init = init
core.bus = bus
core.wrapper = wrapper
core.prog = prog
core.socket = socket
core.dom = dom
core.activity = activity

// il
// htmlEditor

core.ready = (handle) => {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        return handle(core)
    }

    document.addEventListener('DOMContentLoaded', () => {
        handle(core)
    })
}

core.use = (module, handle) => {
    const modules = module.split(' ').map(m => m.trim())

    include.script(modules.filter(m => !core[m])).then(() => {
        modules.forEach(m => {
            window[m] = core[m]
        })

        core.ready(handle)
    })
}