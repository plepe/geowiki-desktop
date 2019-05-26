/* global L:false */
const { ipcRenderer } = require('electron')

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var map = L.map('map').setView([51.505, -0.09], 13)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map)

var drawnItems = new L.FeatureGroup()
map.addLayer(drawnItems)
var drawControl = new L.Control.Draw({
  edit: {
    featureGroup: drawnItems
  }
})
map.addControl(drawControl)

map.on(L.Draw.Event.CREATED, function (event) {
  var layer = event.layer

  drawnItems.addLayer(layer)
})

ipcRenderer.on('load-file', (event, contents) => {
  let data = JSON.parse(contents)

  if (data.type === 'FeatureCollection') {
    data.features.forEach(feature => {
      L.geoJSON(feature).getLayers().forEach(layer =>
        drawnItems.addLayer(layer)
      )
    })
  } else if (data.type === 'Feature') {
    drawnItems.addLayer(L.geoJSON(data).getLayers().forEach(layer =>
      drawnItems.addLayer(layer)
    ))
  }
})
ipcRenderer.on('save-file', (event) => {
  let data = {
    type: 'FeatureCollection',
    features: drawnItems.getLayers().map(layer => {
      return layer.toGeoJSON()
    })
  }

  ipcRenderer.send('save-file-result', null, JSON.stringify(data, null, '  '))
})
