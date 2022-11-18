const { app, BrowserWindow, ipcMain, Menu, nativeImage, Notification, Tray } = require('electron')
const { autoUpdater } = require('electron-updater')
const { download } = require('electron-dl')

const extract = require('extract-zip')
const fs = require('fs'), sfs = require('fs'), vfs = require('fs')
const gameDig = require('gamedig')
const http = require('http')
const log = require('electron-log')
const path = require('path')
const rimraf = require('rimraf')

const host = {
	protocol: "http://",
	domain: "mod.a3sog.org",
	port: 80,
	path: "/SOG.zip",
	gameIP: "127.0.0.1",
	gamePORT: "2302"
}

const sPath = path.join(app.getPath("userData"), 'settings.json')

let dlServerUp = true
let settings = JSON.stringify({"arma3path": "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Arma 3", "version": "-1", "last-modified": "-1"})

log.transports.file.resolvePath = () => path.join(app.getPath("userData"), 'logs/main.log')
log.log('Application Version v' + app.getVersion())

if (sfs.existsSync(sPath)) {
	settings = sfs.readFileSync(sPath)
} else {
	if (!sfs.existsSync(app.getPath("userData"))) {
		sfs.mkdirSync(app.getPath("userData"))
	}
	sfs.writeFile(sPath, settings, (e) => { if (e) throw e })
}

let settingsData = JSON.parse(settings)
let version = "-1"

const vPath = JSON.parse(settings).arma3path + "\\SOG\\Version"

if (vfs.existsSync(vPath)) {
	version = vfs.readFileSync(vPath)
}

settingsData.version = version.toString()

const hbs = require('electron-handlebars')({
	title: app.getName(),
	data: settingsData,
	installed: (version != "-1"),
	version: app.getVersion()
})

let splash = null
let tray = null
let win = null

function showNotification (NOTIF_TITLE, NOTIF_BODY) {
	const NOTIF_ICON = path.join(__dirname, 'images/favicon.ico')

	new Notification({ title: NOTIF_TITLE, body: NOTIF_BODY, icon: nativeImage.createFromPath(NOTIF_ICON) }).show()
}

function createWindow() {
	win = new BrowserWindow({
		title: 'SOG Arma 3 Launcher',
		width: 1280,
		height: 720,
		autoHideMenuBar: true,
		icon: path.join(__dirname, 'images/favicon.ico'),
		resizable: false,
		show: false,
		webPreferences: {
      nodeIntegration: true,
			preload: path.join(__dirname, 'preload.js')
		}
	})

	win.loadURL(`file://${__dirname}/index.hbs`)
	win.on('close', (event) => {		
		if (!app.isQuiting) {
			const NOTIF_TITLE = 'Minimizing App'
			const NOTIF_BODY = 'App has been minimized to tray, and is running in the background'
	
			showNotification(NOTIF_TITLE, NOTIF_BODY)

			event.preventDefault()
			win.hide()
		}
		return false
	})
}

function createSplash() {
	splash = new BrowserWindow({
		titleBarStyle: 'hidden',
		width: 256,
		height: 256,
		alwaysOnTop: true,
		frame: false,
		transparent: true
	})
  splash.loadURL(`file://${__dirname}/splash.hbs`)
}

ipcMain.on('minimize', (event) => {
	event.preventDefault()
	win.hide()
})

ipcMain.on('showNotification', (event, info) => {
	const NOTIF_TITLE = info.nTitle
	const NOTIF_BODY = info.nBody

	showNotification(NOTIF_TITLE, NOTIF_BODY)
})

