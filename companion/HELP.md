# Falcon Play Server – Companion Module

This module controls **Falcon Play Server** via its REST API.

## Configuration

- **Host:** IP address of the Falcon Play Server (default: `127.0.0.1`)
- **Port:** HTTP port (default: `80`)

## Actions

| Action                            | Description                                                                                                                              |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Switch Input (Program)**        | Switch a vision mixer input to Program (on-air) with transition style                                                                    |
| **Set Input to Preview**          | Set a vision mixer input to Preview (PVW) for cueing                                                                                     |
| **Take Next**                     | Advance the rundown and take the cued item on-air with either the item's default transition or an explicit transition style and duration |
| **Move Next Forward**             | Move the cued rundown item one step forward without taking it on-air                                                                     |
| **Move Next Backward**            | Move the cued rundown item one step backward without taking it on-air                                                                    |
| **Take Latest Live to Preview**   | Cue the most recently played live/Extern input as the next temporary preview item                                                        |
| **Take Latest SS/DVE to Preview** | Cue the most recently played SuperSource or DVE input as the next temporary preview item                                                 |
| **Run Function**                  | Execute a Falcon Play automation function/macro                                                                                          |
| **Play Graphic Scene**            | Play a saved CasparCG graphic scene                                                                                                      |
| **Stop Graphic**                  | Stop a graphic on a specific Graphic Engine (A-Z) and layer                                                                              |
| **Clear Graphic**                 | Clear (instantly remove) a graphic from a specific Graphic Engine (A-Z) and layer                                                        |
| **Stop All Graphic Layers**       | Stop all graphic layers on a Graphic Engine (A-Z)                                                                                        |
| **Clear All Graphic Layers**      | Clear all graphic layers on a Graphic Engine (A-Z)                                                                                       |
| **Load Video**                    | Cue a video without playing                                                                                                              |
| **Play Video (Simple)**           | Trigger play on an already loaded video channel/layer                                                                                    |
| **Play Video**                    | Play a video file on a CasparCG server channel/layer                                                                                     |
| **Stop Video**                    | Stop a video on a server/layer                                                                                                           |
| **Clear Video**                   | Clear (remove) a video from a server/layer                                                                                               |
| **Play Subitem Button**           | Play the current subitem in a configured button position                                                                                 |
| **Play Favorite Button**          | Play the current favorite in position 1–99                                                                                               |

## Feedbacks

| Feedback                                         | Description                                                                                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Server Connected**                             | True when the Falcon Play server is reachable                                                                                                                            |
| **Device Connected**                             | True when a specific device (Vision Mixer, Media Player, Sound Mixer, Video Hub) is connected                                                                            |
| **Input On Air**                                 | True when a specific input is currently on-air                                                                                                                           |
| **Item Text**                                    | Writes any combination of the name and first two graphic variables onto the button. Choose on air, cued, selected, a subitem slot, or a favorite position as the source. |
| **Subitem Thumbnail**                            | Shows the current slot's picture above or behind the button text.                                                                                                        |
| **Subitem Available / Playing / Cued / Played**  | State of a configured Subitem Button                                                                                                                                     |
| **Favorite Text / Favorite Thumbnail**           | Dynamic text and images for a Favorite position                                                                                                                          |
| **Favorite Available / Playing / Cued / Played** | State of a Favorite position                                                                                                                                             |
| **File Server Online**                           | File server connection state                                                                                                                                             |
| **Rundown On Air / Item Cued / Item Selected**   | Rundown and Director selection state                                                                                                                                     |

Add **Item Text** to a button's feedbacks to display changing text. The default uses the first saved variable's `default` value for a graphic scene, or the item name if that value is empty. It reports the configured value, not text read back from the rendered graphic. A missing item or lost connection clears the text. New **Subitem Buttons** presets include this feedback and the play action automatically.

Choose **First and Second Graphic Variable** to display the first two saved values on separate lines. Empty values are omitted. Each text source also provides `_second_variable_name` and `_second_variable_value` variables.

