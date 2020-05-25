const logger = {}

logger.setting = {
    level: 'debug',
}

logger.LOG_LEVELS = [
    'debug',
    'info',
    'warning',
    'error',
]

logger.check = (level) => {
    return logger.LOG_LEVELS.indexOf(logger.setting.level.toLowerCase()) <= logger.LOG_LEVELS.indexOf(level)
}

Object.defineProperty(logger, 'debug', {
    get: () => {
        if (logger.check('debug')) {
            return console.debug.bind(window.console, '%cDEBUG:', 'color: #6c757d')
        }

        return () => undefined
    },
})

Object.defineProperty(logger, 'info', {
    get: () => {
        if (logger.check('info')) {
            return console.info.bind(window.console, '%cINFO:', 'color: #17a2b8')
        }

        return () => undefined
    },
})

Object.defineProperty(logger, 'warning', {
    get: () => {
        if (logger.check('warning')) {
            return console.warn.bind(window.console, '%cWARNING:', 'color: #ffc107')
        }

        return () => undefined
    },
})

Object.defineProperty(logger, 'error', {
    get: () => {
        if (logger.check('error')) {
            return console.error.bind(window.error, '%cERROR:', 'color: #dc3545')
        }

        return () => undefined
    },
})

export default logger
