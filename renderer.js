/* global L:false */
const { ipcRenderer } = require('electron')
const Editor = require('geowiki-editor')

let editor = new Editor({
  dom: 'map'
})

ipcRenderer.on('load-file', (event, contents) => {
  editor.load(contents)
})
ipcRenderer.on('save-file', (event) => {
  ipcRenderer.send('save-file-result', null, editor.save())
})
