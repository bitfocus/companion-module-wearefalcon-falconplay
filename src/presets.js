const Favorites = require('./favorites')
const { combineRgb } = require('@companion-module/base')

module.exports = (self) => {
	const presets = Favorites.presets(self)
	for (const button of self.subitemButtons) {
		const slot = Number(button.slot)
		if (!Number.isSafeInteger(slot) || slot < 1) continue
		presets[`subitem_button_${slot}`] = {
			type: 'button',
			category: 'Subitem Buttons',
			name: `Subitem ${slot}`,
			style: {
				text: `Subitem ${slot}`,
				size: 'auto',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(30, 30, 30),
			},
			feedbacks: [
				{ feedbackId: 'itemText', options: { source: 'subitem', slot, format: 'auto' } },
				{ feedbackId: 'subitemThumbnail', options: { slot, thumbnailLayout: 'aboveText' } },
				{ feedbackId: 'subitemAvailable', options: { slot }, style: { bgcolor: combineRgb(30, 85, 150) } },
				{ feedbackId: 'subitemPlaying', options: { slot }, style: { bgcolor: combineRgb(180, 0, 0) } },
			],
			steps: [{ down: [{ actionId: 'playSubitemButton', options: { slot } }], up: [] }],
		}
	}
	self.setPresetDefinitions(presets)
}
