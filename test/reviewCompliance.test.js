const test = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync, existsSync } = require('node:fs')
const path = require('node:path')
const updateVariables = require('../src/variables')
const updateFeedbacks = require('../src/feedbacks')

test('built-in Help documents every fixed variable and every Subitem/Favorite field', () => {
	const help = readFileSync(path.join(__dirname, '../companion/HELP.md'), 'utf8')
	let definitions
	updateVariables({
		subitemButtons: [{ slot: 1 }],
		setVariableDefinitions: (value) => {
			definitions = value
		},
	})
	for (const definition of definitions) {
		const documented = definition.variableId.replace(/_(\d+)_/, '_N_')
		assert.ok(help.includes('`' + documented + '`'), `Help omits ${documented}`)
	}
	assert.match(help, /1–99/)
})

test('only the src entrypoint remains, with matching package and manifest versions', () => {
	for (const name of ['actions.js', 'feedbacks.js', 'main.js', 'variables.js']) {
		assert.equal(existsSync(path.join(__dirname, '..', name)), false)
	}
	const pkg = require('../package.json')
	const manifest = require('../companion/manifest.json')
	assert.equal(pkg.main, 'src/main.js')
	assert.equal(manifest.runtime.entrypoint, '../src/main.js')
	assert.equal(pkg.version, manifest.version)
})

test('Favorite Text thumbnail layout depends only on Show Thumbnail', () => {
	let definitions
	updateFeedbacks({
		inputs: [],
		subitemButtons: [],
		setFeedbackDefinitions: (value) => {
			definitions = value
		},
	})
	const options = definitions.favoriteText.options
	assert.equal(
		options.find((option) => option.id === 'thumbnailLayout').isVisibleExpression,
		'$(options:showThumbnail)',
	)
	assert.equal(options.find((option) => option.id === 'showThumbnail').isVisibleExpression, undefined)
})
