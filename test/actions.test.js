const test = require('node:test')
const assert = require('node:assert/strict')

const updateActions = require('../src/actions')

function createModule() {
	let actions
	const calls = []
	const self = {
		inputs: [
			{ input: '6000', name: 'SS1' },
			{ input: '6000', name: 'SS 2-2 (VA)' },
			{ input: '10020', name: 'DVE' },
			{ input: '10020', name: 'DVE Stemme Andele' },
		],
		functions: [],
		scenes: [],
		videos: [],
		setActionDefinitions(definitions) {
			actions = definitions
		},
		async httpPost(path, body) {
			calls.push({ path, body })
			return { ok: true }
		},
		log() {},
	}

	updateActions(self)
	return { actions, calls }
}

test('Preview sends the selected logical SuperSource layout name', async () => {
	const { actions, calls } = createModule()

	await actions.setInputPreview.callback({ options: { input: 'input-name:SS 2-2 (VA)' } })

	assert.deepEqual(calls, [
		{
			path: '/api/visionMixer/preview',
			body: { inputName: 'SS 2-2 (VA)' },
		},
	])
})

test('Program sends the selected logical DVE layout and transition', async () => {
	const { actions, calls } = createModule()

	await actions.switchInput.callback({
		options: {
			input: 'input-name:DVE Stemme Andele',
			transitionStyle: 'mix',
			transitionDuration: 25,
		},
	})

	assert.deepEqual(calls, [
		{
			path: '/api/visionMixer/onAir',
			body: {
				inputName: 'DVE Stemme Andele',
				transitionStyle: 'mix',
				transitionDuration: 25,
			},
		},
	])
})

test('existing Companion actions retain their legacy physical input payload', async () => {
	const { actions, calls } = createModule()

	await actions.setInputPreview.callback({ options: { input: '6000' } })
	await actions.switchInput.callback({
		options: { input: 10020, transitionStyle: 'cut', transitionDuration: 0 },
	})

	assert.deepEqual(calls, [
		{ path: '/api/visionMixer/preview', body: { input: '6000' } },
		{
			path: '/api/visionMixer/onAir',
			body: { input: 10020, transitionStyle: 'cut', transitionDuration: 0 },
		},
	])
})
