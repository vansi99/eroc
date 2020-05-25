import bus from './bus'
import logger from './logger'
import event from './event'
import prog from './prog'
import util from './util'

import './css/configer.css'

const configer = {}

configer.get = (key) => {
    return bus.get(`/activity/v1/configs`, { key }).then(({ data }) => {
        return Promise.resolve(data? data.value : undefined)
    })
}

configer.set = (key, value) => bus.post('/activity/v1/configs', { key, value })


/**
 * option.name string - cache key name
 * option.target DOM 
 * option.fields Array
 * 
 * e.g.
 * <div id="teaser_media_config"></div>
 * --
 * const teaserMediaConfig = configer.table({
 *     name: 'campaign_0319:teaser:image',
 *     target: window.teaser_media_config,
 *     fields: [{ key: 'key', label: 'Label', regex: /^.+$/ }]
 * })
 */
configer.table = option => {

    const instance = {}

    instance.errors = []

    const { name, target, fields } = option
    const key = name? name.replace(/:/g, '_') : util.uuid()

    const bodyId = `configer_table_body_${key}`.replace(/:/g, '_')
    const submitId = `configer_table_submit_${key}`.replace(/:/g, '_')

    const genTr = (rows=[], startIndex) => {
        const cbody = window[bodyId]

        if (startIndex === undefined) {
            startIndex = cbody? cbody.getElementsByTagName('tr').length + 1 : 1
        }

        return rows.map((row, index) => {
            const itr = startIndex + index

            let tdList = `<td>${itr}</td>`

            tdList += fields.map((field, itd) => {
                let content = `<input value="${row[field.key] || ''}" placeholder="...">`

                if (field.render) {
                    content = field.render({
                        field,
                        value: row[field.key],
                        key: field.key,
                        row: itr,
                        col: itd,
                        config_key: key,
                    })
                }

                return `
                <td class="configer-table-field">${content}</td>` 
            }).join('')
            
            tdList += `<td click-emit="configer_table_remove_${key}:${itr}" class="configer-table-remove">&times;</td>`

            return `<tr index="${itr}"> ${tdList} </tr>`
        }).join('')
    }

    const getRows = () => {
        const datas = []
        const trs = window[bodyId].querySelectorAll('tr').toArray()

        // remove instance errors
        instance.errors = []

        trs.forEach(tr => {
            const rowData = {}
            const inputs = tr.querySelectorAll('input, textarea').toArray()

            if (inputs.length !== fields.length) {
                swal('', 'config table invalid, inputs.length !== fields.length', 'error', { timer: 1000 })
                throw 'config table invalid'
            }
            
            inputs.forEach((inp, i) => {
                const field = fields[i]
                const value = inp.value

                if (field.regex && !field.regex.test(value)) {
                    instance.errors.push(`${field.label}: sai định dạng ${field.regex}.test('${value}')`)
                }

                rowData[field.key] = value
            })

            datas.push(rowData)
        })

        return datas
    }

    const thList = fields.map(field => {
        return `<th>${field.label}</th>`
    }).join('')

    const renderTable = rows => {
        target.innerHTML = `
        <table class="table configer-table">
            <thead>
                <tr>
                    <th>#</th>
                    ${thList}
                    <th></th>
                </tr>
            </thead>

            <tbody id="${bodyId}">${genTr(rows)}</tbody>
        </table>
        <div class="text-center">
            <a click-emit="configer_table_add_new_${key}" class="btn btn-primary">+</a>
            <a click-emit="configer_table_save_${key}" id="${submitId}" class="${name? '' : 'hidden'} btn btn-sm btn-success pull-right disabled">lưu</a>
        </div>
        `

        window[bodyId].addEventListener('keydown', () => {
            instance.markModified()
        })
    }

    const renderBody = (rows, addRow) => {
        window[bodyId].innerHTML = genTr(rows, 1) + (addRow? genTr([{}]) : '')
    }

    event.listen(`configer_table_add_new_${key}`, () => {
        const rows = getRows()
        renderBody(rows, true)
        instance.markModified()
    })
    
    event.listen(`configer_table_remove_${key}`, index => {
        const target = window[bodyId].querySelector(`[index='${index}']`)

        if (!target) {
            logger.error('configer.table: remove row, dom not found')
        }

        window[bodyId].removeChild(target)
        instance.markModified()
    })

    event.listen(`configer_table_save_${key}`, () => {
        if (!name) {
            return
        }

        let rows = getRows()

        if (instance.errors.length !== 0) {
            return swal('', instance.errors.join('\n'), 'error')
        }

        instance.configWillSave(rows, (rows, done) => {
            renderBody(rows)

            configer.set(name, rows).then(() => {
                prog.push('Lưu thành công', 1000, 'check text-green')
                window[submitId].addClass('disabled')

                done && done()
            }).catch(logger.error)
        })
    })

    // modifile rows before save
    instance.configWillSave = (rows, done) => done(rows)

    instance.markModified = () => {
        window[submitId].removeClass('disabled')
    }

    instance.fetch = () => {
        if (!name) {
            return
        }

        configer.get(name).then((data) => {
            renderTable(data)
        }).catch(error => {
            logger.error('configer.table: get config error', error)
            target.innerHTML = 'create config table error'
        })
    }

    instance.getData = getRows
    instance.setData = renderBody

    if (name) {
        instance.fetch()
    } else {
        renderTable([{}])
    }

    return instance
}

/**
 * option.name string - cache key name
 * option.target DOM 
 * 
 * e.g.
 * <div id="home_alert"></div>
 * --
 * configer.text({ target: window.home_alert, name: 'cm_home_alert' })
 */
configer.text = option => {

    const { name, target } = option
    const instance = {}

    const SAVE_EVENT = `configer_text_save_${name}`
    const INPUT_ID = `configer_text_input_${name}`

    // modifile rows before save
    instance.configWillSave = (data, done) => done(data)

    configer.get(name).then((data) => {
        target.innerHTML = `
        <div class="form-group">
            <textarea class="form-control configer-text" id="${INPUT_ID}">${data || ''}</textarea>
            <button class="btn btn-success pull-right" click-emit="${SAVE_EVENT}">Lưu</button>
        </div>
        `

        event.listen(SAVE_EVENT, () => {
            const raw = window[INPUT_ID].value
            instance.configWillSave(raw, (data) => {
                configer.set(name, data).then(res => {
                    prog.push('Lưu thành công', 1000, 'check text-green')
                }).catch(err => {
                    swal('', err.message || err, 'error')
                })
            })
        })

    }).catch(err => {
        target.innerHTML = err.message || err
    })

    return instance
}

export default configer