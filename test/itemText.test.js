const test = require('node:test')
const assert = require('node:assert/strict')
const { getItemTextFields, formatItemText } = require('../src/itemText')
const updateFeedbacks = require('../src/feedbacks')

test('text feedback shows on-air names and first GDD graphic values', () => {
	const scene = {
		name: 'Lower Third',
		type: 'scene',
		variables: { name: { default: 'Anna Jensen' }, title: { default: 'Reporter' } },
	}
	assert.equal(formatItemText({ name: 'Interview.mp4', type: 'video' }), 'Interview.mp4')
	assert.equal(formatItemText(scene), 'Anna Jensen')
	assert.equal(formatItemText(scene, 'name'), 'Lower Third')
	assert.equal(formatItemText(scene, 'nameAndVariable'), 'Lower Third\nAnna Jensen')
	assert.equal(formatItemText(scene, 'firstAndSecondVariable'), 'Anna Jensen\nReporter')
	assert.equal(getItemTextFields(scene).firstVariableName, 'name')
	assert.equal(getItemTextFields(scene).secondVariableName, 'title')
})

test('first and second format handles cached API fields and missing values', () => {
	assert.equal(
		formatItemText(
			{ type: 'scene', firstVariableValue: 'ANNA HOLM', secondVariableValue: 'REPORTER' },
			'firstAndSecondVariable',
		),
		'ANNA HOLM\nREPORTER',
	)
	assert.equal(
		formatItemText(
			{ type: 'scene', variables: { first: { default: '' }, second: { default: 'Reporter' } } },
			'firstAndSecondVariable',
		),
		'Reporter',
	)
	assert.equal(
		formatItemText(
			{ type: 'scene', variables: { first: { default: 0 }, second: { default: false } } },
			'firstAndSecondVariable',
		),
		'0\nfalse',
	)
	assert.equal(formatItemText({ type: 'scene', firstVariableValue: 'Anna' }, 'firstAndSecondVariable'), 'Anna')
	assert.equal(formatItemText(null, 'firstAndSecondVariable'), '')
})

test('first and second variable fallback uses the name only when both values are empty', () => {
	const format = 'firstAndSecondVariableOrName'
	const item = { name: 'Lower Third', type: 'scene', firstVariableValue: 'ANNA HOLM', secondVariableValue: 'REPORTER' }
	assert.equal(formatItemText(item, format), 'ANNA HOLM\nREPORTER')
	assert.equal(formatItemText({ ...item, secondVariableValue: '' }, format), 'ANNA HOLM')
	assert.equal(formatItemText({ ...item, firstVariableValue: '' }, format), 'REPORTER')
	assert.equal(formatItemText({ ...item, firstVariableValue: ' ', secondVariableValue: '\t' }, format), 'Lower Third')
	assert.equal(formatItemText({ name: 'Interview.mp4', type: 'video' }, format), 'Interview.mp4')
	assert.equal(
		formatItemText(
			{
				name: 'Lower Third',
				type: 'scene',
				variables: {
					name: { default: 'Anna' },
					title: { default: 'Reporter' },
				},
			},
			format,
		),
		'Anna\nReporter',
	)
	assert.equal(formatItemText({ ...item, firstVariableValue: 0, secondVariableValue: false }, format), '0\nfalse')
	assert.equal(formatItemText(null, format), '')
})

test('empty first values fall back to the item name without selecting a later field', () => {
	assert.equal(formatItemText({ name: 'Score', type: 'scene', variables: { score: { default: 0 } } }), '0')
	assert.equal(formatItemText({ name: 'Flag', type: 'scene', variables: { enabled: { default: false } } }), 'false')
	const empty = {
		name: 'Lower Third',
		type: 'scene',
		variables: { name: { default: '' }, title: { default: 'Reporter' } },
	}
	assert.equal(formatItemText(empty), 'Lower Third')
	assert.equal(formatItemText(empty, 'firstVariable'), '')
	assert.equal(formatItemText({ name: 'Legacy', type: 'scene', variables: { name: 'Anna' } }), 'Anna')
	assert.equal(
		formatItemText({ name: 'Logo', type: 'scene', variables: { image: { default: 'data:image/png;base64,AA==' } } }),
		'Logo',
	)
})

