const { combineRgb } = require('@companion-module/base')

module.exports = (self) => {
	self.setFeedbackDefinitions({
		connectionStatus: {
			type: 'boolean',
			name: 'Server Connected',
			description: 'Changes style when Falcon Play server is reachable',
			defaultStyle: {
				bgcolor: combineRgb(0, 200, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [],
			callback: () => {
				return self.serverStatus !== null
			},
		},

		deviceStatus: {
			type: 'boolean',
			name: 'Device Connected',
			description: 'Changes style when a specific device is connected',
			defaultStyle: {
				bgcolor: combineRgb(0, 200, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					id: 'device',
					label: 'Device',
					choices: [
						{ id: 'visionMixer', label: 'Vision Mixer' },
						{ id: 'mediaPlayer', label: 'Media Player' },
						{ id: 'soundMixer', label: 'Sound Mixer' },
						{ id: 'videoHub', label: 'Video Hub' },
					],
					default: 'visionMixer',
				},
			],
			callback: (feedback) => {
				const device = feedback.options.device
				return self.serverStatus?.devices?.[device] === true
			},
		},

		onAirInput: {
			type: 'boolean',
			name: 'Input On Air',
			description: 'Changes style when a specific input is currently on-air',
			defaultStyle: {
				bgcolor: combineRgb(200, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					id: 'input',
					label: 'Input',
					choices: self.inputs.map((inp) => ({ id: inp.input, label: inp.name })),
					default: self.inputs[0]?.input ?? 0,
				},
			],
			callback: (feedback) => {
				const activeItem = self.serverStatus?.activeItem
				if (!activeItem) return false
				return activeItem.input === feedback.options.input
			},
		},
	})
}
