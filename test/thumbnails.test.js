const test = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { createRequire } = require('node:module')
const vm = require('node:vm')
const jpeg = require('jpeg-js')
const { PNG } = require('pngjs')
const { renderThumbnail, getSubitemThumbnail } = require('../src/thumbnails')
const updateFeedbacks = require('../src/feedbacks')

function fixture(red = 200) {
	const image = new PNG({ width: 16, height: 9 })
	for (let i = 0; i < image.data.length; i += 4) image.data.set([red, 40, 20, 255], i)
	return { image, bytes: PNG.sync.write(image) }
}

function state(dataUri) {
	return {
		inputs: [],
		getBaseUrl: () => 'http://play:80',
		subitemButtons: [{ slot: 1, label: 'Subitem 1' }],
		serverStatus: {
			companion: { subitemButtons: [{ slot: 1, available: true, name: 'Lower Third', thumbnailUrl: '/thumb.jpg' }] },
		},
		thumbnailCache: new Map([['http://play:80/thumb.jpg', dataUri]]),
	}
}

test('JPEG and PNG thumbnails fit the button and reserve space below the image', () => {
	const { image, bytes } = fixture()
	const inputs = [
		`data:image/png;base64,${bytes.toString('base64')}`,
		`data:image/jpeg;base64,${jpeg.encode(image, 90).data.toString('base64')}`,
	]
	for (const input of inputs) {
		const background = PNG.sync.read(Buffer.from(renderThumbnail(input), 'base64'))
		assert.equal(background.width, 72)
		assert.equal(background.height, 58)
		assert.ok(background.data[(29 * 72 + 36) * 4] > 180)
		assert.equal(background.data[(29 * 72 + 36) * 4 + 3], 255)
		assert.equal(background.data[3], 0, 'letterboxing stays transparent')
		const above = PNG.sync.read(Buffer.from(renderThumbnail(input, 'aboveText'), 'base64'))
		assert.equal(above.data[(15 * 72 + 36) * 4 + 3], 255)
		assert.equal(above.data[(31 * 72 + 36) * 4 + 3], 0, 'text area stays clear')
	}
})

test('thumbnail feedback follows the current slot, refreshes replaced images and clears missing sources', () => {
	const dataUri = `data:image/png;base64,${fixture().bytes.toString('base64')}`
	const self = state(dataUri)
	const first = getSubitemThumbnail(self, 1, 'aboveText')
	assert.ok(first.png64)
	assert.equal(first.alignment, 'center:bottom')
	assert.equal(first, getSubitemThumbnail(self, 1, 'aboveText'), 'render is cached')
	self.thumbnailCache.set('http://play:80/thumb.jpg', `data:image/png;base64,${fixture(20).bytes.toString('base64')}`)
	assert.notEqual(getSubitemThumbnail(self, 1, 'aboveText').png64, first.png64)
	self.serverStatus.companion.subitemButtons[0].thumbnailUrl = '/different.jpg'
	assert.deepEqual(getSubitemThumbnail(self, 1), {})
	self.serverStatus.companion.subitemButtons[0].thumbnailUrl = '/thumb.jpg'
	self.serverStatus.companion.subitemButtons[0].available = false
	assert.deepEqual(getSubitemThumbnail(self, 1), {})
	self.serverStatus = null
	assert.deepEqual(getSubitemThumbnail(self, 1), {})
	assert.throws(() => renderThumbnail('data:image/png;base64,YmFk'))
})

test('Item Text can combine its name fallback with the thumbnail without changing other sources', () => {
	const self = state(`data:image/png;base64,${fixture().bytes.toString('base64')}`)
	let feedbacks
	self.setFeedbackDefinitions = (value) => {
		feedbacks = value
	}
	updateFeedbacks(self)
	const options = { source: 'subitem', slot: 1, showThumbnail: true, format: 'firstAndSecondVariableOrName' }
	const combined = feedbacks.itemText.callback({ options })
	assert.equal(combined.text, 'Lower Third')
	assert.ok(combined.png64)
	assert.equal(combined.alignment, 'center:bottom')
	const thumbnailOnly = feedbacks.itemText.callback({ options: { ...options, format: 'none' } })
	assert.equal(thumbnailOnly.text, '')
	assert.equal(thumbnailOnly.png64, combined.png64)
	assert.ok(feedbacks.subitemThumbnail.callback({ options: { slot: 1 } }).png64)
	assert.deepEqual(feedbacks.itemText.callback({ options: { ...options, showThumbnail: false } }), {
		text: 'Lower Third',
	})
	self.serverStatus = null
	assert.deepEqual(feedbacks.itemText.callback({ options }), { text: '' })
	assert.deepEqual(feedbacks.subitemThumbnail.callback({ options: { slot: 1 } }), {})
})

