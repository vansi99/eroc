/**
 * Basic usage:
 * il.show(`product:image:${id}`)
 * il.done(`product:image:${id}`, (images) => console.log(images))
 * 
 * event.emit('il_show', 'key')
 * event.listen('il_done', (images, key) => consoel.log(images, key))
 */

const { bus, store, event, include, prog } = core

const dependencies = [
    '/static/main/js/jquery.fileupload.js'
]

const il = {
    key: '',
    images: [],
    observers: [],
    offset: 0,
    limit: 24,

    dependenciesReady: false,
    loading: false,
    uploading: false,
    upload: 0,
    uploaded: 0,

    setting: {
        url: '/api/image/v1/images',
        api: '/image/v1/images',
        maxSize: 5242880,
        concurrentUpload: 12,
        acceptTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    }
}

const setting = il.setting

il.mount = () => {
    if (window.il_modal) {
        return console.error('il: il_modal already mounted')
    }

    const dom = document.createElement('div')

    dom.innerHTML = `
    <style>
        .il-image-box {
            display: flex;
            flex-wrap: wrap;
            margin-left: -10px;
            overflow-y: auto;
            max-height: 60vh;
        }
        
        .il-image {
            height: 150px;
            width: 270px;
            padding: 0 10px 20px 10px;
            position: relative;
            cursor: pointer;
        }
        
        .il-image-footer {
            bottom: 20px;
            position: absolute;
            padding: 1px 5px;
            background: rgba(0, 0, 0, 0.6);
            left: 10px;
            width: calc(100% - 20px);
            color: #fff;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            opacity: 0;
            pointer-events: none;
            transition: all .2s ease-in-out;
        }
        
        .il-image:hover .il-image-control,
        .il-image:hover .il-image-footer {
            opacity: 1;
            pointer-events: auto;
        }
        
        .il-image-bg {
            pointer-events: none;
            background-color: #ddd;
            background-position: center;
            background-repeat: no-repeat;
            background-size: cover;
            cursor: pointer;
            width: 100%;
            height: 100%;
        }
        
        .il-image-badge-selected {
            pointer-events: none;
            position: absolute;
            top: 5px;
            right: 15px;
            color: #2196f3;
            display: none;
        }
        
        .il-image-selected .il-image-badge-selected {
            display: block;
        }
        
        .il-image-selected .il-image-bg {
            border: 2px solid #2196f3;
        }
        
        .il-image-control {
            position: absolute;
            top: 5px;
            left: 15px;
            display: flex;
            opacity: 0;
            pointer-events: none;
            transition: all .2s ease-in-out;
        }
        
        .il-image-control > span {
            background-color: rgba(0, 0, 0, 0.6);
            color: #ddd;
            margin: 0 1px;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
        }
        
        .il-image-control > span:hover {
            color: #fff;
        }
        
        .il-modal .modal-header {
            padding-bottom: 0;
            border-bottom: 0;
        }
        
        .il-modal .modal-dialog {
            width: 1106px;
        }
        
        .il-image-box::-webkit-scrollbar {
            width: 5px;
        }
        
        .il-image-box::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 2px;
        }
        
        .il-image-box::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.5);
            border-radius: 2px;
        }
        
        .il-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .il-footer > div {
            flex: auto;
        }
    </style>

    <input id="il_input" type="file" accept="image/*" name="image" class="hidden" multiple>

    <div class="modal fade il-modal" id="il_modal" data-backdrop="static" data-keyboard="false">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <button type="button" class="close" data-dismiss="modal">
                    <span aria-hidden="true">×</span></button>
                    <h4 class="modal-title">Thư viện ảnh</h4>
                </div>
                
                <div class="modal-body">
                    <div class="il-image-box" id="il_image_box"></div>

                    <div class="il-footer mt10">
                        <div>
                            <a id="il_upload" class="btn btn-primary" click-emit="il_upload">Tải lên nhiều ảnh</a>
                        </div>

                        <div class="text-right">
                            <span id="il_select_hint" class="hidden-next text-yellow">Nhấn vào ảnh để chọn</span>
                            <div>
                                <a class="btn btn-danger" click-emit="il_delete">
                                    Xoá <span store-bind="il_select_count">0</span> ảnh
                                </a>
                                <a class="btn btn-success" click-emit="il_select_done">
                                    Chọn <span store-bind="il_select_count">0</span> ảnh
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`

    document.body.appendChild(dom)

    window.il_image_box.addEventListener('scroll', () => {
        const { scrollTop, scrollHeight, clientHeight } = window.il_image_box
    
        if (il.offset !== -1 && !il.loading && scrollTop > scrollHeight - clientHeight - 100) {
            il.fetch()
        }
    })

    window.il_input.addEventListener('change', () => {
        if (!il.dependenciesReady) {
            prog.error('Thư viện chưa được tài xong, hay thử lại')
        }
    })
}

il.hide = () => {
    if (il.uploading) {
        return prog.error('Xin hãy đợi đến khi quá trình tải lên hoàn tất')
    }

    $(il_modal).modal('hide')
}

