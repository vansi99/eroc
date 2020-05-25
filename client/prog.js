import logger from './logger'

const prog = {}

prog.tasks = []

prog.remove = message => {
    const taskIndex = prog.tasks.findIndex(t => t.message === message)
    if (taskIndex !== -1) {
        prog.tasks.splice(taskIndex, 1)
        prog.next()
    }
}

prog.next = () => {
    if (!window.prog_box || !window.prog_message) {
        return logger.error('prog: missing prog dom')
    }

    const task = prog.tasks[prog.tasks.length - 1]
    
    if (!task) {
        window.prog_box.addClass('prog-fade')
        return
    } else {
        window.prog_box.removeClass('prog-fade')
    }

    const { message, timeout, option } = task

    window.prog_message.innerHTML = message

    if (window.prog_icon) {
        if (option.icon) {
            window.prog_icon.className = `prog-icon fa fa-${option.icon}`
        } else {
            window.prog_icon.className = 'prog-icon hidden'
        }
    }
    
    if (timeout) {
        setTimeout(() => {
            
            prog.remove(message)
        }, timeout)

        task.timeout = false
    }
}

prog.push = (message, timeout, option={}) => {

    if (typeof option === 'string') {
        option = {
            icon: option,
        }
    }

    prog.tasks.push({ message, timeout, option })
    prog.next()
}

prog.success = (message, timeout=2000) => {
    return prog.push(message, timeout, 'check text-green')
}

prog.error = (message, timeout=2000) => {
    return prog.push(message, timeout, 'times text-red')
}

export default prog