function mainHarness(fetchImage) {
	const filename = require.resolve('../src/main')
	const localRequire = createRequire(filename)
	let Instance
	let now = 100000
	const context = {
		require: (id) =>
			id === '@companion-module/base'
				? {
						InstanceBase: class {},
						runEntrypoint: (value) => {
							Instance = value
						},
					}
				: localRequire(id),
		Buffer,
		AbortSignal,
		fetch: fetchImage,
		Date: { now: () => now },
	}
	vm.runInNewContext(readFileSync(filename, 'utf8'), context, { filename })
	const self = new Instance()
	self.config = { host: 'play', port: '80' }
	self.serverStatus = state('').serverStatus
	const updates = []
	const checks = []
	self.setVariableValues = (value) => updates.push(value)
	self.checkFeedbacks = (...ids) => checks.push(ids)
	return {
		self,
		updates,
		checks,
		advance: (ms) => {
			now += ms
		},
	}
}

test('thumbnail downloads are deduplicated and revalidate an image changed at the same URL', async () => {
	const calls = []
	let unchanged = false
	const harness = mainHarness(async (url, options) => {
		calls.push(options.headers)
		return unchanged
			? new Response(null, { status: 304 })
			: new Response(fixture(calls.length === 1 ? 200 : 20).bytes, {
					headers: { 'content-type': 'image/png', etag: `"${calls.length}"` },
				})
	})
	const { self, updates, checks } = harness
	const refresh = async () => {
		self.refreshThumbnailVariables(self.serverStatus)
		await Promise.all(self.thumbnailRequests.values())
	}
	await refresh()
	const first = self.thumbnailCache.get('http://play:80/thumb.jpg')
	assert.equal(calls.length, 1)
	assert.equal(updates.length, 1)
	assert.deepEqual(checks[0], ['subitemThumbnail', 'itemText', 'favoriteThumbnail', 'favoriteText'])
	await refresh()
	assert.equal(calls.length, 1)
	harness.advance(15000)
	unchanged = true
	await refresh()
	assert.equal(calls[1]['If-None-Match'], '"1"')
	assert.equal(updates.length, 1)
	harness.advance(15000)
	unchanged = false
	await refresh()
	assert.notEqual(self.thumbnailCache.get('http://play:80/thumb.jpg'), first)
	assert.equal(updates.length, 2)
})

test('late thumbnail downloads cannot publish to a different selected subitem or stopped poll generation', async () => {
	let finish
	const { self, updates, checks } = mainHarness(
		() =>
			new Promise((resolve) => {
				finish = resolve
			}),
	)
	self.refreshThumbnailVariables(self.serverStatus)
	self.serverStatus.companion.subitemButtons[0].thumbnailUrl = '/next.jpg'
	self.pollGeneration++
	finish(new Response(fixture().bytes, { headers: { 'content-type': 'image/png' } }))
	await Promise.all(self.thumbnailRequests.values())
	assert.equal(updates.length, 0)
	assert.equal(checks.length, 0)
})

test('a deleted thumbnail clears the cached image and its published variable', async () => {
	let missing = false
	const harness = mainHarness(async () =>
		missing
			? new Response(null, { status: 404 })
			: new Response(fixture().bytes, { headers: { 'content-type': 'image/png' } }),
	)
	const { self, updates } = harness
	self.refreshThumbnailVariables(self.serverStatus)
	await Promise.all(self.thumbnailRequests.values())
	assert.ok(self.thumbnailCache.size)
	missing = true
	harness.advance(15000)
	self.refreshThumbnailVariables(self.serverStatus)
	await Promise.all(self.thumbnailRequests.values())
	assert.equal(self.thumbnailCache.size, 0)
	assert.equal(updates.at(-1).subitem_1_thumbnail, '')
})
