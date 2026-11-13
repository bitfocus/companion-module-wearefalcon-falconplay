const test = require('node:test')
const assert = require('node:assert/strict')
const { PNG } = require('pngjs')
const updateActions = require('../src/actions')
const updateFeedbacks = require('../src/feedbacks')
const updateVariables = require('../src/variables')
const updatePresets = require('../src/presets')
function instance() {
	const image = new PNG({ width: 1, height: 1 })
	image.data.set([200, 50, 20, 255])
	const self = {
		inputs: [],
		functions: [],
		scenes: [],
		videos: [],
		subitemButtons: [],
		getBaseUrl: () => 'http://play:80',
		thumbnailCache: new Map([
			['http://play:80/thumb.jpg', `data:image/png;base64,${PNG.sync.write(image).toString('base64')}`],
		]),
		serverStatus: {
			companion: {
				favoriteButtons: [
					{
						slot: 1,
						uid: 'favorite-a',
						name: 'Lower',
						available: true,
						type: 'scene',
						firstVariableValue: 'Anna',
						secondVariableValue: 'Reporter',
						thumbnailUrl: '/thumb.jpg',
						playing: true,
					},
				],
			},
		},
		setActionDefinitions: (value) => {
			self.actions = value
		},
		setFeedbackDefinitions: (value) => {
			self.feedbacks = value
		},
		setVariableDefinitions: (value) => {
			self.variables = value
		},
		setPresetDefinitions: (value) => {
			self.presets = value
		},
		log() {},
		posts: [],
		async httpPost(path, body) {
			self.posts.push({ path, body })
			return { ok: true }
		},
	}
	return self
}
test('Favorite positions 1–99 are selectable, use the current UID and never trigger an empty slot', async () => {
	const self = instance()
	updateActions(self)
	assert.equal(self.actions.playFavoriteButton.options[0].choices.length, 99)
	await self.actions.playFavoriteButton.callback({ options: { slot: 1 } })
	assert.equal(self.posts[0].body.expectedUid, 'favorite-a')
	self.serverStatus.companion.favoriteButtons[0].uid = 'favorite-b'
	await self.actions.playFavoriteButton.callback({ options: { slot: 1 } })
	assert.equal(self.posts[1].body.expectedUid, 'favorite-b')
	await self.actions.playFavoriteButton.callback({ options: { slot: 99 } })
	assert.equal(self.posts.length, 2)
})
test('Favorites have complete text/no-text/thumbnail/status feedbacks, variables and 99 presets', () => {
	const self = instance()
	updateFeedbacks(self)
	updateVariables(self)
	updatePresets(self)
	const feedback = (options) => self.feedbacks.favoriteText.callback({ options: { slot: 1, ...options } })
	assert.equal(feedback({ format: 'firstAndSecondVariableOrName' }).text, 'Anna\nReporter')
	const onlyImage = feedback({ format: 'none', showThumbnail: true })
	assert.equal(onlyImage.text, '')
	assert.ok(onlyImage.png64)
	assert.equal(self.feedbacks.favoritePlaying.callback({ options: { slot: 1 } }), true)
	assert.ok(self.feedbacks.favoriteThumbnail.callback({ options: { slot: 1 } }).png64)
	assert.ok(self.variables.some((variable) => variable.variableId === 'favorite_99_second_variable_value'))
	assert.ok(self.variables.some((variable) => variable.variableId === 'favorite_99_thumbnail'))
	assert.equal(Object.keys(self.presets).filter((id) => id.startsWith('favorite_button_')).length, 99)
	assert.equal(self.presets.favorite_button_99.steps[0].down[0].actionId, 'playFavoriteButton')
	self.serverStatus = null
	assert.deepEqual(feedback({ format: 'none', showThumbnail: true }), { text: '' })
})
