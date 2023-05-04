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
	var modList = [`-mod="!Workshop/@ace;!Workshop/@CBA_A3;!Workshop/@ACE Compat - RHS AFRF;!Workshop/@ACE Compat - RHS- GREF;!Workshop/@ACE Compat - RHS- SAF;!Workshop/@ACE Compat - RHS USAF;!Workshop/@CUP Units;!Workshop/@CUP Weapons;!Workshop/@CUP ACE3 Compatibility Addon - Weapons;!Workshop/@RHSAFRF;!Workshop/@RHSGREF;!Workshop/@RHSPKL;!Workshop/@RHSSAF;!Workshop/@RHSUSAF;!Workshop/@Pythia;!Workshop/@Ghost Recon Third Person;!Workshop/@Ghost Recon CROSSCOM (HUD Only);@sog_gear;sog_client;sog_factions;sog_mod"`]

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