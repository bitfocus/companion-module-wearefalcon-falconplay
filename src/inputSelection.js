const INPUT_NAME_PREFIX = 'input-name:'

function buildInputChoices(inputs) {
	return inputs
		.filter((input) => typeof input.name === 'string' && input.name.length > 0)
		.map((input) => ({
			id: `${INPUT_NAME_PREFIX}${input.name}`,
			label: input.name,
		}))
}

function buildInputRequest(selection) {
	if (typeof selection === 'string' && selection.startsWith(INPUT_NAME_PREFIX)) {
		return { inputName: selection.slice(INPUT_NAME_PREFIX.length) }
	}

	// Companion buttons created before logical input names were introduced store
	// the physical mixer input. Keep accepting that value for backwards compatibility.
	return { input: selection }
}

function matchesActiveInput(selection, activeItem, inputs) {
	if (!activeItem) return false

	if (typeof selection === 'string' && selection.startsWith(INPUT_NAME_PREFIX)) {
		const selectedName = selection.slice(INPUT_NAME_PREFIX.length)
		return (
			activeItem.inputName === selectedName || activeItem.itemSlug === selectedName || activeItem.name === selectedName
		)
	}

	if (activeItem.input !== undefined && activeItem.input !== null) {
		return String(activeItem.input) === String(selection)
	}

	// Older feedbacks store only a physical mixer input. Resolve all logical
	// layouts using that input so existing feedbacks keep their former semantics.
	return inputs.some(
		(input) =>
			String(input.input) === String(selection) &&
			(input.name === activeItem.inputName || input.name === activeItem.itemSlug || input.name === activeItem.name),
	)
}

module.exports = {
	buildInputChoices,
	buildInputRequest,
	matchesActiveInput,
}
