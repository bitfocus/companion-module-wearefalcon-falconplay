# Falcon Play for Bitfocus Companion

Control **Falcon Play Server** from Companion and Stream Deck through Falcon Play's REST API. Trigger inputs, rundown items, graphics, videos, functions, Subitems, and Favorites, with live button text, thumbnails, state feedbacks, and variables.

## What's new in 1.2.0

Compared with 1.1.0, this release adds:

| Feature                            | What you can do                                                                                                                                                                 |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dynamic Subitem Buttons            | Trigger a position in the story selected in Director. Button names, graphic values, thumbnails, and state follow the current selection and the new on-air item after Take Next. |
| Favorites                          | Address positions **1–99** in Falcon Play's shared, saved Favorites list, with the same play, text, thumbnail, and state features as Subitems.                                  |
| Text feedback                      | Put the on-air, cued, selected, Subitem, or Favorite name and the first two graphic variables directly on a Companion button.                                                   |
| Text formats                       | Choose any combination of the item name and first/second graphic variables, automatic name fallbacks, or **No Text**.                                                           |
| Button thumbnails                  | Show JPEG/PNG thumbnails above the text or behind it, including on Companion 4 buttons.                                                                                         |
| Presets                            | Place a ready-to-use button for each configured Subitem Button or any of the 99 Favorite positions.                                                                             |
| More variables and state feedbacks | Follow rundown IDs, selection, file-server details, graphic values, and per-position availability, playing, cued, and played state.                                             |
| Logical input selection            | Select individual SuperSource/DVE layouts by their Falcon Play names, even when layouts share a physical mixer input. Existing numeric input actions remain supported.          |

See [release notes](RELEASE_NOTES_v1.2.0.md) for upgrade and compatibility details.

## Connection

Add a **We Are Falcon: Falcon Play** connection in Companion and configure:

| Setting | Default     | Description                                                                                   |
| ------- | ----------- | --------------------------------------------------------------------------------------------- |
| Host    | `127.0.0.1` | Falcon Play Server's IP address; use its LAN address when Companion runs on another computer. |
| Port    | `80`        | Falcon Play's HTTP port.                                                                      |

Status is polled every **2 seconds**. Input, function, scene, and video lists refresh every **10 seconds**. Button labels and state can therefore lag the Director selection by the polling interval.

The new features require Falcon Play to expose the extended `companion` status fields and Subitem/Favorite routes described in [Falcon Play API requirements](FALCON_PLAY_API_REQUIREMENTS.md). New logical input selections require support for `inputName` in the Program and Preview routes. Existing actions and numeric input selections retain their previous request formats.

## Quick start: Subitems

1. In Falcon Play, configure the required positions under **Keyboard → Subitems**.
2. Select a story or item in Director. The configured positions map to the Subitems shown in the control bar, in order.
3. In Companion, open **Presets → Subitem Buttons** and place the desired position on a button.

The preset includes **Play Subitem Button**, dynamic text, a thumbnail, and availability/playing feedbacks. A manually created button can use the same action and feedbacks.

Subitems follow Director's current highlighted item/story. After Take Next changes the on-air item, Falcon Play supplies the new context. Configured positions remain selectable when the current story has no matching item, but are unavailable. Subitem playback requires an active on-air rundown.

## Quick start: Favorites

1. In Falcon Play, right-click a video, saved graphic scene, or function and select its star. **Yellow** means favorite; **white** means not a favorite.
2. Open **Favorites** in Director's control bar. Drag the numbered handle left or right to set the order.
3. In Companion, place a button from **Presets → Favorites**, or add **Play Favorite Button** and select a position from **1 to 99**.

Falcon Play saves the shared list independently of the rundown and has **no fixed Favorites count limit**. Companion exposes the first 99 positions, including empty ones. To use a later favorite, move it into positions 1–99 in Director.

Reordering or removing a favorite changes the numbered positions for every connected Director and Companion instance. Actions include the UID from their latest status snapshot; Falcon Play rejects the request if the item at that position has changed before the request reaches it.

