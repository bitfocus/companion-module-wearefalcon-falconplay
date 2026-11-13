const { combineRgb } = require('@companion-module/base')
const { getSubitemThumbnail } = require('./thumbnails')

const SLOT_COUNT = 99

const slots = (self) =>
	Array.from(
		{ length: SLOT_COUNT },
		(_, index) =>
			self.serverStatus?.companion?.favoriteButtons?.[index] || { slot: index + 1, label: `Favorite ${index + 1}` },
	)
const choices = (self) =>
	slots(self).map((button) => ({ id: button.slot, label: `Favorite ${button.slot}: ${button.name || 'Empty'}` }))
const options = (self) => [
	{ type: 'dropdown', id: 'slot', label: 'Favorite Button', default: 1, choices: choices(self) },
]

function actions(self) {
	return {
		playFavoriteButton: {
			name: 'Play Favorite Button',
			description: 'Play the current element in a Favorite position (1–99).',
			options: options(self),
			callback: async (action) => {
				const slot = Number(action.options.slot)
				const button = self.serverStatus?.companion?.favoriteButtons?.[slot - 1]
				if (!button?.available || !button.uid) {
					self.log('warn', `Favorite ${slot} is empty or unavailable`)
					return
				}
				try {
					const result = await self.httpPost(`/api/companion/favorite-buttons/${slot}/play`, {
						expectedUid: button.uid,
					})
					if (!result.ok) self.log('error', `Play Favorite Button failed: ${result.error}`)
				} catch (error) {
					self.log('error', `Play Favorite Button error: ${error.message}`)
				}
			},
		},
	}
}
function feedbacks(self) {
	const result = {}
	for (const [id, name, field, color] of [
		['favoriteAvailable', 'Favorite Button Available', 'available', combineRgb(0, 200, 0)],
		['favoritePlaying', 'Favorite Playing', 'playing', combineRgb(200, 0, 0)],
		['favoriteCued', 'Favorite Cued', 'cued', combineRgb(0, 200, 0)],
		['favoritePlayed', 'Favorite Played', 'played', combineRgb(0, 200, 0)],
	])
		result[id] = {
			type: 'boolean',
			name,
			defaultStyle: { bgcolor: color, color: combineRgb(255, 255, 255) },
			options: options(self),
			callback: (feedback) =>
				self.serverStatus?.companion?.favoriteButtons?.[Number(feedback.options.slot) - 1]?.[field] === true,
		}
	result.favoriteThumbnail = {
		type: 'advanced',
		name: 'Favorite Thumbnail',
		description: 'Show the current Favorite picture.',
		options: [
			...options(self),
			{
				type: 'dropdown',
				id: 'thumbnailLayout',
				label: 'Thumbnail layout',
				default: 'aboveText',
				choices: [
					{ id: 'aboveText', label: 'Image Above Text' },
					{ id: 'background', label: 'Image Behind Text' },
				],
			},
		],
		callback: (feedback) =>
			getSubitemThumbnail(
				self,
				feedback.options.slot,
				feedback.options.thumbnailLayout || 'aboveText',
				'favoriteButtons',
			),
	}
	return result
}
function presets(self) {
	return Object.fromEntries(
		slots(self).map((button) => {
			const slot = button.slot
			return [
				`favorite_button_${slot}`,
				{
					type: 'button',
					category: 'Favorites',
					name: `Favorite ${slot}`,
					style: {
						text: `Favorite ${slot}`,
						size: 'auto',
						color: combineRgb(255, 255, 255),
						bgcolor: combineRgb(30, 30, 30),
					},
					feedbacks: [
						{
							feedbackId: 'favoriteText',
							options: { slot, format: 'auto', showThumbnail: true, thumbnailLayout: 'aboveText' },
						},
						{ feedbackId: 'favoriteAvailable', options: { slot }, style: { bgcolor: combineRgb(30, 85, 150) } },
						{ feedbackId: 'favoritePlaying', options: { slot }, style: { bgcolor: combineRgb(180, 0, 0) } },
					],
					steps: [{ down: [{ actionId: 'playFavoriteButton', options: { slot } }], up: [] }],
				},
			]
		}),
	)
}
module.exports = { SLOT_COUNT, choices, options, actions, feedbacks, presets }
