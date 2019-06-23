/* global L:false */
const { ipcRenderer } = require('electron')
require('leaflet-geowiki/editor')

let map = L.map('map').setView([ 48.2006, 16.3673 ], 16)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map)

let editor = L.geowikiEditor({
  sidebar: 'sidebar'
})
editor.addTo(map)

ipcRenderer.on('load-file', (event, filedata) => {
  editor.load(filedata)
})
ipcRenderer.on('save-file', (event) => {
  ipcRenderer.send('save-file-result', null, editor.save())
})