il.add = (images, top=false) => {
    const fragment = new DocumentFragment()

    if (!Array.isArray(images)) {
        images = [images]
    }

    images.forEach((image) => {
        const dom = document.createElement('div')

        dom.setAttribute('class', `il-image ${image.selected? 'il-image-selected' : ''}`)
        dom.setAttribute('click-emit', `il_select:${image._id}`)
        dom.setAttribute('il-image-id', image._id)

        dom.innerHTML = `
        <div style="background-image: url(${image.url}?w=250)" class="il-image-bg"></div>
        <span class="glyphicon glyphicon-ok il-image-badge-selected"></span>
        <div class="il-image-control">
            <span class="fa fa-copy" click-emit="copy:${image.url}"></span>
        </div>
        <div class="il-image-footer">${image.originalname}</div>`

        if (top) {
            fragment.prepend(dom)
        } else {
            fragment.appendChild(dom)
        }
    })

    if (top) {
        il.images.unshift(...images)
        window.il_image_box.prepend(fragment)
    } else {
        il.images.push(...images)
        window.il_image_box.appendChild(fragment)
    }
}

il.fetch = () => {

    if (il.offset === -1) {
        return
    }

    const param = {
        key: il.key,
        limit: il.limit,
        offset: il.offset,
    }

    il.loading = true

    bus.get('/image/v1/images', param).then(({ data }) => {
        il.offset = (data.length - il.limit === 0)? il.offset + il.limit : -1
        il.add(data)

        $(il_modal).modal('show')
    }).catch(bus.ale).finally(() => {
        il.loading = false
    })
}

il.show = (key='') => {
    il.key = key
    il.offset = 0
    il.images = []
    window.il_image_box.innerHTML = ''

    il.fetch()
}

il.done = (key, handle) => {
    il.observers.push({ key, handle })
}

il.progess = (upload, uploaded) => {

    if (uploaded === upload) {
        il.uploading = false
        upload = 0
        uploaded = 0

        window.il_upload.removeClass('btn-loading')
        window.il_upload.innerHTML = 'Tải lên nhiều ảnh'
    }  else {
        window.il_upload.addClass('btn-loading')
        window.il_upload.innerHTML = `Đang tải lên ${upload - uploaded} ảnh`
    }

    il.upload = upload
    il.uploaded = uploaded
}

event.listen('il_select', (_id) => {
    const image = il.images.find(i => i._id === _id)
    const target = window.il_modal.querySelector(`div[il-image-id="${_id}"]`)

    if (image.selected) {
        target.removeClass('il-image-selected')
        image.selected = false
    } else {
        target.addClass('il-image-selected')
        image.selected = true
    }

    event.next('il_select_sync')
})

event.listen('il_select_sync', () => {
    store.il_select_count = il.images.filter(i => i.selected).length

    if (store.il_select_count === 0) {
        window.il_select_hint.addClass('hidden-next')
        window.il_select_hint.removeClass('hidden')
    } else {
        window.il_select_hint.removeClass('hidden-next')
        window.il_select_hint.addClass('hidden')
    }
})

event.listen('il_select_done', () => {
    const images = il.images.filter(i => i.selected)

    il.observers.filter(o => o.key === il.key).forEach((o) => {
        o.handle(images)
    })

    event.emit('il_done', images, il.key)
    il.hide()
})

event.listen('il_delete', (_, { target }) => {

    const selectedImages = il.images.filter(i => i.selected)

    const body = {
        _id: selectedImages.map(si => si._id)
    }

    bus.delete(setting.api, body, { btn: target }).then(() => {
        il.images = il.images.filter(i => !i.selected)

        selectedImages.forEach((si) => {
            const target = window.il_modal.querySelector(`div[il-image-id="${si._id}"]`)
            target.parentElement.removeChild(target)
        })

        event.next('il_select_sync')
    }).catch(bus.ale)
})

event.listen('il_upload', () => {
    window.il_input.click()
})

event.listen('il_show', (key) => {
    il.show(key)
})

core.include.script(dependencies).then(() => {
    $(window.il_input).fileupload({
        url: setting.url,
        limitConcurrentUploads: setting.concurrentUpload,
        
        add: (e, data) => {
            const errors = []

            data.files.forEach(file => {
                if (file.size > setting.maxSize) {
                    errors.push(`Dung lượng vượt quá ${setting.maxSize / 1048576}MB: ${file.name}`)
                }

                if (setting.acceptTypes.indexOf(file.type) == -1) {
                    errors.push(`Không đúng định dạng ảnh: ${file.name}`)
                }
            })

            if (errors.length !== 0) {
                return swal(
                    'Hình ảnh tải lên không hợp lệ',
                    errors.join('\n'),
                    { icon: 'error' },
                )
            }

            data.formData = {
                key: il.key,
            }

            data.submit()
            il.progess(il.upload += data.files.length, il.uploaded)
        },
        done: (e, data) => {
            if (data.result.error) {
                throw data.result.error
            }

            const image = data.result.data

            image.selected = true
            
            il.add(image, true)
            il.progess(il.upload, il.uploaded + 1)
            event.next('il_select_sync')      
        },
        error: () => {
            il.progess(0, 0)

            return swal(
                'Lỗi không xác định khi thực hiện tải ảnh lên',
                `Đã tải lên ${il.uploaded}, lỗi ${il.upload - il.uploaded}`,
                { icon: 'error' },
            )
        },
    })
    
    il.dependenciesReady = true
})

il.mount()


window.core.il = il