Library favorites use the current saved source. Removing that source leaves its favorite unavailable until the favorite is removed. Favorites created from rundown items retain their selected values as separate snapshots. Favorites can be triggered without an active rundown.

## Dynamic button text

Add **Item Text** to a button's feedbacks and choose **On Air**, **Cued**, **Selected**, **Subitem Button**, or **Favorite Button** as the source. **Favorite Text** provides the same options with the Favorite source already selected.

| Text option                                            | Result                                                                      |
| ------------------------------------------------------ | --------------------------------------------------------------------------- |
| First Graphic Variable, Otherwise Item Name            | First graphic value, falling back to the item name when empty; the default. |
| Item Name                                              | Item name only.                                                             |
| First Graphic Variable                                 | First graphic value only.                                                   |
| Second Graphic Variable                                | Second graphic value only.                                                  |
| First and Second Graphic Variable                      | Both graphic values.                                                        |
| First and Second Graphic Variable, Otherwise Item Name | Both graphic values, falling back to the item name when both are empty.     |
| Item Name and First Graphic Variable                   | Item name and first graphic value.                                          |
| Item Name and Second Graphic Variable                  | Item name and second graphic value.                                         |
| Item Name and First and Second Graphic Variable        | Item name and both graphic values.                                          |
| No Text                                                | Clears the text so the thumbnail can be shown without a text overlay.       |

Each selected part appears on its own line; empty parts are omitted. The first and second variables are the first two fields in the scene's saved variable order, using their configured `default` values. Empty fields are not replaced by later fields. These values describe the saved scene data; they are not text read back from the rendered graphic. Missing items and disconnected status clear the text.

For example, **First and Second Graphic Variable** can display:

```text
ANNA HOLM
REPORTER
```

## Button thumbnails

For a Subitem or Favorite source, enable **Show Thumbnail** in **Item Text** or **Favorite Text**. Alternatively, add **Subitem Thumbnail** or **Favorite Thumbnail** as a separate feedback.

- **Image Above Text** reserves space below the picture for text.
- **Image Behind Text** uses a larger image area, with text overlaid when present.
- **No Text** together with **Image Behind Text** gives a clean image button.

JPEG and PNG thumbnails are converted to small PNG button images. They follow the selected story or Favorite position, are cached, and are revalidated every **15 seconds**, including when the URL stays the same. Unavailable positions and lost connections remove the image override. Missing or unsupported images leave the button's normal style and text available. Downloads are limited to 1 MB per thumbnail.

## Actions

| Action                                             | Description                                                                                    |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Switch Input (Program)                             | Switch an input to Program using cut, mix, dip, wipe, or sting with a duration.                |
| Set Input to Preview                               | Set an input to Preview/PVW.                                                                   |
| Take Next                                          | Take the cued rundown item with its default transition or an explicit transition and duration. |
| Move Next Forward / Move Next Backward             | Move the rundown cue without taking an item on air.                                            |
| Take Latest Live to Preview                        | Cue the most recently played live/Extern input as the next temporary preview item.             |
| Take Latest SS/DVE to Preview                      | Cue the most recently played SuperSource or DVE input as the next temporary preview item.      |
| Run Function                                       | Execute a Falcon Play function/macro.                                                          |
| Play Graphic Scene                                 | Play a saved graphic scene.                                                                    |
| Stop Graphic / Clear Graphic                       | Stop with out-animation or instantly clear a specific graphic engine/layer.                    |
| Stop All Graphic Layers / Clear All Graphic Layers | Stop or clear every layer on a graphic engine.                                                 |
| Load Video                                         | Cue a video without playing.                                                                   |
| Play Video (Simple)                                | Start an already loaded video channel/layer.                                                   |
| Play Video                                         | Play a video file on a specified server channel/layer.                                         |
| Stop Video / Clear Video                           | Stop or clear a video channel/layer.                                                           |
| Play Subitem Button                                | Trigger the current item at a configured Subitem position.                                     |
| Play Favorite Button                               | Trigger the current item at Favorite position 1–99.                                            |

