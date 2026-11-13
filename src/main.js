const { SLOT_COUNT: FAVORITE_SLOTS } = require('./favorites')
const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const UpdatePresets = require('./presets')
const { getFeedbackItem, getItemTextFields } = require('./itemText')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)

		// Cached lists for dropdown choices
		this.inputs = []
		this.functions = []
		this.scenes = []
		this.videos = []
		this.subitemButtons = []
		this.favoriteButtons = []
		this.favoriteThumbnailPublished = []
		this.thumbnailCache = new Map()
		this.thumbnailRequests = new Map()
		this.thumbnailCheckedAt = new Map()
		this.thumbnailValidators = new Map()
		this.thumbnailPublished = []
		this.pollGeneration = 0
		this.statusSequence = 0
		this.lastAppliedSequence = 0

		// Status data
		this.serverStatus = null
	}

	async init(config) {
		this.config = config

		this.updateVariableDefinitions()
		this.updateFeedbacks()
		this.updateActions()
		this.updatePresets()

		this.startPolling()
	}

	async destroy() {
		this.stopPolling()
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.config = config
		this.stopPolling()
		this.clearServerStatus()
		this.updateActions()
		this.updateFeedbacks()
		this.updatePresets()
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

	async httpGet(path) {
		const res = await fetch(`${this.getBaseUrl()}${path}`, { signal: AbortSignal.timeout(5000) })
		return res.json()
	}

	async httpPost(path, body) {
		const res = await fetch(`${this.getBaseUrl()}${path}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(5000),
		})
		return res.json()
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
		this.pollGeneration++
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
		const generation = this.pollGeneration
		const sequence = ++this.statusSequence
		try {
			const data = await this.httpGet('/api/status')
			if (generation !== this.pollGeneration || sequence < this.lastAppliedSequence) return
			this.lastAppliedSequence = sequence
			if (data.ok) {
				this.serverStatus = data
				const buttons = data.companion?.subitemButtons || []
				const oldChoices = JSON.stringify(
					[this.subitemButtons, this.favoriteButtons].map((buttons) =>
						buttons.map((button) => [button.slot, button.name]),
					),
				)
				const favoriteButtons = data.companion?.favoriteButtons || []
				const newChoices = JSON.stringify(
					[buttons, favoriteButtons].map((buttons) => buttons.map((button) => [button.slot, button.name])),
				)
				const countChanged = buttons.length !== this.subitemButtons.length
				this.subitemButtons = buttons
				this.favoriteButtons = favoriteButtons
				if (countChanged) {
					this.thumbnailPublished = []
					this.updateVariableDefinitions()
				}
				if (oldChoices !== newChoices) {
					this.updateActions()
					this.updateFeedbacks()
					this.updatePresets()
				}
				this.updateStatus(InstanceStatus.Ok)
				this.updateVariableValues(data)
				this.refreshThumbnailVariables(data)
				this.checkFeedbacks()
			} else {
				this.clearServerStatus()
				this.updateStatus(InstanceStatus.UnknownError, data.error || 'Unknown error')
			}
		} catch {
			if (generation !== this.pollGeneration || sequence < this.lastAppliedSequence) return
			this.lastAppliedSequence = sequence
			this.clearServerStatus()
			this.updateStatus(InstanceStatus.ConnectionFailure, 'Cannot reach Falcon Play')
		}
	}

	clearServerStatus() {
		this.serverStatus = null
		this.updateVariableValues({})
		this.checkFeedbacks()
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
			this.updateFeedbacks()
		}
	}

	updateVariableValues(data) {
		const companion = data.companion || {}
		const vars = {
			server_connected: data.ok ? 'Yes' : 'No',
			server_version: data.version || '',
			rundown_id: data.rundown?.id || '',
			rundown_name: data.rundown?.name || '',
			rundown_onair_uid: data.rundown?.onAirUID || '',
			rundown_cued_uid: data.rundown?.cuedUID || '',
			onair_item: data.activeItem?.name || data.activeItem?.label || '',
			onair_item_uid: data.activeItem?.uid || '',
			onair_item_type: data.activeItem?.type || '',
			cued_item: data.cuedItem?.name || data.cuedItem?.label || '',
			cued_item_uid: data.cuedItem?.uid || '',
			cued_item_type: data.cuedItem?.type || '',
			selected_item: companion.selectedItem?.name || '',
			selected_item_uid: companion.selectedItem?.uid || '',
			selected_item_type: companion.selectedItem?.type || '',
			selected_story_id: companion.selectedGroupId || '',
			subitem_button_count: companion.subitemButtons?.length || 0,
			favorite_count: companion.favoriteCount || 0,
			favorites_revision: companion.favoritesRevision || 0,
			vision_mixer_connected: data.devices?.visionMixer ? 'Yes' : 'No',
			media_player_connected: data.devices?.mediaPlayer ? 'Yes' : 'No',
			sound_mixer_connected: data.devices?.soundMixer ? 'Yes' : 'No',
			video_hub_connected: data.devices?.videoHub ? 'Yes' : 'No',
			file_server_online: data.fileServer?.online ? 'Yes' : 'No',
			file_server_ip: data.fileServer?.ip || '',
			file_server_version: data.fileServer?.version || '',
		}
		for (const [prefix, source] of [
			['onair_item', 'onair'],
			['cued_item', 'cued'],
			['selected_item', 'selected'],
		]) {
			const text = getItemTextFields(getFeedbackItem(data, source))
			vars[`${prefix}_first_variable_name`] = text.firstVariableName
			vars[`${prefix}_first_variable_value`] = text.firstVariableValue
			vars[`${prefix}_second_variable_name`] = text.secondVariableName
			vars[`${prefix}_second_variable_value`] = text.secondVariableValue
			vars[`${prefix}_display_text`] = text.displayText
		}
		for (const [collection, count, slotPrefix, published] of [
			['subitemButtons', this.subitemButtons.length, 'subitem', this.thumbnailPublished],
			['favoriteButtons', FAVORITE_SLOTS, 'favorite', this.favoriteThumbnailPublished],
		]) {
			for (let index = 0; index < count; index++) {
				const button = companion[collection]?.[index] || {}
				const prefix = `${slotPrefix}_${index + 1}_`
				const text = getItemTextFields(button.available ? button : null)
				vars[`${prefix}first_variable_name`] = text.firstVariableName
				vars[`${prefix}first_variable_value`] = text.firstVariableValue
				vars[`${prefix}second_variable_name`] = text.secondVariableName
				vars[`${prefix}second_variable_value`] = text.secondVariableValue
				vars[`${prefix}display_text`] = text.displayText
				vars[`${prefix}name`] = button.name || ''
				vars[`${prefix}uid`] = button.uid || ''
				vars[`${prefix}type`] = button.type || ''
				vars[`${prefix}thumbnail_url`] = button.thumbnailUrl ? `${this.getBaseUrl()}${button.thumbnailUrl}` : ''
				const thumbnail = button.thumbnailUrl
					? this.thumbnailCache.get(`${this.getBaseUrl()}${button.thumbnailUrl}`) || ''
					: ''
				if (published[index] !== thumbnail) {
					vars[`${prefix}thumbnail`] = thumbnail
					published[index] = thumbnail
				}
				vars[`${prefix}available`] = button.available ? 'Yes' : 'No'
				vars[`${prefix}playing`] = button.playing ? 'Yes' : 'No'
				vars[`${prefix}cued`] = button.cued ? 'Yes' : 'No'
				vars[`${prefix}played`] = button.played ? 'Yes' : 'No'
			}
		}
		this.setVariableValues(vars)
	}

	refreshThumbnailVariables(data) {
		const generation = this.pollGeneration
		for (const [collection, prefix, published] of [
			['subitemButtons', 'subitem', this.thumbnailPublished],
			['favoriteButtons', 'favorite', this.favoriteThumbnailPublished],
		]) {
			for (const button of data.companion?.[collection] || []) {
				if (!button.thumbnailUrl || !button.available) continue
				const url = `${this.getBaseUrl()}${button.thumbnailUrl}`
				if (this.thumbnailRequests.has(url) || Date.now() - (this.thumbnailCheckedAt.get(url) || 0) < 15000) continue
				this.thumbnailCheckedAt.set(url, Date.now())
				if (this.thumbnailCheckedAt.size > 64)
					this.thumbnailCheckedAt.delete(this.thumbnailCheckedAt.keys().next().value)
				const publish = (dataUri) => {
					const current = this.serverStatus?.companion?.[collection]?.[button.slot - 1]
					if (
						generation !== this.pollGeneration ||
						url !== `${this.getBaseUrl()}${button.thumbnailUrl}` ||
						!current?.available ||
						current.thumbnailUrl !== button.thumbnailUrl ||
						published[button.slot - 1] === dataUri
					)
						return
					published[button.slot - 1] = dataUri
					this.setVariableValues({ [`${prefix}_${button.slot}_thumbnail`]: dataUri })
					this.checkFeedbacks('subitemThumbnail', 'itemText', 'favoriteThumbnail', 'favoriteText')
				}
				const request = (async () => {
					try {
						const validators = this.thumbnailValidators.get(url) || {}
						const response = await fetch(url, { headers: validators, signal: AbortSignal.timeout(5000) })
						if (response.status === 304) return
						if (response.status === 404 || response.status === 410) {
							this.thumbnailCache.delete(url)
							this.thumbnailValidators.delete(url)
							publish('')
							return
						}
						const size = Number(response.headers.get('content-length'))
						const mime = response.headers.get('content-type')?.split(';')[0]
						if (!response.ok || !['image/jpeg', 'image/png', 'image/webp'].includes(mime) || size > 1024 * 1024) return
						const bytes = Buffer.from(await response.arrayBuffer())
						if (bytes.length > 1024 * 1024) return
						const dataUri = `data:${mime};base64,${bytes.toString('base64')}`
						this.thumbnailCache.set(url, dataUri)
						const nextValidators = {}
						if (response.headers.get('etag')) nextValidators['If-None-Match'] = response.headers.get('etag')
						if (response.headers.get('last-modified'))
							nextValidators['If-Modified-Since'] = response.headers.get('last-modified')
						this.thumbnailValidators.set(url, nextValidators)
						if (this.thumbnailCache.size > 64) {
							const oldest = this.thumbnailCache.keys().next().value
							this.thumbnailCache.delete(oldest)
							this.thumbnailValidators.delete(oldest)
						}
						publish(dataUri)
					} catch {
						// A missing thumbnail leaves the URL available for another image source.
					} finally {
						this.thumbnailRequests.delete(url)
					}
				})()
				this.thumbnailRequests.set(url, request)
			}
		}
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

	updatePresets() {
		UpdatePresets(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
