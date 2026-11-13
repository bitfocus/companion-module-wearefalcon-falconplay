function graphicVariable(item, index) {
	const ordinal = index === 0 ? 'first' : 'second'
	let name = item?.[`${ordinal}VariableName`] || ''
	let value = item?.[`${ordinal}VariableValue`] ?? ''
	// Older Falcon Play status responses contain raw GDD fields on activeItem/cuedItem.
	if (
		item?.type === 'scene' &&
		item[`${ordinal}VariableValue`] === undefined &&
		item.variables &&
		typeof item.variables === 'object'
	) {
		const entry = Object.entries(item.variables)[index]
		if (entry) {
			name = entry[0]
			const definition = entry[1]
			const rawValue = definition && typeof definition === 'object' ? definition.default : definition
			if (
				['string', 'number', 'boolean'].includes(typeof rawValue) &&
				!(typeof rawValue === 'string' && /^data:/i.test(rawValue))
			)
				value = String(rawValue)
		}
	}
	return { name, value: String(value) }
}

function getItemTextFields(item) {
	const first = graphicVariable(item, 0)
	const second = graphicVariable(item, 1)
	const name = item?.name || item?.label || item?.templateName || ''
	return {
		name,
		firstVariableName: first.name,
		firstVariableValue: first.value,
		secondVariableName: second.name,
		secondVariableValue: second.value,
		displayText: first.value.trim() ? first.value : name,
	}
}

function getFeedbackItem(status, source, slot) {
	if (!status) return null
	if (source === 'onair') return status.companion?.onAirItem || status.activeItem || null
	if (source === 'cued') return status.companion?.cuedItem || status.cuedItem || null
	if (source === 'selected') return status.companion?.selectedItem || null
	if (source === 'subitem' || source === 'favorite') {
		const button = status.companion?.[source === 'favorite' ? 'favoriteButtons' : 'subitemButtons']?.[Number(slot) - 1]
		return button?.available ? button : null
	}
	return null
}

function formatItemText(item, format = 'auto') {
	if (!item || format === 'none') return ''
	const fields = getItemTextFields(item)
	if (format === 'firstAndSecondVariableOrName') {
		return (
			[fields.firstVariableValue, fields.secondVariableValue].filter((value) => value.trim()).join('\n') || fields.name
		)
	}
	const formats = {
		name: [fields.name],
		firstVariable: [fields.firstVariableValue],
		secondVariable: [fields.secondVariableValue],
		firstAndSecondVariable: [fields.firstVariableValue, fields.secondVariableValue],
		nameAndVariable: [fields.name, fields.firstVariableValue],
		nameAndSecondVariable: [fields.name, fields.secondVariableValue],
		nameAndFirstAndSecondVariable: [fields.name, fields.firstVariableValue, fields.secondVariableValue],
	}
	if (Object.hasOwn(formats, format)) return formats[format].filter((value) => value.trim()).join('\n')
	return fields.displayText
}

module.exports = { getItemTextFields, getFeedbackItem, formatItemText }
