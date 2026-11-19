const test = require('node:test')
const assert = require('node:assert/strict')
const harness = require('./helpers/moduleHarness')

function status() {
	return {
		ok: true,
		version: '1.2.1',
		devices: { visionMixer: true },
		rundown: { id: 'r1', name: 'Show', onAirUID: 'a', cuedUID: 'b' },
		activeItem: { uid: 'a', name: 'CAM 1', input: 1 },
		companion: {
			subitemButtons: [{ slot: 1, name: 'Subitem', available: true, uid: 'sub1' }],
			favoriteButtons: Array.from({ length: 99 }, (_, i) => ({ slot: i + 1, available: false })),
		},
	}
}

test('identical status polls publish no duplicate values or feedback checks', async () => {
	const h = harness()
	let data = status()
	h.self.httpGet = async () => structuredClone(data)
	await h.self.pollStatus()
	assert.ok(Object.keys(h.updates[0]).length > 1300)
	assert.ok(
		h.checks.every((ids) => ids.length > 0),
		'never checks all feedback types implicitly',
	)
	const definitions = { ...h.definitions }
	h.updates.length = h.checks.length = 0
	await h.self.pollStatus()
	assert.deepEqual(h.updates, [])
	assert.deepEqual(h.checks, [])
	assert.deepEqual(h.definitions, definitions)
	data.version = '1.2.2'
	await h.self.pollStatus()
	assert.deepEqual(h.updates, [{ server_version: '1.2.2' }])
	assert.deepEqual(h.checks, [])
})

test('status changes check only affected feedback types and rename dropdowns without rebuilding presets', async () => {
	const h = harness()
	const data = status()
	h.self.httpGet = async () => structuredClone(data)
	await h.self.pollStatus()
	h.updates.length = h.checks.length = 0
	data.companion.favoriteButtons[0] = { slot: 1, uid: 'fav1', name: 'Graphic', available: true }
	await h.self.pollStatus()
	const checks = h.checks.flat()
	assert.ok(checks.includes('favoriteAvailable'))
	assert.ok(checks.includes('favoriteText'))
	assert.ok(!checks.includes('deviceStatus'))
	assert.ok(!checks.includes('onAirInput'))
	const presets = h.definitions.presets
	const actions = h.definitions.actions
	data.companion.subitemButtons[0].name = 'Renamed graphic'
	await h.self.pollStatus()
	assert.equal(h.definitions.actions, actions + 1)
	assert.equal(h.definitions.presets, presets)
	data.companion.subitemButtons.push({ slot: 2, name: 'New slot', available: false })
	await h.self.pollStatus()
	assert.equal(h.definitions.presets, presets + 1)
	assert.ok(h.self.variables.some((item) => item.variableId === 'subitem_2_name'))
})

test('disconnect clears values and feedbacks once, and reconnect restores unchanged server data', async () => {
	const h = harness()
	const data = status()
	h.self.httpGet = async () => structuredClone(data)
	await h.self.pollStatus()
	h.self.httpGet = async () => {
		throw new Error('offline')
	}
	h.updates.length = h.checks.length = 0
	await h.self.pollStatus()
	assert.equal(h.statuses.at(-1)[0], h.InstanceStatus.ConnectionFailure)
	assert.equal(h.updates.at(-1).server_connected, 'No')
	assert.equal(h.updates.at(-1).subitem_1_name, '')
	h.updates.length = h.checks.length = 0
	await h.self.pollStatus()
	assert.deepEqual(h.updates, [])
	assert.deepEqual(h.checks, [])
	h.self.httpGet = async () => structuredClone(data)
	await h.self.pollStatus()
	assert.equal(h.statuses.at(-1)[0], h.InstanceStatus.Ok)
	assert.equal(h.updates.at(-1).subitem_1_name, 'Subitem')
})

test('processing failures are logged as UnknownError, not a network failure', async () => {
	const h = harness()
	h.self.httpGet = async () => status()
	h.self.updateActions = () => {
		throw new Error('Bad action definition')
	}
	await h.self.pollStatus()
	assert.deepEqual(h.statuses.at(-1), [h.InstanceStatus.UnknownError, 'Bad action definition'])
	assert.deepEqual(h.logs.at(-1), ['error', 'Status processing failed: Bad action definition'])
})

test('late status successes and failures cannot overwrite newer data or a changed connection', async () => {
	const h = harness()
	let resolve, reject
	h.self.httpGet = () =>
		new Promise((yes, no) => {
			resolve = yes
			reject = no
		})
	const old = h.self.pollStatus()
	h.self.httpGet = async () => ({ ...status(), version: 'new' })
	await h.self.pollStatus()
	resolve({ ...status(), version: 'old' })
	await old
	assert.equal(h.self.serverStatus.version, 'new')
	h.self.httpGet = () =>
		new Promise((yes, no) => {
			reject = no
		})
	const failed = h.self.pollStatus()
	h.self.httpGet = async () => ({ ...status(), version: 'newer' })
	await h.self.pollStatus()
	reject(new Error('late failure'))
	await failed
	assert.equal(h.self.serverStatus.version, 'newer')
	let finish
	h.self.httpGet = () =>
		new Promise((yes) => {
			finish = yes
		})
	const previousConnection = h.self.pollStatus()
	h.self.stopPolling()
	finish(status())
	await previousConnection
	assert.equal(h.self.serverStatus.version, 'newer')
})

test('unchanged library lists do not rebuild definitions, changed inputs update matching feedback', async () => {
	const h = harness()
	let inputs = [{ input: 6000, name: 'SS1' }]
	h.self.httpGet = async (path) => (path === '/api/inputs' ? { ok: true, inputs } : { ok: true })
	await h.self.refreshLists()
	const definitions = { ...h.definitions }
	h.checks.length = 0
	await h.self.refreshLists()
	assert.deepEqual(h.definitions, definitions)
	assert.deepEqual(h.checks, [])
	inputs = [{ input: 6000, name: 'SS2' }]
	await h.self.refreshLists()
	assert.equal(h.definitions.actions, definitions.actions + 1)
	assert.deepEqual(h.checks, [['onAirInput']])
})
