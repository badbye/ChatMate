const {validExtensionPath} = require('./utils');

async function registerExtensions(session, exnteionsPath) {
    for (const extension of exnteionsPath) {
        if (validExtensionPath(extension)) {
            await session.defaultSession.loadExtension(extension);
        } else {
            console.log(`Extension ${extension} not found.`)
        }
    }
}

module.exports = { registerExtensions }
