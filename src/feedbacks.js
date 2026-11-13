const Favorites = require('./favorites')
const { combineRgb } = require('@companion-module/base')
const { buildInputChoices, matchesActiveInput } = require('./inputSelection')
const { getFeedbackItem, formatItemText } = require('./itemText')
const { getSubitemThumbnail } = require('./thumbnails')

module.exports = (self) => {
	const inputChoices = buildInputChoices(self.inputs)
	const slotChoices = self.subitemButtons?.length
		? self.subitemButtons.map((button) => ({ id: button.slot, label: `${button.label}: ${button.name || 'Empty'}` }))
		: [{ id: 0, label: 'No subitem buttons configured' }]
	const greenStyle = { bgcolor: combineRgb(0, 200, 0), color: combineRgb(255, 255, 255) }
	const redStyle = { bgcolor: combineRgb(200, 0, 0), color: combineRgb(255, 255, 255) }
	const slotOptions = [
		{ type: 'dropdown', id: 'slot', label: 'Subitem Button', choices: slotChoices, default: slotChoices[0].id },
	]
	const thumbnailLayout = {
		type: 'dropdown',
		id: 'thumbnailLayout',
		label: 'Thumbnail layout',
		default: 'aboveText',
		choices: [
			{ id: 'aboveText', label: 'Image Above Text' },
			{ id: 'background', label: 'Image Behind Text' },
		],
	}
	const slotState = (feedback, field) => {
		const slot = Number(feedback.options.slot)
		return self.serverStatus?.companion?.subitemButtons?.[slot - 1]?.[field] === true
	}

	const definitions = {
		...Favorites.feedbacks(self),
		subitemThumbnail: {
			type: 'advanced',
			name: 'Subitem Thumbnail',
			description: 'Show the current subitem thumbnail on this button. Combine with Item Text for a dynamic label.',
			options: [slotOptions[0], thumbnailLayout],
			callback: (feedback) =>
				getSubitemThumbnail(self, feedback.options.slot, feedback.options.thumbnailLayout || 'aboveText'),
		},
		itemText: {
			type: 'advanced',
			name: 'Item Text',
			description: 'Show the item name or graphic variables on this button. Empty or unavailable items clear the text.',
			options: [
				{
					type: 'dropdown',
					id: 'source',
					label: 'Item',
					default: 'onair',
					choices: [
						{ id: 'onair', label: 'On-Air Rundown Item' },
						{ id: 'cued', label: 'Cued Rundown Item' },
						{ id: 'selected', label: 'Selected Rundown Item' },
						{ id: 'subitem', label: 'Subitem Button' },
						{ id: 'favorite', label: 'Favorite Button' },
					],
				},
				{
					...slotOptions[0],
					isVisibleExpression: '$(options:source) == "subitem"',
				},
				{ ...Favorites.options(self)[0], id: 'favoriteSlot', isVisibleExpression: '$(options:source) == "favorite"' },
				{
					type: 'dropdown',
					id: 'format',
					label: 'Text',
					default: 'auto',
					choices: [
						{ id: 'none', label: 'No Text' },
						{ id: 'auto', label: 'First Graphic Variable, Otherwise Item Name' },
						{ id: 'firstAndSecondVariableOrName', label: 'First and Second Graphic Variable, Otherwise Item Name' },
						{ id: 'name', label: 'Item Name' },
						{ id: 'firstVariable', label: 'First Graphic Variable' },
						{ id: 'secondVariable', label: 'Second Graphic Variable' },
						{ id: 'firstAndSecondVariable', label: 'First and Second Graphic Variable' },
						{ id: 'nameAndVariable', label: 'Item Name and First Graphic Variable' },
						{ id: 'nameAndSecondVariable', label: 'Item Name and Second Graphic Variable' },
						{ id: 'nameAndFirstAndSecondVariable', label: 'Item Name and First and Second Graphic Variable' },
					],
				},
				{
					type: 'checkbox',
					id: 'showThumbnail',
					label: 'Show Thumbnail',
					default: false,
					isVisibleExpression: '$(options:source) == "subitem" || $(options:source) == "favorite"',
				},
				{
					...thumbnailLayout,
					isVisibleExpression:
						'($(options:source) == "subitem" || $(options:source) == "favorite") && $(options:showThumbnail)',
				},
			],
			callback: (feedback) => ({
				...(['subitem', 'favorite'].includes(feedback.options.source) && feedback.options.showThumbnail
					? getSubitemThumbnail(
							self,
							feedback.options.source === 'favorite' ? feedback.options.favoriteSlot : feedback.options.slot,
							feedback.options.thumbnailLayout || 'aboveText',
							feedback.options.source === 'favorite' ? 'favoriteButtons' : 'subitemButtons',
						)
					: {}),
				text: formatItemText(
					getFeedbackItem(
						self.serverStatus,
						feedback.options.source,
						feedback.options.source === 'favorite' ? feedback.options.favoriteSlot : feedback.options.slot,
					),
					feedback.options.format,
				),
			}),
		},
		connectionStatus: {
			type: 'boolean',
			name: 'Server Connected',
			description: 'Changes style when Falcon Play server is reachable',
			defaultStyle: {
				bgcolor: combineRgb(0, 200, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				return self.serverStatus !== null
			},
		},

		deviceStatus: {
			type: 'boolean',
			name: 'Device Connected',
			description: 'Changes style when a specific device is connected',
			defaultStyle: {
				bgcolor: combineRgb(0, 200, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					id: 'device',
					label: 'Device',
					choices: [
						{ id: 'visionMixer', label: 'Vision Mixer' },
						{ id: 'mediaPlayer', label: 'Media Player' },
						{ id: 'soundMixer', label: 'Sound Mixer' },
						{ id: 'videoHub', label: 'Video Hub' },
					],
					default: 'visionMixer',
				},
			],
			callback: (feedback) => {
				const device = feedback.options.device
				return self.serverStatus?.devices?.[device] === true
			},
		},

		onAirInput: {
			type: 'boolean',
			name: 'Input On Air',
			description: 'Changes style when a specific input is currently on-air',
			defaultStyle: {
				bgcolor: combineRgb(200, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					id: 'input',
					label: 'Input',
					choices: inputChoices,
					default: inputChoices[0]?.id ?? '',
				},
			],
			callback: (feedback) => {
				const activeItem = self.serverStatus?.activeItem
				if (!activeItem) return false
				return matchesActiveInput(feedback.options.input, activeItem, self.inputs)
			},
		},
		fileServerOnline: {
			type: 'boolean',
			name: 'File Server Online',
			description: 'True when Falcon Play reports the file server online',
			defaultStyle: greenStyle,
			options: [],
			callback: () => self.serverStatus?.fileServer?.online === true,
		},
		rundownOnAir: {
			type: 'boolean',
			name: 'Rundown On Air',
			description: 'True when the active rundown has an on-air item',
			defaultStyle: redStyle,
			options: [],
			callback: () => !!self.serverStatus?.rundown?.onAirUID,
		},
		cuedItemPresent: {
			type: 'boolean',
			name: 'Item Cued',
			description: 'True when a rundown item is cued',
			defaultStyle: greenStyle,
			options: [],
			callback: () => !!self.serverStatus?.rundown?.cuedUID,
		},
		selectedItemPresent: {
			type: 'boolean',
			name: 'Item Selected',
			description: 'True when Director has selected a rundown item',
			defaultStyle: greenStyle,
			options: [],
			callback: () => !!(self.serverStatus?.companion?.selectedItem || self.serverStatus?.companion?.selectedGroupId),
		},
		subitemAvailable: {
			type: 'boolean',
			name: 'Subitem Button Available',
			description: 'True when this configured button has a subitem in the selected story',
			defaultStyle: greenStyle,
			options: slotOptions,
			callback: (feedback) => slotState(feedback, 'available'),
		},
		subitemPlaying: {
			type: 'boolean',
			name: 'Subitem Playing',
			description: 'True when the subitem is reported as playing',
			defaultStyle: redStyle,
			options: slotOptions,
			callback: (feedback) => slotState(feedback, 'playing'),
		},
		subitemCued: {
			type: 'boolean',
			name: 'Subitem Cued',
			description: 'True when the subitem is cued',
			defaultStyle: greenStyle,
			options: slotOptions,
			callback: (feedback) => slotState(feedback, 'cued'),
		},
		subitemPlayed: {
			type: 'boolean',
			name: 'Subitem Played',
			description: 'True when the subitem appears in played history',
			defaultStyle: greenStyle,
			options: slotOptions,
			callback: (feedback) => slotState(feedback, 'played'),
		},
	}
	definitions.favoriteText = {
		...definitions.itemText,
		name: 'Favorite Text',
		options: [
			...Favorites.options(self),
			...definitions.itemText.options
				.filter((option) => ['format', 'showThumbnail', 'thumbnailLayout'].includes(option.id))
				.map((option) => {
					const { isVisibleExpression, ...copy } = option
					return copy
				}),
		],
		callback: (feedback) =>
			definitions.itemText.callback({
				...feedback,
				options: { ...feedback.options, source: 'favorite', favoriteSlot: feedback.options.slot },
			}),
	}
	self.setFeedbackDefinitions(definitions)
}
