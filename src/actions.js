module.exports = (self) => {
	// Build dropdown choices from cached lists
	const inputChoices = self.inputs.map((inp) => ({ id: inp.input, label: inp.name }))
	const functionChoices = self.functions.map((fn) => ({ id: fn.uid, label: fn.name }))
	const sceneChoices = self.scenes.map((sc) => ({ id: sc.id, label: sc.name }))
	const videoChoices = self.videos.map((v) => {
		const name = typeof v === 'string' ? v : v.name || v.filename || String(v)
		return { id: name, label: name }
	})

	const transitionChoices = [
		{ id: 'cut', label: 'Cut' },
		{ id: 'mix', label: 'Mix' },
		{ id: 'dip', label: 'Dip' },
		{ id: 'wipe', label: 'Wipe' },
		{ id: 'sting', label: 'Sting' },
	]

	const serverChoices = [
		{ id: 'A', label: 'Server A' },
		{ id: 'B', label: 'Server B' },
		{ id: 'C', label: 'Server C' },
		{ id: 'D', label: 'Server D' },
	]

	const graphicChannelChoices = Array.from({ length: 26 }, (_, i) => {
		const letter = String.fromCharCode(65 + i)
		return { id: letter, label: `Graphic ${letter}` }
	})

	self.setActionDefinitions({
		// --- Switch Input / Camera ---
		switchInput: {
			name: 'Switch Input (Program)',
			description: 'Switch a vision mixer input to Program (on-air)',
			options: [
				{
					type: 'dropdown',
					id: 'input',
					label: 'Input',
					choices: inputChoices,
					default: inputChoices[0]?.id ?? 0,
				},
				{
					type: 'dropdown',
					id: 'transitionStyle',
					label: 'Transition Style',
					choices: transitionChoices,
					default: 'cut',
				},
				{
					type: 'number',
					id: 'transitionDuration',
					label: 'Transition Duration (frames)',
					default: 0,
					min: 0,
					max: 250,
				},
			],
			callback: async (action) => {
				try {
					const result = await self.httpPost('/api/visionMixer/onAir', {
						input: action.options.input,
						transitionStyle: action.options.transitionStyle,
						transitionDuration: action.options.transitionDuration,
					})
					if (!result.ok) {
						self.log('error', `Switch Input failed: ${result.error}`)
					}
				} catch (err) {
					self.log('error', `Switch Input error: ${err.message}`)
				}
			},
		},

		// --- Set Input to Preview ---
		setInputPreview: {
			name: 'Set Input to Preview',
			description: 'Set a vision mixer input to Preview (PVW)',
			options: [
				{
					type: 'dropdown',
					id: 'input',
					label: 'Input',
					choices: inputChoices,
					default: inputChoices[0]?.id ?? 0,
				},
			],
			callback: async (action) => {
				try {
					const result = await self.httpPost('/api/visionMixer/preview', {
						input: action.options.input,
					})
					if (!result.ok) {
						self.log('error', `Set Input to Preview failed: ${result.error}`)
					}
				} catch (err) {
					self.log('error', `Set Input to Preview error: ${err.message}`)
				}
			},
		},

		// --- Run Function ---
		runFunction: {
			name: 'Run Function',
			description: 'Execute a Falcon Play function/macro',
			options: [
				{
					type: 'dropdown',
					id: 'functionUid',
					label: 'Function',
					choices: functionChoices,
					default: functionChoices[0]?.id ?? '',
				},
			],
			callback: async (action) => {
				try {
					const result = await self.httpPost('/api/function/run', {
						functionUid: action.options.functionUid,
					})
					if (!result.ok) {
						self.log('error', `Run Function failed: ${result.error}`)
					}
				} catch (err) {
					self.log('error', `Run Function error: ${err.message}`)
				}
			},
		},

		// --- Play Graphic Scene ---
		playScene: {
			name: 'Play Graphic Scene',
			description: 'Play a saved graphic scene (CasparCG template)',
			options: [
				{
					type: 'dropdown',
					id: 'sceneId',
					label: 'Scene',
					choices: sceneChoices,
					default: sceneChoices[0]?.id ?? '',
				},
			],
			callback: async (action) => {
				try {
					const result = await self.httpPost('/api/scene/play', {
						sceneId: action.options.sceneId,
					})
					if (!result.ok) {
						self.log('error', `Play Scene failed: ${result.error}`)
					}
				} catch (err) {
					self.log('error', `Play Scene error: ${err.message}`)
				}
			},
		},

		// --- Play Video ---
		playVideo: {
			name: 'Play Video',
			description: 'Play a video file on a CasparCG server',
			options: [
				{
					type: 'dropdown',
					id: 'videofile',
					label: 'Video File',
					choices: videoChoices,
					default: videoChoices[0]?.id ?? '',
				},
				{
					type: 'dropdown',
					id: 'server',
					label: 'Server Channel',
					choices: serverChoices,
					default: 'A',
				},
				{
					type: 'number',
					id: 'layer',
					label: 'Layer',
					default: 1,
					min: 1,
					max: 100,
				},
			],
			callback: async (action) => {
				try {
					const result = await self.httpPost('/api/media/play', {
						videofile: action.options.videofile,
						server: action.options.server,
						layer: action.options.layer,
					})
					if (!result.ok) {
						self.log('error', `Play Video failed: ${result.error}`)
					}
				} catch (err) {
					self.log('error', `Play Video error: ${err.message}`)
				}
			},
		},

		// --- Play Video (Simple) ---
		playVideoSimple: {
			name: 'Play Video (Simple)',
			description: 'Quick play of a video file on Server A, Layer 1',
			options: [
				{
					type: 'dropdown',
					id: 'videofile',
					label: 'Video File',
					choices: videoChoices,
					default: videoChoices[0]?.id ?? '',
				},
			],
			callback: async (action) => {
				try {
					const result = await self.httpPost('/api/media/play', {
						videofile: action.options.videofile,
						server: 'A',
						layer: 1,
						duration: 0,
					})
					if (!result.ok) {
						self.log('error', `Play Video (Simple) failed: ${result.error}`)
					}
				} catch (err) {
					self.log('error', `Play Video (Simple) error: ${err.message}`)
				}
			},
		},

		// --- Load Video (Preview/Cue) ---
		loadVideo: {
			name: 'Load Video',
			description: 'Cue a video without playing',
			options: [
				{
					type: 'dropdown',
					id: 'videofile',
					label: 'Video File',
					choices: videoChoices,
					default: videoChoices[0]?.id ?? '',
				},
				{
					type: 'dropdown',
					id: 'server',
					label: 'Server Channel',
					choices: serverChoices,
					default: 'A',
				},
				{
					type: 'number',
					id: 'layer',
					label: 'Layer',
					default: 1,
					min: 1,
					max: 100,
				},
			],
			callback: async (action) => {
				try {
					const result = await self.httpPost('/api/media/load', {
						videofile: action.options.videofile,
						server: action.options.server,
						layer: action.options.layer,
					})
					if (!result.ok) {
						self.log('error', `Load Video failed: ${result.error}`)
					}
				} catch (err) {
					self.log('error', `Load Video error: ${err.message}`)
				}
			},
		},

		// --- Stop Video ---
		stopVideo: {
			name: 'Stop Video',
			description: 'Stop a video on a server/layer',
			options: [
				{
					type: 'dropdown',
					id: 'server',
					label: 'Server Channel',
					choices: serverChoices,
					default: 'A',
				},
				{
					type: 'number',
					id: 'layer',
					label: 'Layer',
					default: 1,
					min: 1,
					max: 100,
				},
			],
			callback: async (action) => {
				try {
					const result = await self.httpPost('/api/media/stop', {
						server: action.options.server,
						layer: action.options.layer,
					})
					if (!result.ok) {
						self.log('error', `Stop Video failed: ${result.error}`)
					}
				} catch (err) {
					self.log('error', `Stop Video error: ${err.message}`)
				}
			},
		},

		// --- Clear Video ---
		clearVideo: {
			name: 'Clear Video',
			description: 'Clear a video from a server/layer (remove completely)',
			options: [
				{
					type: 'dropdown',
					id: 'server',
					label: 'Server Channel',
					choices: serverChoices,
					default: 'A',
				},
				{
					type: 'number',
					id: 'layer',
					label: 'Layer',
					default: 1,
					min: 1,
					max: 100,
				},
			],
			callback: async (action) => {
				try {
					const result = await self.httpPost('/api/media/clear', {
						server: action.options.server,
						layer: action.options.layer,
					})
					if (!result.ok) {
						self.log('error', `Clear Video failed: ${result.error}`)
					}
				} catch (err) {
					self.log('error', `Clear Video error: ${err.message}`)
				}
			},
		},

		// --- Stop Graphic ---
		stopGraphic: {
			name: 'Stop Graphic',
			description: 'Stop (take off) a graphic on a graphic engine channel/layer',
			options: [
				{
					type: 'dropdown',
					id: 'graphicChannel',
					label: 'Graphic Engine',
					choices: graphicChannelChoices,
					default: 'A',
				},
				{
					type: 'number',
					id: 'graphicLayer',
					label: 'Layer',
					default: 1,
					min: 1,
					max: 100,
				},
			],
			callback: async (action) => {
				try {
					const result = await self.httpPost('/api/scene/stop', {
						graphicChannel: action.options.graphicChannel,
						graphicLayer: action.options.graphicLayer,
					})
					if (!result.ok) {
						self.log('error', `Stop Graphic failed: ${result.error}`)
					}
				} catch (err) {
					self.log('error', `Stop Graphic error: ${err.message}`)
				}
			},
		},

		// --- Clear Graphic ---
		clearGraphic: {
			name: 'Clear Graphic',
			description: 'Clear (remove completely) a graphic from a graphic engine channel/layer',
			options: [
				{
					type: 'dropdown',
					id: 'graphicChannel',
					label: 'Graphic Engine',
					choices: graphicChannelChoices,
					default: 'A',
				},
				{
					type: 'number',
					id: 'graphicLayer',
					label: 'Layer',
					default: 1,
					min: 1,
					max: 100,
				},
			],
			callback: async (action) => {
				try {
					const result = await self.httpPost('/api/scene/clear', {
						graphicChannel: action.options.graphicChannel,
						graphicLayer: action.options.graphicLayer,
					})
					if (!result.ok) {
						self.log('error', `Clear Graphic failed: ${result.error}`)
					}
				} catch (err) {
					self.log('error', `Clear Graphic error: ${err.message}`)
				}
			},
		},

		// --- Stop All Graphic Layers ---
		stopGraphicAll: {
			name: 'Stop All Graphic Layers',
			description: 'Stop (take off) all layers on a graphic engine channel',
			options: [
				{
					type: 'dropdown',
					id: 'graphicChannel',
					label: 'Graphic Engine',
					choices: graphicChannelChoices,
					default: 'A',
				},
			],
			callback: async (action) => {
				try {
					const result = await self.httpPost('/api/scene/stop', {
						graphicChannel: action.options.graphicChannel,
						graphicLayer: -1,
					})
					if (!result.ok) {
						self.log('error', `Stop All Graphic Layers failed: ${result.error}`)
					}
				} catch (err) {
					self.log('error', `Stop All Graphic Layers error: ${err.message}`)
				}
			},
		},

		// --- Clear All Graphic Layers ---
		clearGraphicAll: {
			name: 'Clear All Graphic Layers',
			description: 'Clear all layers on a graphic engine channel',
			options: [
				{
					type: 'dropdown',
					id: 'graphicChannel',
					label: 'Graphic Engine',
					choices: graphicChannelChoices,
					default: 'A',
				},
			],
			callback: async (action) => {
				try {
					const result = await self.httpPost('/api/scene/clear', {
						graphicChannel: action.options.graphicChannel,
						graphicLayer: -1,
					})
					if (!result.ok) {
						self.log('error', `Clear All Graphic Layers failed: ${result.error}`)
					}
				} catch (err) {
					self.log('error', `Clear All Graphic Layers error: ${err.message}`)
				}
			},
		},

		// --- Take Next (Rundown) ---
		takeNext: {
			name: 'Take Next',
			description: 'Take the cued item on-air (rundown advance)',
			options: [],
			callback: async () => {
				try {
					const result = await self.httpPost('/api/rundown/take', {})
					if (!result.ok) {
						self.log('error', `Take Next failed: ${result.error}`)
					}
				} catch (err) {
					self.log('error', `Take Next error: ${err.message}`)
				}
			},
		},
	})
}
