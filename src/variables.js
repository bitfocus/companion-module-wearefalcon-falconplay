const { SLOT_COUNT: FAVORITE_SLOTS } = require('./favorites')
module.exports = (self) => {
	const definitions = [
		{ variableId: 'server_connected', name: 'Falcon Play Connected' },
		{ variableId: 'server_version', name: 'Server Version' },
		{ variableId: 'rundown_id', name: 'Active Rundown ID' },
		{ variableId: 'rundown_name', name: 'Active Rundown Name' },
		{ variableId: 'rundown_onair_uid', name: 'Rundown On-Air UID' },
		{ variableId: 'rundown_cued_uid', name: 'Rundown Cued UID' },
		{ variableId: 'onair_item', name: 'On-Air Item' },
		{ variableId: 'onair_item_uid', name: 'On-Air Item UID' },
		{ variableId: 'onair_item_type', name: 'On-Air Item Type' },
		{ variableId: 'cued_item', name: 'Cued Item' },
		{ variableId: 'cued_item_uid', name: 'Cued Item UID' },
		{ variableId: 'cued_item_type', name: 'Cued Item Type' },
		{ variableId: 'selected_item', name: 'Selected Item' },
		{ variableId: 'selected_item_uid', name: 'Selected Item UID' },
		{ variableId: 'selected_item_type', name: 'Selected Item Type' },
		{ variableId: 'selected_story_id', name: 'Selected Story ID' },
		{ variableId: 'favorite_count', name: 'Favorites Count' },
		{ variableId: 'favorites_revision', name: 'Favorites Revision' },
		{ variableId: 'subitem_button_count', name: 'Configured Subitem Button Count' },
		{ variableId: 'vision_mixer_connected', name: 'Vision Mixer Connected' },
		{ variableId: 'media_player_connected', name: 'Media Player Connected' },
		{ variableId: 'sound_mixer_connected', name: 'Sound Mixer Connected' },
		{ variableId: 'video_hub_connected', name: 'Video Hub Connected' },
		{ variableId: 'file_server_online', name: 'File Server Online' },
		{ variableId: 'file_server_ip', name: 'File Server IP' },
		{ variableId: 'file_server_version', name: 'File Server Version' },
	]
	for (const [prefix, label] of [
		['onair_item', 'On-Air Item'],
		['cued_item', 'Cued Item'],
		['selected_item', 'Selected Item'],
	]) {
		definitions.push(
			{ variableId: `${prefix}_first_variable_name`, name: `${label} First Graphic Variable Name` },
			{ variableId: `${prefix}_first_variable_value`, name: `${label} First Graphic Variable Value` },
			{ variableId: `${prefix}_second_variable_name`, name: `${label} Second Graphic Variable Name` },
			{ variableId: `${prefix}_second_variable_value`, name: `${label} Second Graphic Variable Value` },
			{ variableId: `${prefix}_display_text`, name: `${label} Display Text` },
		)
	}
	for (const [prefix, labelPrefix, count] of [
		['subitem', 'Subitem Button', self.subitemButtons?.length || 0],
		['favorite', 'Favorite Button', FAVORITE_SLOTS],
	]) {
		for (let slot = 1; slot <= count; slot++) {
			for (const [suffix, label] of [
				['name', 'Name'],
				['uid', 'UID'],
				['type', 'Type'],
				['first_variable_name', 'First Graphic Variable Name'],
				['first_variable_value', 'First Graphic Variable Value'],
				['second_variable_name', 'Second Graphic Variable Name'],
				['second_variable_value', 'Second Graphic Variable Value'],
				['display_text', 'Display Text'],
				['thumbnail_url', 'Thumbnail URL'],
				['thumbnail', 'Thumbnail Image'],
				['available', 'Available'],
				['playing', 'Playing'],
				['cued', 'Cued'],
				['played', 'Played'],
			]) {
				definitions.push({ variableId: `${prefix}_${slot}_${suffix}`, name: `${labelPrefix} ${slot} ${label}` })
			}
		}
	}
	self.setVariableDefinitions(definitions)
}
