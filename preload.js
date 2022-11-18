const { contextBridge, ipcRenderer } = require('electron')

function createNotification(nTitle, nBody) {
	ipcRenderer.send('showNotification', {
		nTitle,
		nBody
	})
}

function joinGame(arma3path) {
	ipcRenderer.send('download', {
		arma3path,
		join: true
	})
}

function launchGame(arma3path) {
	ipcRenderer.send('download', {
		arma3path,
		join: false
	})
}

function openGame(ip, port, join, arma3path) {
	var child = require('child_process').execFile
	var exePath = arma3path + "\\arma3_x64.exe"
	var modList = [`-mod="!Workshop/@ace;!Workshop/@CBA_A3;SOG"`]

	if (!join) {
		var optionList = [`-noSplash -world="empty"`]
	} else {
		var optionList = [`-noSplash -world="empty" -connect=${ip} -port=${port}`]
	}

	child(exePath, [modList, optionList], (error, stdout, stderr) => {})

	ipcRenderer.send('minimize')
}

function refreshStatus() {
	ipcRenderer.send('refresh')
}

ipcRenderer.send('refresh', {})

let sogAPI = {
	createNotification,
	dlComplete: (callback) => ipcRenderer.on('dlComplete', (callback)),
	dlProgress: (callback) => ipcRenderer.on('dlProgress', (callback)),
	joinGame,
	launchGame,
	openGame,
	refreshStatus,
	serverDown: (callback) => ipcRenderer.on('serverDown', (callback)),
	serverUp: (callback) => ipcRenderer.on('serverUp', (callback)),
}

contextBridge.exposeInMainWorld('sogAPI', sogAPI)