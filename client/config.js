const config = {}

// runtime environment
config.env = 'loc'

if (location.hostname === 'portal.dichung.vn') {
    config.env = 'pro'
}

export default config
