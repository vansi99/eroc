import bus from './bus'
import util from './util'

const caller = util.createTimeoutCall(300)

const wrapper = {}

wrapper.table = ({ target, url, dataSend, cols, option } = {}) => {
    const instance = {}

    option = option || {}

    if (target.className === '') {
        target.className = 'table table-bordered table-hover'
    }

    instance.onDataReceived = () => undefined

    if (cols) {
        option.columns = cols.map((c) => {
            return {
                render: (data, type, full) => {
                    return c(full) || ''
                }
            }
        })
    }

    instance.dt = $(target).DataTable({
        ordering: false,
        serverSide: true,
        oLanguage: {
            sInfo: '_START_ - _END_ trên _TOTAL_ bản ghi',
            sEmptyTable: 'Không có dữ liệu hiển thị',
            sSearch: '',
            sLoadingRecords: 'Đang tải dữ liệu',
            sProcessing: 'Đang xử lý dữ liệu',
            sLengthMenu: '_MENU_',
            sInfoEmpty: '',
            sInfoFiltered: '',
            oPaginate: {
                sNext: 'Trang sau',
                sPrevious: 'Trang trước',
                sFirst: 'Trang đầu',
                sLast: 'Trang cuối',
            }
        },

        ajax: (data, callback, settings) => {
            let additionData = dataSend

            if (typeof dataSend === 'function') {
                additionData = dataSend(data)
            }

            bus.get(
                url,
                {
                    offset: +data.start,
                    limit: +data.length,
                    search: data.search.value,
                    draw: data.draw,
                    sortCol: data.order[0] && data.order[0].column || 0,
                    sortDir: data.order[0] && data.order[0].dir || 'asc',
                    ...additionData,
                }
            ).then(res => {

                res.meta = res.meta || res.metadata || {}

                const holder = {
                    data: res.data,
                    draw: res.meta.draw || Date.now(),
                    recordsTotal: res.meta.total,
                    recordsFiltered: res.meta.total,
                }

                if (!holder.data) {
                    return swal('Server error', 'Không lấy được dữ liệu từ máy chủ', 'error')
                }

                callback(holder)
                instance.onDataReceived(res, data)
            }).catch(bus.ale)
        },

        initComplete: (setting, json) => {
            if (setting.aanFeatures.f && setting.aanFeatures.f[0]) {
                const searchInput = setting.aanFeatures.f[0].querySelector('input')

                $(searchInput).unbind()

                searchInput.placeholder = option.searchPlaceholder || 'Tìm kiếm'

                searchInput.addEventListener('keyup', ({ target }) => {
                    caller.execute(() => {
                        setting.oInstance.fnFilter(target.value)
                    })
                })
            }
        },

        ...option,
    })

    instance.reload = (callback = null, resetPaging = false) => {
        // more handle for reload

        instance.dt.ajax.reload(callback, resetPaging)
    }

    return instance
}

export default wrapper