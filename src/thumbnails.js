const jpeg = require('jpeg-js')
const { PNG } = require('pngjs')

function renderThumbnail(dataUri, layout = 'background') {
	const match = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/.exec(dataUri)
	if (!match || match[2].length > Math.ceil((1024 * 1024 * 4) / 3)) throw new Error('Unsupported thumbnail')
	const bytes = Buffer.from(match[2], 'base64')
	let source
	if (match[1] === 'jpeg') {
		source = jpeg.decode(bytes, { useTArray: true, maxResolutionInMP: 8, maxMemoryUsageInMB: 64 })
	} else {
		if (bytes.length < 24 || bytes.readUInt32BE(16) * bytes.readUInt32BE(20) > 8000000) {
			throw new Error('Thumbnail dimensions are too large')
		}
		source = PNG.sync.read(bytes)
	}
	if (!source.width || !source.height) throw new Error('Empty thumbnail')
	const image = new PNG({ width: 72, height: 58 })
	image.data.fill(0)
	const aboveText = layout === 'aboveText'
	const scale = Math.min(72 / source.width, (aboveText ? 30 : 58) / source.height)
	const width = Math.max(1, Math.round(source.width * scale))
	const height = Math.max(1, Math.round(source.height * scale))
	const left = Math.floor((72 - width) / 2)
	const top = aboveText ? 0 : Math.floor((58 - height) / 2)
	for (let y = 0; y < height; y++) {
		const sy = Math.max(0, Math.min(source.height - 1, ((y + 0.5) * source.height) / height - 0.5))
		const y0 = Math.floor(sy)
		const y1 = Math.min(source.height - 1, y0 + 1)
		const fy = sy - y0
		for (let x = 0; x < width; x++) {
			const sx = Math.max(0, Math.min(source.width - 1, ((x + 0.5) * source.width) / width - 0.5))
			const x0 = Math.floor(sx)
			const x1 = Math.min(source.width - 1, x0 + 1)
			const fx = sx - x0
			for (let channel = 0; channel < 4; channel++) {
				const upper =
					source.data[(y0 * source.width + x0) * 4 + channel] * (1 - fx) +
					source.data[(y0 * source.width + x1) * 4 + channel] * fx
				const lower =
					source.data[(y1 * source.width + x0) * 4 + channel] * (1 - fx) +
					source.data[(y1 * source.width + x1) * 4 + channel] * fx
				image.data[((top + y) * 72 + left + x) * 4 + channel] = Math.round(upper * (1 - fy) + lower * fy)
			}
		}
	}
	return PNG.sync.write(image).toString('base64')
}

function getSubitemThumbnail(self, slot, layout = 'background', collection = 'subitemButtons') {
	const button = self.serverStatus?.companion?.[collection]?.[Number(slot) - 1]
	if (!button?.available || !button.thumbnailUrl) return {}
	const url = `${self.getBaseUrl()}${button.thumbnailUrl}`
	const dataUri = self.thumbnailCache?.get(url)
	if (!dataUri) return {}
	self.thumbnailRenderCache ||= new Map()
	const key = `${url}:${layout}`
	let cached = self.thumbnailRenderCache.get(key)
	if (!cached || cached.dataUri !== dataUri) {
		let style = {}
		try {
			style = { png64: renderThumbnail(dataUri, layout), pngalignment: 'center:top' }
			if (layout === 'aboveText') style.alignment = 'center:bottom'
		} catch {
			// An absent or invalid thumbnail leaves the button's normal style intact.
		}
		cached = { dataUri, style }
		self.thumbnailRenderCache.set(key, cached)
		if (self.thumbnailRenderCache.size > 128)
			self.thumbnailRenderCache.delete(self.thumbnailRenderCache.keys().next().value)
	}
	return cached.style
}

module.exports = { renderThumbnail, getSubitemThumbnail }
