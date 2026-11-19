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
		this.thumbnailCache = new Map()
		this.thumbnailRequests = new Map()
		this.thumbnailCheckedAt = new Map()
		this.thumbnailValidators = new Map()
		this.activeThumbnailUrls = new Set()
		this.thumbnailWarnings = new Map()
		this.lastVars = {}
		this.feedbackSignatures = new Map()
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
		let data
		let networkFailed = false
		try {
			data = await this.httpGet('/api/status')
		} catch {
			networkFailed = true
		}
		if (generation !== this.pollGeneration || sequence < this.lastAppliedSequence) return
		this.lastAppliedSequence = sequence
		try {
			if (networkFailed) {
				this.clearServerStatus()
				this.updateStatus(InstanceStatus.ConnectionFailure, 'Cannot reach Falcon Play')
				return
			}
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
					this.updateVariableDefinitions()
					this.updatePresets()
				}
				if (oldChoices !== newChoices) {
					this.updateActions()
					this.updateFeedbacks()
				}
				this.updateVariableValues(data)
				this.refreshThumbnailVariables(data)
				this.checkStatusFeedbacks()
				this.updateStatus(InstanceStatus.Ok)
			} else {
				this.clearServerStatus()
				this.updateStatus(InstanceStatus.UnknownError, data.error || 'Unknown error')
			}
		} catch (error) {
			const message = error?.message || String(error)
			this.log('error', `Status processing failed: ${message}`)
			this.updateStatus(InstanceStatus.UnknownError, message)
		}
	}

	clearServerStatus() {
		this.serverStatus = null
		this.updateVariableValues({})
		this.refreshThumbnailVariables({})
		this.checkStatusFeedbacks()
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
			const inputs = results[0].value.inputs || []
			listsChanged ||= JSON.stringify(this.inputs) !== JSON.stringify(inputs)
			this.inputs = inputs
		}
		if (results[1].status === 'fulfilled' && results[1].value.ok) {
			const functions = results[1].value.functions || []
			listsChanged ||= JSON.stringify(this.functions) !== JSON.stringify(functions)
			this.functions = functions
		}
		if (results[2].status === 'fulfilled' && results[2].value.ok) {
			const scenes = results[2].value.scenes || []
			listsChanged ||= JSON.stringify(this.scenes) !== JSON.stringify(scenes)
			this.scenes = scenes
		}
		if (results[3].status === 'fulfilled' && results[3].value.ok) {
			const videos = results[3].value.videos || []
			listsChanged ||= JSON.stringify(this.videos) !== JSON.stringify(videos)
			this.videos = videos
		}

		if (listsChanged) {
			this.updateActions()
			this.updateFeedbacks()
			this.checkStatusFeedbacks()
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
		for (const [collection, count, slotPrefix] of [
			['subitemButtons', this.subitemButtons.length, 'subitem'],
			['favoriteButtons', FAVORITE_SLOTS, 'favorite'],
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
				vars[`${prefix}thumbnail`] =
					button.available && button.thumbnailUrl
						? this.thumbnailCache.get(`${this.getBaseUrl()}${button.thumbnailUrl}`) || ''
						: ''
				vars[`${prefix}available`] = button.available ? 'Yes' : 'No'
				vars[`${prefix}playing`] = button.playing ? 'Yes' : 'No'
				vars[`${prefix}cued`] = button.cued ? 'Yes' : 'No'
				vars[`${prefix}played`] = button.played ? 'Yes' : 'No'
			}
		}
		this.publishVariableValues(vars)
	}

	publishVariableValues(vars) {
		const changed = {}
		for (const [id, value] of Object.entries(vars)) {
			if (this.lastVars[id] !== value) changed[id] = value
		}
		if (Object.keys(changed).length) {
			this.setVariableValues(changed)
			Object.assign(this.lastVars, changed)
		}
	}

	checkStatusFeedbacks() {
		const data = this.serverStatus || {}
		const companion = data.companion || {}
		const subitems = companion.subitemButtons || []
		const favorites = companion.favoriteButtons || []
		const text = (item) => getItemTextFields(item)
		const slotText = (buttons) => buttons.map((button) => text(button.available ? button : null))
		const images = (buttons) => buttons.map((button) => [!!button.available, button.thumbnailUrl || ''])
		const subitemImages = images(subitems)
		const favoriteImages = images(favorites)
		const signatures = {
			connectionStatus: !!data.ok,
			deviceStatus: ['visionMixer', 'mediaPlayer', 'soundMixer', 'videoHub'].map((id) => !!data.devices?.[id]),
			onAirInput: [
				data.activeItem?.input,
				data.activeItem?.inputName,
				data.activeItem?.itemSlug,
				data.activeItem?.name,
				this.inputs.map((input) => [input.input, input.name]),
			],
			fileServerOnline: data.fileServer?.online === true,
			rundownOnAir: !!data.rundown?.onAirUID,
			cuedItemPresent: !!data.rundown?.cuedUID,
			selectedItemPresent: !!(companion.selectedItem || companion.selectedGroupId),
			itemText: [
				['onair', 'cued', 'selected'].map((source) => text(getFeedbackItem(data, source))),
				slotText(subitems),
				slotText(favorites),
				subitemImages,
				favoriteImages,
			],
			favoriteText: [slotText(favorites), favoriteImages],
			subitemThumbnail: subitemImages,
			favoriteThumbnail: favoriteImages,
		}
		for (const [prefix, buttons] of [
			['subitem', subitems],
			['favorite', favorites],
		]) {
			for (const [suffix, field] of [
				['Available', 'available'],
				['Playing', 'playing'],
				['Cued', 'cued'],
				['Played', 'played'],
			]) {
				signatures[`${prefix}${suffix}`] = buttons.map((button) => button[field] === true)
			}
		}
		const changed = Object.entries(signatures)
			.map(([id, value]) => [id, JSON.stringify(value)])
			.filter(([id, value]) => this.feedbackSignatures.get(id) !== value)
		if (changed.length) {
			this.checkFeedbacks(...changed.map(([id]) => id))
			for (const [id, value] of changed) this.feedbackSignatures.set(id, value)
		}
	}

	refreshThumbnailVariables(data) {
		const generation = this.pollGeneration
		const base = this.getBaseUrl()
		const active = new Set(
			['subitemButtons', 'favoriteButtons'].flatMap((collection) =>
				(data.companion?.[collection] || [])
					.filter((button) => button.available && button.thumbnailUrl)
					.map((button) => `${base}${button.thumbnailUrl}`),
			),
		)
		this.activeThumbnailUrls = active
		// Keep every active image, including all 99 Favorites and configured Subitems.
		for (const cache of [
			this.thumbnailCache,
			this.thumbnailCheckedAt,
			this.thumbnailValidators,
			this.thumbnailWarnings,
		]) {
			for (const url of cache.keys()) if (!active.has(url)) cache.delete(url)
		}
		for (const key of this.thumbnailRenderCache?.keys() || []) {
			if (!active.has(key.slice(0, key.lastIndexOf(':')))) this.thumbnailRenderCache.delete(key)
		}
		for (const url of active) {
			const lastChecked = this.thumbnailCheckedAt.get(url)
			if (this.thumbnailRequests.has(url) || (lastChecked !== undefined && Date.now() - lastChecked < 15000)) continue
			this.thumbnailCheckedAt.set(url, Date.now())
			const isCurrent = () => generation === this.pollGeneration && this.activeThumbnailUrls.has(url)
			const publish = (dataUri) => {
				if (!isCurrent()) return
				const vars = {}
				const feedbacks = new Set()
				for (const [collection, prefix] of [
					['subitemButtons', 'subitem'],
					['favoriteButtons', 'favorite'],
				]) {
					for (const button of this.serverStatus?.companion?.[collection] || []) {
						const id = `${prefix}_${button.slot}_thumbnail`
						if (
							button.available &&
							`${this.getBaseUrl()}${button.thumbnailUrl}` === url &&
							this.lastVars[id] !== dataUri
						) {
							vars[id] = dataUri
							feedbacks.add(`${prefix}Thumbnail`)
							feedbacks.add('itemText')
							if (prefix === 'favorite') feedbacks.add('favoriteText')
						}
					}
				}
				this.publishVariableValues(vars)
				if (feedbacks.size) this.checkFeedbacks(...feedbacks)
			}
			const request = (async () => {
				try {
					const validators = this.thumbnailValidators.get(url) || {}
					const response = await fetch(url, { headers: validators, signal: AbortSignal.timeout(5000) })
					if (!isCurrent() || response.status === 304) return
					if (response.status === 404 || response.status === 410) {
						this.thumbnailCache.delete(url)
						this.thumbnailValidators.delete(url)
						publish('')
						return
					}
					const size = Number(response.headers.get('content-length'))
					const mime = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() || 'unknown'
					if (!response.ok || size > 1024 * 1024) return
					if (!['image/jpeg', 'image/png'].includes(mime)) {
						if (this.thumbnailWarnings.get(url) !== mime) {
							this.log('debug', `Unsupported thumbnail format: ${mime || 'unknown'}; expected JPEG or PNG`)
							this.thumbnailWarnings.set(url, mime)
						}
						this.thumbnailCache.delete(url)
						this.thumbnailValidators.delete(url)
						publish('')
						return
					}
					const bytes = Buffer.from(await response.arrayBuffer())
					if (!isCurrent() || bytes.length > 1024 * 1024) return
					const dataUri = `data:${mime};base64,${bytes.toString('base64')}`
					this.thumbnailCache.set(url, dataUri)
					this.thumbnailWarnings.delete(url)
					const nextValidators = {}
					if (response.headers.get('etag')) nextValidators['If-None-Match'] = response.headers.get('etag')
					if (response.headers.get('last-modified'))
						nextValidators['If-Modified-Since'] = response.headers.get('last-modified')
					this.thumbnailValidators.set(url, nextValidators)
					publish(dataUri)
				} catch {
					// A missing thumbnail leaves the URL available for another image source.
				}
			})().finally(() => this.thumbnailRequests.delete(url))
			this.thumbnailRequests.set(url, request)
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
		this.lastVars = {}
	}

	updatePresets() {
		UpdatePresets(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)