Program/Preview input dropdowns use Falcon Play's logical input names. This distinguishes multiple SuperSource or DVE layouts using the same mixer input. Buttons saved before this change retain their numeric physical-input behavior.

## Feedbacks

| Feedback                                                                       | Description                                                                   |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Server Connected                                                               | Falcon Play is reachable.                                                     |
| Device Connected                                                               | Connection state for a vision mixer, media player, sound mixer, or video hub. |
| Input On Air                                                                   | The selected logical input, or a legacy physical input, is on air.            |
| File Server Online                                                             | The file server is online.                                                    |
| Rundown On Air / Item Cued / Item Selected                                     | Rundown and Director selection state.                                         |
| Subitem Button Available / Subitem Playing / Subitem Cued / Subitem Played     | State of a configured Subitem position.                                       |
| Favorite Button Available / Favorite Playing / Favorite Cued / Favorite Played | State of a Favorite position.                                                 |
| Item Text / Favorite Text                                                      | Dynamic button text and optional Subitem/Favorite thumbnails.                 |
| Subitem Thumbnail / Favorite Thumbnail                                         | A separate thumbnail image feedback.                                          |

Favorite **Played** records a successful trigger in the current Falcon Play server session. **Playing** and **Cued** depend on the runtime state available to Falcon Play.

## Variables

Use the connection label when referencing variables, for example:

```text
$(FalconPlay:onair_item_display_text)
$(FalconPlay:subitem_1_name)
$(FalconPlay:favorite_1_display_text)
```

| Variable or group                                                                                  | Values                                                                                                                 |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `server_connected`, `server_version`                                                               | Falcon Play connection state and version.                                                                              |
| `rundown_id`, `rundown_name`, `rundown_onair_uid`, `rundown_cued_uid`                              | Active rundown identity and cue/on-air position.                                                                       |
| `onair_item`, `cued_item`, `selected_item`                                                         | Item name; each also provides `_uid` and `_type`.                                                                      |
| `selected_story_id`                                                                                | Director's selected story ID.                                                                                          |
| `vision_mixer_connected`, `media_player_connected`, `sound_mixer_connected`, `video_hub_connected` | Device connection states.                                                                                              |
| `file_server_online`, `file_server_ip`, `file_server_version`                                      | File-server details.                                                                                                   |
| `subitem_button_count`                                                                             | Number of configured Subitem Buttons.                                                                                  |
| `favorite_count`, `favorites_revision`                                                             | Total Favorites count and list revision.                                                                               |
| `onair_item_*`, `cued_item_*`, `selected_item_*`                                                   | `first_variable_name`, `first_variable_value`, `second_variable_name`, `second_variable_value`, and `display_text`.    |
| `subitem_N_*`, `favorite_N_*`                                                                      | Per-position fields listed below. Favorites always expose positions 1–99; Subitems follow the configured button count. |

Each position provides `name`, `uid`, `type`, `first_variable_name`, `first_variable_value`, `second_variable_name`, `second_variable_value`, `display_text`, `thumbnail_url`, `thumbnail`, `available`, `playing`, `cued`, and `played`.

`display_text` uses the first graphic value or falls back to the item name. `thumbnail_url` is the full image URL; `thumbnail` is a cached data URI for compatible Companion Image graphics elements. The thumbnail feedbacks render images directly on buttons without requiring an Image graphics element.

## Development

Use **Node.js 22.20 or newer within Node.js 22**, and **Yarn 4**. The package manager version is pinned in `package.json`.

```bash
corepack yarn install --immutable
corepack yarn test
corepack yarn exec prettier --check src test companion
corepack yarn package
```

The package command builds the distributable Companion module. Tests exercise payload compatibility, logical inputs, Subitems, Favorites, text formatting, thumbnail rendering, and stale/disconnected status behavior with mocked requests.

## License

MIT
