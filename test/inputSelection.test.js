const test = require('node:test')
const assert = require('node:assert/strict')

const { buildInputChoices, buildInputRequest, matchesActiveInput } = require('../src/inputSelection')

const inputs = [
	{ input: '6000', name: 'SS1' },
	{ input: '6000', name: 'SS 2-2 (VA)' },
	{ input: '10020', name: 'DVE' },
	{ input: '10020', name: 'DVE Stemme Andele' },
]

test('logical layouts sharing a physical input receive unique dropdown values', () => {
	assert.deepEqual(buildInputChoices(inputs), [
		{ id: 'input-name:SS1', label: 'SS1' },
		{ id: 'input-name:SS 2-2 (VA)', label: 'SS 2-2 (VA)' },
		{ id: 'input-name:DVE', label: 'DVE' },
		{ id: 'input-name:DVE Stemme Andele', label: 'DVE Stemme Andele' },
	])
})

test('new input choices use the unique Falcon Play name', () => {
	assert.deepEqual(buildInputRequest('input-name:SS 2-2 (VA)'), { inputName: 'SS 2-2 (VA)' })
	assert.deepEqual(buildInputRequest('input-name:SS: ÆØÅ'), { inputName: 'SS: ÆØÅ' })
})

test('legacy Companion buttons keep using the physical mixer input', () => {
	assert.deepEqual(buildInputRequest('6000'), { input: '6000' })
	assert.deepEqual(buildInputRequest(6000), { input: 6000 })
})

test('new feedback choices distinguish layouts sharing a physical input', () => {
	const activeItem = { name: 'SS 2-2 (VA)', itemSlug: 'SS 2-2 (VA)' }

	assert.equal(matchesActiveInput('input-name:SS 2-2 (VA)', activeItem, inputs), true)
	assert.equal(matchesActiveInput('input-name:SS1', activeItem, inputs), false)
})

test('legacy feedbacks retain physical-input matching through the logical input name', () => {
	const activeItem = { name: 'SS 2-2 (VA)', itemSlug: 'SS 2-2 (VA)' }

	assert.equal(matchesActiveInput('6000', activeItem, inputs), true)
	assert.equal(matchesActiveInput('10020', activeItem, inputs), false)
})

test('feedback uses an active physical input when Falcon Play provides one', () => {
	assert.equal(matchesActiveInput('6000', { input: 6000 }, inputs), true)
	assert.equal(matchesActiveInput('10020', { input: 6000 }, inputs), false)
})

test('feedback prefers a canonical inputName when Falcon Play provides one', () => {
	const activeItem = { inputName: 'SS 2-2 (VA)', name: 'Custom rundown title' }

	assert.equal(matchesActiveInput('input-name:SS 2-2 (VA)', activeItem, inputs), true)
	assert.equal(matchesActiveInput('input-name:SS1', activeItem, inputs), false)
})