test('all name and graphic variable combinations preserve order and omit empty lines', () => {
	const item = { name: 'Lower Third', type: 'scene', firstVariableValue: 'ANNA HOLM', secondVariableValue: 'REPORTER' }
	const expected = {
		none: '',
		name: 'Lower Third',
		firstVariable: 'ANNA HOLM',
		secondVariable: 'REPORTER',
		firstAndSecondVariable: 'ANNA HOLM\nREPORTER',
		nameAndVariable: 'Lower Third\nANNA HOLM',
		nameAndSecondVariable: 'Lower Third\nREPORTER',
		nameAndFirstAndSecondVariable: 'Lower Third\nANNA HOLM\nREPORTER',
	}
	for (const [format, text] of Object.entries(expected)) assert.equal(formatItemText(item, format), text)
	assert.equal(
		formatItemText({ ...item, firstVariableValue: '' }, 'nameAndFirstAndSecondVariable'),
		'Lower Third\nREPORTER',
	)
	assert.equal(formatItemText({ ...item, secondVariableValue: '' }, 'nameAndSecondVariable'), 'Lower Third')
	assert.equal(formatItemText({ ...item, name: '' }, 'nameAndVariable'), 'ANNA HOLM')
	assert.equal(formatItemText({ name: 'Video', type: 'video' }, 'nameAndFirstAndSecondVariable'), 'Video')
	assert.equal(formatItemText(null, 'nameAndFirstAndSecondVariable'), '')
})

test('advanced text feedback selects the requested source and clears disconnected or unavailable text', () => {
	let feedbacks
	const self = {
		inputs: [],
		subitemButtons: [{ slot: 1, label: 'Subitem 1', name: 'Lower Third' }],
		serverStatus: {
			activeItem: { name: 'CAM 1', type: 'input' },
			cuedItem: { name: 'Interview.mp4', type: 'video' },
			companion: {
				selectedItem: { name: 'Selected', type: 'input' },
				subitemButtons: [
					{
						available: true,
						name: 'Lower Third',
						type: 'scene',
						firstVariableName: 'name',
						firstVariableValue: 'Anna Jensen',
					},
				],
			},
		},
		setFeedbackDefinitions(value) {
			feedbacks = value
		},
	}
	updateFeedbacks(self)
	assert.equal(feedbacks.itemText.type, 'advanced')
	const choices = feedbacks.itemText.options.find((option) => option.id === 'format').choices
	assert.deepEqual(
		choices.map((choice) => choice.id),
		[
			'none',
			'auto',
			'firstAndSecondVariableOrName',
			'name',
			'firstVariable',
			'secondVariable',
			'firstAndSecondVariable',
			'nameAndVariable',
			'nameAndSecondVariable',
			'nameAndFirstAndSecondVariable',
		],
	)
	assert.equal(
		choices.find((choice) => choice.id === 'firstAndSecondVariable').label,
		'First and Second Graphic Variable',
	)
	assert.equal(
		choices.find((choice) => choice.id === 'firstAndSecondVariableOrName').label,
		'First and Second Graphic Variable, Otherwise Item Name',
	)
	assert.deepEqual(
		feedbacks.itemText.callback({ options: { source: 'cued', format: 'firstAndSecondVariableOrName' } }),
		{ text: 'Interview.mp4' },
	)
	const text = (source, slot = 1) => feedbacks.itemText.callback({ options: { source, slot, format: 'auto' } })
	assert.deepEqual(text('onair'), { text: 'CAM 1' })
	assert.deepEqual(text('cued'), { text: 'Interview.mp4' })
	assert.deepEqual(text('selected'), { text: 'Selected' })
	assert.deepEqual(text('subitem'), { text: 'Anna Jensen' })
	self.serverStatus.companion.subitemButtons[0].available = false
	assert.deepEqual(text('subitem'), { text: '' })
	self.serverStatus = null
	assert.deepEqual(text('onair'), { text: '' })
})
