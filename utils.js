const fs = require('fs-extra');
function controlKey(key) {
    return (process.platform === 'darwin' ? 'Cmd' : 'Control') + '+' + key;
}

const SHORTCUT = {
    global: "SHORTCUT_GLOBAL",
    quickPromptList: "SHORTCUT_QUICK_PROMPT_LIST",
    matchConversation: "MATCH_CONVERSATION_TITLE"
}

const EXTENSIONS = "EXTENSION";
function validExtensionPath(extensionPath) {
    return fs.existsSync(extensionPath);
}

function readJS(path) {
    return fs.readFileSync(path).toString();
}

// useless
function translateQuickPrompt(text, quickPromptList) {
    for (const quickPrompt of quickPromptList) {
        const key = quickPrompt.short + ' ';
        if (text.startsWith(key)) {
            return text.replace(key, quickPrompt.prompt);
        }
    }
    return text;
}

// useless
function matchQuickPrompt(text, quickPromptList) {
    for (const quickPrompt of quickPromptList) {
        const key = quickPrompt.short + ' ';
        if (text.startsWith(key)) {
            return {match: true, body: text.replace(key, ''), prompt: quickPrompt.prompt};
        }
    }
    return {match: false, body: text, prompt: ''};
}

module.exports = {
    controlKey,
    readJS,
    SHORTCUT, 
    EXTENSIONS, 
    validExtensionPath, 
    translateQuickPrompt,
    matchQuickPrompt
}
