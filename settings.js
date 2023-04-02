const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const store = new Store();
const {SHORTCUT} = require('./utils');

const shortcutInput = document.querySelector('#shortcut-input');
const previsShortCut = store.get(SHORTCUT.global)
if (previsShortCut) {
    shortcutInput.value = previsShortCut;
}

let recordingShortcut = false;
let keysPressed = [];
shortcutInput.addEventListener('focus', () => {
  recordingShortcut = true;
  keysPressed = [];
  shortcutInput.value = '';
});

shortcutInput.addEventListener('blur', () => {
  recordingShortcut = false;
});

document.addEventListener('keydown', (event) => {
  if (recordingShortcut) {
    event.preventDefault();
    keysPressed.push(event.key);
    shortcutInput.value = keysPressed.join(' + ');
  }
});

document.addEventListener('keyup', (event) => {
  if (recordingShortcut) {
    event.preventDefault();
    const shortcut = keysPressed.join('+');
    ipcRenderer.send('shortcut-register-global', shortcut);
    shortcutInput.blur();
  }
});