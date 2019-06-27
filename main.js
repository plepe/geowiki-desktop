// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron')
const fs = require('fs')
const path = require('path')
const async = require('async')
const ArgumentParser = require('argparse').ArgumentParser

let parser = new ArgumentParser({
  addHelp: true,
  description: 'Geowiki - an application for creating informative maps'
})

parser.addArgument(
  'filename',
  {
    help: 'List of files to open',
    nargs: '*'
  }
)

let args = parser.parseArgs()

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function saveAs (filedata, done) {
  dialog.showSaveDialog(
    {
      defaultPath: (filedata.path || '.') + '/' + filedata.name,
      properties: [ 'saveFile' ],
      filters: [
        { name: 'Geowiki', extensions: ['geowiki'] }
      ]
    },
    (filePath) => {
      if (!filePath) {
        return
      }

      fs.writeFile(filePath, filedata.contents,
        (err) => {
          done()

          if (err) {
            console.error(err)
          }
        }
      )
    }
  )
}

function save (filedata, done) {
  let filePath = filedata.path + '/' + filedata.name

  fs.writeFile(filePath, filedata.contents,
    (err) => {
      done()

      if (err) {
        console.error(err)
      }
    }
  )
}

function loadFiles (filePaths, mainWindow) {
  filePaths.forEach(
    (filePath) => {
      fs.readFile(filePath, (err, contents) => {
        if (err) {
          return console.error(err)
        }

        mainWindow.webContents.send('load-file', {
          path: path.dirname(filePath),
          name: path.basename(filePath),
          contents: contents.toString()
        })
      })
    }
  )
}

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  mainWindow.webContents.once('dom-ready', () => {
    if (args.filename) {
      loadFiles(args.filename, mainWindow)
    }
  })

  var menu = Menu.buildFromTemplate([
    {
      label: 'File',
      submenu: [
        {
          label: 'Open',
          click () {
            dialog.showOpenDialog({
              properties: [ 'openFile', 'multiSelections' ],
              filters: [
                { name: 'All Geo files', extensions: [ 'geojson', 'geowiki', 'umap' ] },
                { name: 'Geowiki', extensions: [ 'geowiki' ] },
                { name: 'GeoJSON', extensions: [ 'geojson' ] },
                { name: 'UMap', extensions: [ 'umap' ] }
              ]
            },
            (filePaths) => {
              if (!filePaths) {
                return
              }

              loadFiles(filePaths, mainWindow)
            })
          }
        },
        {
          label: 'Save',
          click () {
            ipcMain.once('save-file-result',
              (event, err, files) => {
                if (err) {
                  return console.error(err)
                }

                async.eachSeries(files, (filedata, done) => {
                  if (!filedata.path) {
                    saveAs(filedata, done)
                  } else {
                    save(filedata, done)
                  }
                })
              }
            )
            mainWindow.webContents.send('save-file')
          }
        },
        {
          label: 'Save as ...',
          click () {
            ipcMain.once('save-file-result',
              (event, err, files) => {
                if (err) {
                  return console.error(err)
                }

                async.eachSeries(files, saveAs)
              }
            )
            mainWindow.webContents.send('save-file')
          }
        },
        { role: 'quit' }
      ]
    }
  ])
  Menu.setApplicationMenu(menu)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
