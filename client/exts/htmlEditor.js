import include from '../include'

const IMAGES_UPLOAD_URL = '/api/image/v1/images'

const { store } = core

const htmlEditor = {}

htmlEditor.cleanVenom = (content) => {
    return content.replace(/<iframe.+?<\/iframe>/g, '')
}

htmlEditor.init = (option) => {
    const instance = {
        target: option.target,
        key: option.target.getAttribute('store-bind'),
    }

    if (!option.target) {
        throw 'mission option.target'
    }

    const setting = {
        plugins: [
            'advlist autolink lists link image charmap print preview hr anchor pagebreak',
            'searchreplace wordcount visualblocks visualchars code fullscreen fullpage',
            'insertdatetime media nonbreaking save table contextmenu directionality',
            'emoticons template paste textcolor colorpicker textpattern codesample toc image',
        ],
        toolbar: 'undo redo | styleselect forecolor backcolor emoticons| bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | image link',
        images_upload_url: IMAGES_UPLOAD_URL,
        height: 350,

        // link plugin settings
        rel_list: [
            { title: 'Mặc định', value: '' },
            { title: 'Nofollow', value: 'nofollow' },
        ],
        target_list: [
            {title: 'Mặc định', value: ''},
            {title: 'Same page', value: '_self'},
            {title: 'New page', value: '_blank'},
            {title: 'Lightbox', value: '_lightbox'},
        ],
        setup: (editor) => {
            editor.on('ObjectResized', e => {
                const target = e.target

                // handle put param w= when resize image
                if (target.nodeName === 'IMG') {
                    if (target.src.indexOf('w=') === -1) {
                        target.src += `${target.src.indexOf('?') === -1? '?' : '&'}w=${e.width}`
                    } else {
                        target.src = target.src.replace(/w=\d+/, `w=${e.width}`)
                    }
                }
            })

            editor.on('change', e => {
                if (instance.key) {
                    store[instance.key] = htmlEditor.cleanVenom(editor.getContent())
                }
            })

            editor.on('PostProcess', e => {
                e.content = htmlEditor.cleanVenom(e.content)
            })

            setTimeout(() => {
                instance.editor = editor

                if (instance.waitToSetContents) {
                    instance.setContent(...instance.waitToSetContents)
                    instance.waitToSetContents = null
                }
            })
        },

        selector: `#${instance.target.id}`,

        // override option
        ...option,
    }

    if (window.tinymce) {
        window.tinymce.init(setting)
    } else {
        include.script('//cdn.tinymce.com/4/tinymce.min.js').then(() => {
            window.tinymce.init(setting)
        })
    }

    // https://www.tiny.cloud/docs/api/tinymce/tinymce.editor/#getcontent
    instance.getContent = (option) => {
        if (!instance.editor) {
            return ''
        }

        return instance.editor.getContent(option)
    }

    // https://www.tiny.cloud/docs/api/tinymce/tinymce.editor/#setcontent
    instance.setContent = (data, option) => {
        if (!instance.editor) {
            instance.waitToSetContents = [data, option]
            return
        }

        if (instance.key) {
            store[instance.key] = htmlEditor.cleanVenom(data)
        }

        return instance.editor.setContent(htmlEditor.cleanVenom(data), option)
    }

    return instance
}

core.htmlEditor = htmlEditor
export default htmlEditor