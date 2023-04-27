const brandLabel = document.getElementById('brandLabel')
const btnCollapse = document.getElementById('btnCollapse')
const btnCtl = document.getElementById('btnCtl')
const btnJoin = document.getElementById('btnJoin')
const player = document.getElementById('audioPlayer')

let isPlaying = false
let isCollapsed = true

player.volume = 0.05

function join() {
	const nTitle = 'Joining Server'
	const nBody = 'App has been minimized to tray, and is running in the background'

	let arma3path = $('#arma3path').val()
	
	window.sogAPI.joinGame(arma3path)
	window.sogAPI.createNotification(nTitle, nBody)
}

function launch() {
	const nTitle = 'Launching Game'
	const nBody = 'App has been minimized to tray, and is running in the background'

	let arma3path = $('#arma3path').val()

	window.sogAPI.launchGame(arma3path)
	window.sogAPI.createNotification(nTitle, nBody)
}

function refreshStatus() {
	window.sogAPI.refreshStatus()
}

function toggleCollapse() {
	if (!isCollapsed) {
		isCollapsed = true
		brandLabel.classList.add("brand-label-default")
		brandLabel.classList.remove("brand-label")
		bg.classList.add("bg-default")
		bg.classList.remove("bg")
		content.classList.add("content-default")
		content.classList.remove("content")
		sidebar.classList.add("sidebar-default")
		sidebar.classList.remove("sidebar")
		btnCollapse.innerHTML = `<i class="fas fa-cog fa-2x"></i>`
	} else {
		isCollapsed = false
		brandLabel.classList.add("brand-label")
		brandLabel.classList.remove("brand-label-default")
		bg.classList.add("bg")
		bg.classList.remove("bg-default")
		content.classList.add("content")
		content.classList.remove("content-default")
		sidebar.classList.add("sidebar")
		sidebar.classList.remove("sidebar-default")
		btnCollapse.innerHTML = `<i class="fas fa-times fa-2x"></i>`
	}
}

function togglePlay() {
	if (!isPlaying) {
		isPlaying = true
		player.play()
		player.volume = 0.05
		btnCtl.innerHTML = `<i class="fas fa-volume fa-2x"></i>`
	} else {
		isPlaying = false
		player.pause()
		btnCtl.innerHTML = `<i class="fas fa-volume-mute fa-2x"></i>`	
	}
}

window.sogAPI.dlComplete((event, data) => {
	var arma3path = $('#arma3path').val()
	
	$( "#dlProgBar" ).hide()
	$( "#dlProgStatus" ).text("Download Completed. You now have mod version v" + data.version)
	$( "#version" ).text(data.version)

	window.sogAPI.openGame(data.ip, data.port, data.join, arma3path)
})

window.sogAPI.dlProgress((event, state) => {
	$( "#dlProg" ).show()
	$( "#dlProgStatus" ).text("Downloading...")
	
	const cleanProgressInPercentages = Math.floor(state.percent * 100)
	
	if (cleanProgressInPercentages <= 100) {
		$( "#dlProgBar" ).css("width", `${cleanProgressInPercentages.toFixed(1)}%`)
	}
})

window.sogAPI.serverDown((event, data) => {
	if (data.download) {
		$( "#appServerStatus" ).html(`<i class="fas fa-circle fa-xs icon-red"></i> Mod Download Server is down`)
	} else {
		$( "#appGameStatus" ).html(`<i class="fas fa-circle fa-xs icon-red"></i> Server is down`)
		$( "#btnJoin" ).html(`<button class="btn-danger" title="Server Offline">Join Server</button>`)
	}
})

window.sogAPI.serverUp((event, data) => {
	if ((`${data.raw.numplayers}` > 1) || (`${data.raw.numplayers}` < 1)) {
		$( "#appGameStatus" ).html(`<i class="fas fa-circle fa-xs icon-sky"></i> ${data.name} (${data.raw.numplayers} Players)`)
		$( "#btnJoin" ).html(`<button class="btn btn-block" onclick="join()">Join Server</button>`)
	} else {
		$( "#appGameStatus" ).html(`<i class="fas fa-circle fa-xs icon-sky"></i> ${data.name} (${data.raw.numplayers} Player)`)
		$( "#btnJoin" ).html(`<button class="btn btn-block" onclick="join()">Join Server</button>`)
	}
})