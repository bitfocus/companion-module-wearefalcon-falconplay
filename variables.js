module.exports = (self) => {
	self.setVariableDefinitions([
		{ variableId: 'server_version', name: 'Server Version' },
		{ variableId: 'rundown_name', name: 'Active Rundown Name' },
		{ variableId: 'onair_item', name: 'On-Air Item' },
		{ variableId: 'cued_item', name: 'Cued Item' },
		{ variableId: 'vision_mixer_connected', name: 'Vision Mixer Connected' },
		{ variableId: 'media_player_connected', name: 'Media Player Connected' },
		{ variableId: 'sound_mixer_connected', name: 'Sound Mixer Connected' },
		{ variableId: 'video_hub_connected', name: 'Video Hub Connected' },
		{ variableId: 'file_server_online', name: 'File Server Online' },
	])
}
