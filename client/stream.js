import logger from "./logger"

const stream = {}

class Stream {
    constructor (elements, option) {
        const optionDefault = {
            //
        }

        this.elements = elements
        this.option = {
            ...optionDefault,
            ...option,
        }
    }

    pipe (handle) {
        if (typeof handle !== 'function') {
            return logger.error('stream: handle of pip must be a function')
        }

        for (let i = 0, l = this.elements.length; i < l; i++) {
            setTimeout(() => {
                this.elements[i] = handle(this.elements[i], i, this.elements)
            }, 0)
        }

        return this
    }
}


stream.create = (elements, option) => {
    if (!Array.isArray(elements)) {
        return logger.error('stream: input must be an array')
    }

    return new Stream(elements)
}


export default stream
