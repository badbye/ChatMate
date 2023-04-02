function controlKey(key) {
    return (process.platform === 'darwin' ? 'Cmd' : 'Control') + '+' + key;
}

const SHORTCUT = {
    global: "SHORTCUT_GLOBAL",
}

module.exports = {controlKey, SHORTCUT}