Choose **First and Second Graphic Variable, Otherwise Item Name** to use the item name when both graphic values are empty. If one value is filled, that value is shown alone. Items without graphic values also show their name.

Choose **No Text** to show the thumbnail without a button text overlay. Enable **Show Thumbnail** and use **Image Behind Text** for the larger image layout.

All combinations of **Item Name**, **First Graphic Variable**, and **Second Graphic Variable** are available, including **Item Name and Second Graphic Variable** and **Item Name and First and Second Graphic Variable**. Each selected part gets its own line, with empty parts omitted.

For a subitem source, enable **Show Thumbnail** in **Item Text**. **Image Above Text** leaves the lower part of the button free for text; **Image Behind Text** uses a larger image with text over it. **Subitem Thumbnail** provides the same image as a separate feedback. New Subitem Button presets include it automatically. JPEG and PNG are supported on Companion 4. Thumbnails update with the selected story and are revalidated every 15 seconds; unavailable slots and lost connections remove the image override.

## Input selection

New Program/Preview input selections use Falcon Play logical input names, so SuperSource/DVE layouts sharing a physical mixer input remain distinct. Input On Air uses the same selection. Existing buttons with numeric input values keep their physical-input behavior. New selections require Falcon Play to accept `inputName` on its Program/Preview routes.

## Variables

Use your connection label when entering a variable, for example:

```text
$(FalconPlay:onair_item_display_text)
$(FalconPlay:subitem_1_name)
$(FalconPlay:favorite_99_display_text)
```

### Server, rundown, selection, and devices

| Variable                              | Description                                 |
| ------------------------------------- | ------------------------------------------- |
| `server_connected`                    | Falcon Play Connected                       |
| `server_version`                      | Server Version                              |
| `rundown_id`                          | Active Rundown ID                           |
| `rundown_name`                        | Active Rundown Name                         |
| `rundown_onair_uid`                   | Rundown On-Air UID                          |
| `rundown_cued_uid`                    | Rundown Cued UID                            |
| `onair_item`                          | On-Air Item                                 |
| `onair_item_uid`                      | On-Air Item UID                             |
| `onair_item_type`                     | On-Air Item Type                            |
| `cued_item`                           | Cued Item                                   |
| `cued_item_uid`                       | Cued Item UID                               |
| `cued_item_type`                      | Cued Item Type                              |
| `selected_item`                       | Selected Item                               |
| `selected_item_uid`                   | Selected Item UID                           |
| `selected_item_type`                  | Selected Item Type                          |
| `selected_story_id`                   | Selected Story ID                           |
| `favorite_count`                      | Full Favorites list count                   |
| `favorites_revision`                  | Favorites Revision                          |
| `subitem_button_count`                | Configured Subitem Button Count             |
| `vision_mixer_connected`              | Vision Mixer Connected                      |
| `media_player_connected`              | Media Player Connected                      |
| `sound_mixer_connected`               | Sound Mixer Connected                       |
| `video_hub_connected`                 | Video Hub Connected                         |
| `file_server_online`                  | File Server Online                          |
| `file_server_ip`                      | File Server IP                              |
| `file_server_version`                 | File Server Version                         |
| `onair_item_first_variable_name`      | On-Air Item First Graphic Variable Name     |
| `onair_item_first_variable_value`     | On-Air Item First Graphic Variable Value    |
| `onair_item_second_variable_name`     | On-Air Item Second Graphic Variable Name    |
| `onair_item_second_variable_value`    | On-Air Item Second Graphic Variable Value   |
| `onair_item_display_text`             | On-Air Item Display Text                    |
| `cued_item_first_variable_name`       | Cued Item First Graphic Variable Name       |
| `cued_item_first_variable_value`      | Cued Item First Graphic Variable Value      |
| `cued_item_second_variable_name`      | Cued Item Second Graphic Variable Name      |
| `cued_item_second_variable_value`     | Cued Item Second Graphic Variable Value     |
| `cued_item_display_text`              | Cued Item Display Text                      |
| `selected_item_first_variable_name`   | Selected Item First Graphic Variable Name   |
| `selected_item_first_variable_value`  | Selected Item First Graphic Variable Value  |
| `selected_item_second_variable_name`  | Selected Item Second Graphic Variable Name  |
| `selected_item_second_variable_value` | Selected Item Second Graphic Variable Value |
| `selected_item_display_text`          | Selected Item Display Text                  |

