# companion-module-wearefalcon-falconplay

Companion module for controlling Falcon Play Server via its REST API.

## Configuration

| Setting | Default | Description |
|---|---|---|
| Host | `127.0.0.1` | IP address of the Falcon Play Server |
| Port | `80` | HTTP port |

## Actions

| Action | Description |
|---|---|
| **Switch Input (Program)** | Switch a vision mixer input to Program (on-air) with transition style (cut/mix/dip/wipe/sting) and duration |
| **Set Input to Preview** | Set a vision mixer input to Preview (PVW) for cueing |
| **Take Next** | Advance the rundown and take the cued item on-air with either the item's default transition or an explicit transition style and duration |
| **Move Next Forward** | Move the cued rundown item one step forward without taking it on-air |
| **Move Next Backward** | Move the cued rundown item one step backward without taking it on-air |
| **Take Latest Live to Preview** | Cue the most recently played live/Extern input as the next temporary preview item |
| **Take Latest SS/DVE to Preview** | Cue the most recently played SuperSource or DVE input as the next temporary preview item |
| **Run Function** | Execute a Falcon Play automation function/macro |
| **Play Graphic Scene** | Play a saved CasparCG graphic scene |
| **Stop Graphic** | Stop a graphic on a specific Graphic Engine (A–Z) and layer (with out-animation) |
| **Clear Graphic** | Clear (instantly remove) a graphic from a Graphic Engine (A–Z) and layer |
| **Stop All Graphic Layers** | Stop all graphic layers on a Graphic Engine (A–Z) |
| **Clear All Graphic Layers** | Clear all graphic layers on a Graphic Engine (A–Z) |
| **Load Video** | Cue a video without playing |
| **Play Video (Simple)** | Trigger play on an already loaded video channel/layer |
| **Play Video** | Play a video file on a CasparCG server channel/layer |
| **Stop Video** | Stop a video on a server/layer |
| **Clear Video** | Clear (remove) a video from a server/layer |

## Feedbacks

| Feedback | Description |
|---|---|
| Server Connected | True when the Falcon Play server is reachable |
| Device Connected | True when a specific device (Vision Mixer, Media Player, Sound Mixer, Video Hub) is connected |
| Input On Air | True when a specific input is currently on-air |

## Variables

| Variable | Description |
|---|---|
| `server_version` | Falcon Play server version |
| `rundown_name` | Active rundown name |
| `onair_item` | Currently on-air item |
| `cued_item` | Currently cued item |
| `vision_mixer_connected` | Vision Mixer connection status |
| `media_player_connected` | Media Player connection status |
| `sound_mixer_connected` | Sound Mixer connection status |
| `video_hub_connected` | Video Hub connection status |
| `file_server_online` | File Server online status |

## Development

```bash
# Install dependencies
yarn install

# Format code
yarn format

# Build module package
yarn package
```

## License

MIT
