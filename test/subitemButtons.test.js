const test = require('node:test')
const assert = require('node:assert/strict')
const updateActions = require('../src/actions')
const updateVariables = require('../src/variables')
const updatePresets = require('../src/presets')

test('configured subitem slot is selectable and sends the current UID', async () => {
	let actions
	const posts = []
	const self = {
		inputs: [],
		functions: [],
		scenes: [],
		videos: [],
		subitemButtons: [{ slot: 1, label: 'Subitem 1', name: 'Lower Third' }],
		serverStatus: { companion: { subitemButtons: [{ slot: 1, uid: 'gfx-1', available: true }] } },
		setActionDefinitions(value) {
			actions = value
		},
		async httpPost(path, body) {
			posts.push({ path, body })
			return { ok: true }
		},
		log() {},
	}
	updateActions(self)
	assert.equal(actions.playSubitemButton.options[0].choices[0].label, 'Subitem 1: Lower Third')
	await actions.playSubitemButton.callback({ options: { slot: 1 } })
	assert.deepEqual(posts, [{ path: '/api/companion/subitem-buttons/1/play', body: { expectedUid: 'gfx-1' } }])
	self.serverStatus.companion.subitemButtons[0].available = false
	await actions.playSubitemButton.callback({ options: { slot: 1 } })
	assert.equal(posts.length, 1)
})

test('each configured slot has name, state and image variables', () => {
	let definitions
	updateVariables({
		subitemButtons: [{ slot: 1 }],
		setVariableDefinitions(value) {
			definitions = value
		},
	})
	const ids = new Set(definitions.map((definition) => definition.variableId))
	assert.ok(ids.has('subitem_1_name'))
	assert.ok(ids.has('subitem_1_thumbnail_url'))
	assert.ok(ids.has('subitem_1_thumbnail'))
	assert.ok(ids.has('subitem_1_playing'))
})

test('configured subitem buttons produce ready-to-place Companion presets', () => {
	let presets
	updatePresets({
		subitemButtons: [{ slot: 1 }],
		setPresetDefinitions(value) {
			presets = value
		},
	})
	assert.equal(presets.subitem_button_1.steps[0].down[0].actionId, 'playSubitemButton')
	assert.equal(presets.subitem_button_1.feedbacks[0].feedbackId, 'itemText')
	assert.equal(presets.subitem_button_1.feedbacks[0].options.source, 'subitem')
	assert.equal(presets.subitem_button_1.feedbacks[1].feedbackId, 'subitemThumbnail')
	assert.equal(presets.subitem_button_1.feedbacks[1].options.thumbnailLayout, 'aboveText')
	assert.equal(presets.subitem_button_1.feedbacks[2].feedbackId, 'subitemAvailable')
})