ipcMain.on('download', (event, info) => {		
	settingsData.arma3path = info.arma3path
	settings = JSON.stringify(settingsData)

	sfs.writeFile(sPath, settings, (e) => { if (e) throw e })
	
	let req = http.request({method: 'HEAD', host: host.domain, port: host.port, path: host.path}, (res) => {
		if (res.headers["last-modified"] != settingsData["last-modified"] || settingsData.version == "-1") {
			log.log("Mismatch: " + res.headers["last-modified"] + " != " + settingsData["last-modified"])
			settingsData["last-modified"] = res.headers["last-modified"]
			
			if (fs.existsSync(`${info.arma3path}\\SOG`)) {
				rimraf(`${info.arma3path}\\SOG`, (e) => { if (e) throw e })
			}
			
			download(BrowserWindow.getFocusedWindow(), host.protocol + host.domain + host.path, {
				directory: `${app.getPath("userData")}\\mods`, onProgress: (state) => win.webContents.send('dlProgress', state)
			}).then(dl => {
				let file = dl.getSavePath()

				extract(file, {dir: info.arma3path}, (e) => {
					if (e) throw e
				}).then(function unlinkFile() {
					fs.unlink(file, (e) => { if (e) throw e })
				}).then(function readWriteVersion() {
					version = vfs.readFileSync(info.arma3path + "\\SOG\\Version")
					settingsData.version = version.toString()
					settings = JSON.stringify(settingsData)
					vfs.writeFile(sPath, settings, (e) => { if (e) throw e })
				}).then(function sendComplete() {
					win.webContents.send('dlComplete', {version: settingsData.version, ip: host.gameIP, port: host.gamePORT, join: info.join})
				})
			}).catch((e) => {
				if (e) log.log(e)
				dlServerUp = false
				win.webContents.send('serverDown', {download: true})
			})
		} else {
			log.log("No Mismatch Found")
			win.webContents.send('dlComplete', {version: settingsData.version, ip: host.gameIP, port: host.gamePORT, join: info.join})
		}
	})

	req.on('abort', (e) => {
		if (e) log.log(e)
		dlServerUp = false
		win.webContents.send('serverDown', {download: true})
	})

	req.on('error', (e) => {
		if (e) log.log(e)
		dlServerUp = false
		win.webContents.send('serverDown', {download: true})
	})

	req.end()
})

ipcMain.on('refresh', (event, info) => {
	gameDig.query({
		type: 'arma3',
		host: host.gameIP
	}).then((state) => {
		if (dlServerUp) {
			win.webContents.send('serverUp', state)
		} else {
			win.webContents.send('serverDown', {download: true})
		}
	}).catch((e) => {
		win.webContents.send('serverDown', {download: false})
	})
})

app.disableHardwareAcceleration()
app.whenReady().then(() => {
  createWindow()
	createSplash()

	autoUpdater.checkForUpdatesAndNotify()
}).then(function createTray() {
	const iconPath = path.join(__dirname, 'images/favicon.ico')
	tray = new Tray(nativeImage.createFromPath(iconPath))

	const contextMenu = Menu.buildFromTemplate([
		{ label: 'Restore', click: () => {
			win.show()
		}},
		{ label: 'Exit', click: () => {
			app.isQuiting = true
			app.quit()
		}}
	])
	
	tray.setToolTip('Arma 3 SOG Launcher')
	tray.setContextMenu(contextMenu)
}).then(() => {
	win.once('ready-to-show', () => {
		setTimeout(() => {
			splash.destroy()
			win.show()
		}, 3000)
	})
})

app.on('activate', () => {
	if (win === null) {
		createWindow()
	}
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

app.getFileIcon('images/favicon.ico')
app.setAppUserModelId(process.execPath)

autoUpdater.on('checking-for-update', () => {
  log.info('Checking For Update...')
})
autoUpdater.on('update-available', (info) => {
  log.info('Update Available.')
})
autoUpdater.on('update-not-available', (info) => {
  log.info('Update Not Aavailable.')
})
autoUpdater.on('error', (e) => {
  log.info('Error in Auto Updater. ' + e)
})
autoUpdater.on('download-progress', (progressTrack) => {
  log.info('\n\ndownload-progress')
  log.info(progressTrack)
})
autoUpdater.on('update-downloaded', () => {
  log.info('Update Downloaded.')
})

try {
	require('electron-reloader')(module)
} catch (_) {}