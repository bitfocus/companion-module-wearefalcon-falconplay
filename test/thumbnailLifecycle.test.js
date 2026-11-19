const test = require('node:test')
const assert = require('node:assert/strict')
const { PNG } = require('pngjs')
const harness = require('./helpers/moduleHarness')
const { getSubitemThumbnail } = require('../src/thumbnails')

const image = new PNG({ width: 1, height: 1 })
image.data.set([100, 80, 60, 255])
const bytes = PNG.sync.write(image)
const dataUri = `data:image/png;base64,${bytes.toString('base64')}`
const slot = (n, prefix = 'favorite') => ({ slot: n, available: true, thumbnailUrl: `/${prefix}-${n}.png` })

test('99 Favorites plus 9 Subitem thumbnails stay visible and revalidate only after 15 seconds', async () => {
	const requests = []
	const h = harness(async (url, options) => {
		requests.push([url, options.headers])
		return options.headers['If-None-Match']
			? new Response(null, { status: 304 })
			: new Response(bytes, { headers: { 'content-type': 'image/png', etag: '"v1"' } })
	})
	const data = {
		ok: true,
		companion: {
			favoriteButtons: Array.from({ length: 99 }, (_, i) => slot(i + 1)),
			subitemButtons: Array.from({ length: 9 }, (_, i) => slot(i + 1, 'subitem')),
		},
	}
	h.self.serverStatus = data
	h.self.subitemButtons = data.companion.subitemButtons
	h.self.updateVariableValues(data)
	h.self.refreshThumbnailVariables(data)
	await h.flush()
	assert.equal(requests.length, 108)
	assert.equal(h.self.thumbnailCache.size, 108)
	assert.equal(h.self.thumbnailCheckedAt.size, 108)
	for (const [collection, prefix] of [
		['favoriteButtons', 'favorite'],
		['subitemButtons', 'subitem'],
	]) {
		for (const button of data.companion[collection]) {
			assert.equal(h.self.lastVars[`${prefix}_${button.slot}_thumbnail`], dataUri)
			assert.ok(getSubitemThumbnail(h.self, button.slot, 'background', collection).png64)
		}
	}
	h.updates.length = h.checks.length = 0
	for (let i = 0; i < 7; i++) {
		h.advance(2000)
		h.self.updateVariableValues(data)
		h.self.refreshThumbnailVariables(data)
		await h.flush()
		assert.equal(requests.length, 108)
		assert.equal(h.self.thumbnailCache.size, 108)
	}
	assert.deepEqual(h.updates, [], 'no thumbnail variable becomes blank between polls')
	h.advance(1000)
	h.self.refreshThumbnailVariables(data)
	await h.flush()
	assert.equal(requests.length, 216)
	assert.ok(requests.slice(108).every(([, headers]) => headers['If-None-Match'] === '"v1"'))
	assert.equal(h.self.thumbnailCache.size, 108)
	assert.deepEqual(h.updates, [], '304 responses retain images without republishing')
	data.companion.favoriteButtons = data.companion.favoriteButtons.slice(-1)
	data.companion.subitemButtons = data.companion.subitemButtons.slice(0, 1)
	h.self.refreshThumbnailVariables(data)
	await h.flush()
	for (const cache of [
		h.self.thumbnailCache,
		h.self.thumbnailCheckedAt,
		h.self.thumbnailValidators,
		h.self.thumbnailRenderCache,
	]) {
		assert.equal(cache.size, 2, 'only still-active URLs remain in each cache')
	}
})

test('one shared thumbnail request updates all current Subitem and Favorite positions', async () => {
	let requests = 0
	const h = harness(async () => {
		requests++
		return new Response(bytes, { headers: { 'content-type': 'image/png' } })
	})
	h.self.serverStatus = { companion: { subitemButtons: [slot(1)], favoriteButtons: [slot(1)] } }
	h.self.refreshThumbnailVariables(h.self.serverStatus)
	await h.flush()
	assert.equal(requests, 1)
	assert.equal(h.self.lastVars.subitem_1_thumbnail, dataUri)
	assert.equal(h.self.lastVars.favorite_1_thumbnail, dataUri)
	assert.deepEqual(
		new Set(h.checks.flat()),
		new Set(['subitemThumbnail', 'itemText', 'favoriteThumbnail', 'favoriteText']),
	)
})

test('a completed request cannot restore a URL removed from the current status', async () => {
	let finish
	const h = harness(
		() =>
			new Promise((resolve) => {
				finish = resolve
			}),
	)
	h.self.serverStatus = { companion: { favoriteButtons: [slot(1)] } }
	h.self.refreshThumbnailVariables(h.self.serverStatus)
	h.self.serverStatus = { companion: { favoriteButtons: [] } }
	h.self.refreshThumbnailVariables(h.self.serverStatus)
	finish(new Response(bytes, { headers: { 'content-type': 'image/png' } }))
	await h.flush()
	assert.equal(h.self.thumbnailCache.size, 0)
	assert.equal(h.self.thumbnailCheckedAt.size, 0)
	assert.deepEqual(h.updates, [])
})

test('WebP bodies are never read or published and debug output is deduplicated', async () => {
	let bodyReads = 0
	const h = harness(async () => ({
		ok: true,
		status: 200,
		headers: new Headers({ 'content-type': 'image/webp' }),
		arrayBuffer: async () => {
			bodyReads++
			return Buffer.from('not a supported image')
		},
	}))
	h.self.serverStatus = { companion: { favoriteButtons: [slot(1)] } }
	h.self.thumbnailCache.set('http://play:80/favorite-1.png', dataUri)
	h.self.updateVariableValues(h.self.serverStatus)
	h.updates.length = 0
	for (let i = 0; i < 3; i++) {
		h.self.refreshThumbnailVariables(h.self.serverStatus)
		await h.flush()
		h.advance(15000)
	}
	assert.equal(bodyReads, 0)
	assert.equal(h.self.thumbnailCache.size, 0)
	assert.deepEqual(h.updates, [{ favorite_1_thumbnail: '' }])
	assert.equal(h.logs.length, 1)
	assert.equal(h.logs[0][0], 'debug')
	assert.match(h.logs[0][1], /image\/webp/)
})
