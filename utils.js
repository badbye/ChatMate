const fs = require('fs-extra');
function controlKey(key) {
    return (process.platform === 'darwin' ? 'Cmd' : 'Control') + '+' + key;
}

const SHORTCUT = {
    global: "SHORTCUT_GLOBAL",
    quickPromptList: "SHORTCUT_QUICK_PROMPT_LIST",
}

const EXTENSIONS = "EXTENSION";
function validExtensionPath(extensionPath) {
    return fs.existsSync(extensionPath);
}

function translateQuickPrompt(text, quickPromptList) {
    for (const quickPrompt of quickPromptList) {
        const key = quickPrompt.short + ' ';
        if (text.startsWith(key)) {
            return text.replace(key, quickPrompt.prompt);
        }
    }
    return text;
}

module.exports = {controlKey, SHORTCUT, EXTENSIONS, validExtensionPath, translateQuickPrompt}
