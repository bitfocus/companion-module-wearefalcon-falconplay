const { readFileSync } = require('node:fs')
const { createRequire } = require('node:module')
const vm = require('node:vm')
const { InstanceStatus } = require('@companion-module/base')

module.exports = function moduleHarness(fetchImage = async () => new Response(null, { status: 404 })) {
	const filename = require.resolve('../../src/main')
	const localRequire = createRequire(filename)
	let Instance
	let now = 100000
	vm.runInNewContext(
		readFileSync(filename, 'utf8'),
		{
			require: (id) =>
				id === '@companion-module/base'
					? {
							InstanceBase: class {},
							InstanceStatus,
							runEntrypoint: (value) => {
								Instance = value
							},
						}
					: localRequire(id),
			Buffer,
			AbortSignal,
			fetch: fetchImage,
			Date: { now: () => now },
			setInterval,
			clearInterval,
		},
		{ filename },
	)
	const self = new Instance()
	self.config = { host: 'play', port: '80' }
	const updates = [],
		checks = [],
		statuses = [],
		logs = []
	const definitions = { actions: 0, feedbacks: 0, presets: 0, variables: 0 }
	self.setVariableValues = (value) => updates.push(structuredClone(value))
	self.checkFeedbacks = (...ids) => checks.push(ids)
	self.updateStatus = (...values) => statuses.push(values)
	self.log = (...values) => logs.push(values)
	for (const [method, key] of [
		['setActionDefinitions', 'actions'],
		['setFeedbackDefinitions', 'feedbacks'],
		['setPresetDefinitions', 'presets'],
		['setVariableDefinitions', 'variables'],
	]) {
		self[method] = (value) => {
			definitions[key]++
			self[key] = value
		}
	}
	return {
		self,
		updates,
		checks,
		statuses,
		logs,
		definitions,
		InstanceStatus,
		advance: (ms) => {
			now += ms
		},
		flush: () => Promise.all(self.thumbnailRequests.values()),
	}
}
