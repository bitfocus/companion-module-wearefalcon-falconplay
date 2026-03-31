const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const http = require('http')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Cached lists for dropdown choices
		this.inputs = []
		this.functions = []
		this.scenes = []
		this.videos = []

		// Status data
		this.serverStatus = null
	}

	async init(config) {
		this.config = config

		this.updateVariableDefinitions()
		this.updateFeedbacks()
		this.updateActions()

		this.startPolling()
	}

	async destroy() {
		this.stopPolling()
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.config = config
		this.stopPolling()
		this.updateActions()
		this.startPolling()
	}

	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Falcon Play Server IP',
				width: 8,
				regex: Regex.IP,
				default: '127.0.0.1',
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Port',
				width: 4,
				regex: Regex.PORT,
				default: '80',
			},
		]
	}

	// --- HTTP helpers ---

	getBaseUrl() {
		const host = this.config.host || '127.0.0.1'
		const port = this.config.port || '80'
		return `http://${host}:${port}`
	}

	httpGet(path) {
		return new Promise((resolve, reject) => {
			const url = `${this.getBaseUrl()}${path}`
			http.get(url, { timeout: 5000 }, (res) => {
				let data = ''
				res.on('data', (chunk) => (data += chunk))
				res.on('end', () => {
					try {
						resolve(JSON.parse(data))
					} catch {
						reject(new Error('Invalid JSON response'))
					}
				})
			}).on('error', (err) => reject(err))
		})
	}

	httpPost(path, body) {
		return new Promise((resolve, reject) => {
			const url = new URL(`${this.getBaseUrl()}${path}`)
			const payload = JSON.stringify(body)
			const options = {
				hostname: url.hostname,
				port: url.port,
				path: url.pathname,
				method: 'POST',
				timeout: 5000,
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': Buffer.byteLength(payload),
				},
			}
			const req = http.request(options, (res) => {
				let data = ''
				res.on('data', (chunk) => (data += chunk))
				res.on('end', () => {
					try {
						resolve(JSON.parse(data))
					} catch {
						reject(new Error('Invalid JSON response'))
					}
				})
			})
			req.on('error', (err) => reject(err))
			req.write(payload)
			req.end()
		})
	}

	// --- Polling ---

	startPolling() {
		this.stopPolling()

		// Poll status every 2 seconds
		this.pollStatusTimer = setInterval(() => this.pollStatus(), 2000)
		// Refresh lists every 10 seconds
		this.pollListsTimer = setInterval(() => this.refreshLists(), 10000)

		// Initial fetch
		this.pollStatus()
		this.refreshLists()
	}

	stopPolling() {
		if (this.pollStatusTimer) {
			clearInterval(this.pollStatusTimer)
			delete this.pollStatusTimer
		}
		if (this.pollListsTimer) {
			clearInterval(this.pollListsTimer)
			delete this.pollListsTimer
		}
	}

	async pollStatus() {
		try {
			const data = await this.httpGet('/api/status')
			if (data.ok) {
				this.serverStatus = data
				this.updateStatus(InstanceStatus.Ok)
				this.updateVariableValues(data)
				this.checkFeedbacks('connectionStatus', 'deviceStatus', 'onAirInput')
			} else {
				this.updateStatus(InstanceStatus.UnknownError, data.error || 'Unknown error')
			}
		} catch {
			this.serverStatus = null
			this.updateStatus(InstanceStatus.ConnectionFailure, 'Cannot reach Falcon Play')
			this.checkFeedbacks('connectionStatus', 'deviceStatus', 'onAirInput')
		}
	}

	async refreshLists() {
		const results = await Promise.allSettled([
			this.httpGet('/api/inputs'),
			this.httpGet('/api/functions'),
			this.httpGet('/api/scenes'),
			this.httpGet('/api/media/videos'),
		])

		let listsChanged = false

		if (results[0].status === 'fulfilled' && results[0].value.ok) {
			this.inputs = results[0].value.inputs || []
			listsChanged = true
		}
		if (results[1].status === 'fulfilled' && results[1].value.ok) {
			this.functions = results[1].value.functions || []
			listsChanged = true
		}
		if (results[2].status === 'fulfilled' && results[2].value.ok) {
			this.scenes = results[2].value.scenes || []
			listsChanged = true
		}
		if (results[3].status === 'fulfilled' && results[3].value.ok) {
			this.videos = results[3].value.videos || []
			listsChanged = true
		}

		if (listsChanged) {
			this.updateActions()
		}
	}

	updateVariableValues(data) {
		const vars = {
			server_version: data.version || '',
			rundown_name: data.rundown?.name || '',
			onair_item: data.activeItem?.name || data.activeItem?.label || '',
			cued_item: data.cuedItem?.name || data.cuedItem?.label || '',
			vision_mixer_connected: data.devices?.visionMixer ? 'Yes' : 'No',
			media_player_connected: data.devices?.mediaPlayer ? 'Yes' : 'No',
			sound_mixer_connected: data.devices?.soundMixer ? 'Yes' : 'No',
			video_hub_connected: data.devices?.videoHub ? 'Yes' : 'No',
			file_server_online: data.fileServer?.online ? 'Yes' : 'No',
		}
		this.setVariableValues(vars)
	}

	// --- Update definitions ---

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)