The first and second graphic variables follow saved scene field order and use each field's configured default value. Display text uses the first field's value when non-empty or falls back to the item name; it does not skip to a later field. These values describe configured scene data, not text read back from rendered output. Connection and state variables report `Yes` or `No`.

### Subitem and Favorite positions

Replace `N` with the numbered position. Subitem variables follow the number of configured Subitem Buttons. Favorites always expose positions **1–99**, including empty positions; `favorite_count` reports the full Falcon Play list count, which has no fixed limit.

| Subitem variable                  | Favorite variable                  | Description                   |
| --------------------------------- | ---------------------------------- | ----------------------------- |
| `subitem_N_name`                  | `favorite_N_name`                  | Name                          |
| `subitem_N_uid`                   | `favorite_N_uid`                   | UID                           |
| `subitem_N_type`                  | `favorite_N_type`                  | Type                          |
| `subitem_N_first_variable_name`   | `favorite_N_first_variable_name`   | First Graphic Variable Name   |
| `subitem_N_first_variable_value`  | `favorite_N_first_variable_value`  | First Graphic Variable Value  |
| `subitem_N_second_variable_name`  | `favorite_N_second_variable_name`  | Second Graphic Variable Name  |
| `subitem_N_second_variable_value` | `favorite_N_second_variable_value` | Second Graphic Variable Value |
| `subitem_N_display_text`          | `favorite_N_display_text`          | Display Text                  |
| `subitem_N_thumbnail_url`         | `favorite_N_thumbnail_url`         | Thumbnail URL                 |
| `subitem_N_thumbnail`             | `favorite_N_thumbnail`             | Thumbnail Image               |
| `subitem_N_available`             | `favorite_N_available`             | Available                     |
| `subitem_N_playing`               | `favorite_N_playing`               | Playing                       |
| `subitem_N_cued`                  | `favorite_N_cued`                  | Cued                          |
| `subitem_N_played`                | `favorite_N_played`                | Played                        |

`thumbnail_url` is the full image URL. `thumbnail` is a cached JPEG/PNG data URI for compatible Companion Image graphics elements; the thumbnail feedbacks render directly on buttons without requiring an Image graphics element. Active images remain cached across all 99 Favorite positions and configured Subitems and are revalidated every 15 seconds. Unsupported formats such as WebP are not downloaded as image bodies or published as button images.

Favorite `played` records a successful trigger during the current server session. `playing` and `cued` depend on the runtime state available to Falcon Play. Missing items and disconnected status clear dynamic text, images, and state values.

## Favorites (positions 1–99 in Companion)

In Falcon Play, right-click a video, saved graphic scene, or function and select the star to add/remove a favorite. Yellow means saved, white means not saved. The shared **Favorites** control-bar tab uses the Subitems card layout. Drag a card's numbered ↔ handle left or right to change its position. The server saves the order across sessions and shares it with all connected Directors and Companion instances.

Use **Play Favorite Button** to select a position from 1 to 99. **Favorite Text** includes all Item Text formats, including **No Text**, and an optional thumbnail. **Favorite Thumbnail** and Available/Playing/Cued/Played feedbacks can also be added separately. The **Favorites** presets contain 99 buttons with action, text, thumbnail, and state feedbacks. Variables `favorite_N_*`, `favorite_count`, and `favorites_revision` follow the saved order. Empty/missing sources clear the button text/image, and a stale button press is rejected after a move.

Falcon Play has no fixed Favorites count limit. Companion exposes the first 99 positions; move a later favorite into positions 1–99 to use it there.
