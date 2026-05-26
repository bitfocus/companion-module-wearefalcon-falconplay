# Falcon Play Server - Required REST API Endpoints

This document specifies all REST API endpoints required by the **Companion Module for Falcon Play Server** (v1.0.0+).

The Companion module polls status every 2 seconds and refreshes lists (inputs, functions, scenes, videos) every 10 seconds. All responses must follow the standard response format.

---

## Standard Response Format

All endpoints must return JSON with the following structure:

### Success Response
```json
{
  "ok": true,
  "...": "endpoint-specific fields"
}
```

### Error Response
```json
{
  "ok": false,
  "error": "Human-readable error message"
}
```

HTTP Status Codes:
- `200` — Success
- `400` — Bad request (missing/invalid parameters)
- `404` — Resource not found
- `500` — Server error
- `503` — Device/service not connected

Notes:
- The Companion module only requires the top-level `ok` field plus the endpoint-specific payload fields documented below.
- Do not wrap successful payloads inside a mandatory `data` object unless the endpoint is updated in the module to expect that shape.

---

## Companion Action to Endpoint Mapping

This is the exact API surface currently used by the Companion module.

| Companion action | Method | Endpoint | Request body |
|---|---|---|---|
| Switch Input (Program) | `POST` | `/api/visionMixer/onAir` | `{ input, transitionStyle, transitionDuration }` |
| Set Input to Preview | `POST` | `/api/visionMixer/preview` | `{ input }` |
| Take Next | `POST` | `/api/rundown/take` | `{}` or `{ transitionStyle, transitionDuration }` |
| Move Next Forward | `POST` | `/api/rundown/move-next-forward` | `{}` |
| Move Next Backward | `POST` | `/api/rundown/move-next-backward` | `{}` |
| Take Latest Live to Preview | `POST` | `/api/rundown/latest-extern-to-preview` | `{}` |
| Take Latest SS/DVE to Preview | `POST` | `/api/rundown/latest-ss-dve-to-preview` | `{}` |
| Run Function | `POST` | `/api/function/run` | `{ functionUid }` |
| Play Graphic Scene | `POST` | `/api/scene/play` | `{ sceneId }` |
| Stop Graphic | `POST` | `/api/scene/stop` | `{ graphicChannel, graphicLayer }` |
| Clear Graphic | `POST` | `/api/scene/clear` | `{ graphicChannel, graphicLayer }` |
| Stop All Graphic Layers | `POST` | `/api/scene/stop` | `{ graphicChannel, graphicLayer: -1 }` |
| Clear All Graphic Layers | `POST` | `/api/scene/clear` | `{ graphicChannel, graphicLayer: -1 }` |
| Load Video | `POST` | `/api/media/load` | `{ videofile, server, layer }` |
| Play Video (Simple) | `POST` | `/api/media/play` | `{ server, layer }` |
| Play Video | `POST` | `/api/media/play` | `{ videofile, server, layer }` |
| Stop Video | `POST` | `/api/media/stop` | `{ server, layer }` |
| Clear Video | `POST` | `/api/media/clear` | `{ server, layer }` |

---

## Existing Endpoints (Currently Used)

### 1. Server Status
**Endpoint:** `GET /api/status`

**Frequency:** Called every 2 seconds

**Response:**
```json
{
  "ok": true,
  "version": "0.8.6",
  "fileServer": {
    "online": true,
    "ip": "192.168.1.100",
    "version": "1.2.0"
  },
  "devices": {
    "visionMixer": true,
    "mediaPlayer": true,
    "soundMixer": true,
    "videoHub": false
  },
  "rundown": {
    "id": "abc123",
    "name": "Evening Show",
    "onAirUID": "item_uid_1",
    "cuedUID": "item_uid_2"
  },
  "activeItem": {
    "uid": "item_uid_1",
    "name": "Intro Sequence",
    "label": "Intro",
    "input": 1
  },
  "cuedItem": {
    "uid": "item_uid_2",
    "name": "Camera 2",
    "label": "Cam 2",
    "input": 2
  }
}
```

---

### 2. List Endpoints
#### `GET /api/inputs`
Returns all vision mixer inputs (cameras, SuperSources, etc.)

**Response:**
```json
{
  "ok": true,
  "count": 8,
  "inputs": [
    {
      "input": 1,
      "name": "CAM 1",
      "shortName": "C1",
      "subtype": "input"
    },
    {
      "input": 6010,
      "name": "SuperSource 1",
      "shortName": "SS1",
      "subtype": "SuperSource"
    }
  ]
}
```

#### `GET /api/functions`
Returns all Falcon Play automation functions

**Response:**
```json
{
  "ok": true,
  "count": 5,
  "functions": [
    {
      "uid": "k7f2m9x1a",
      "name": "Open Show",
      "description": "Plays intro sequence"
    }
  ]
}
```

#### `GET /api/scenes`
Returns all saved graphic scenes (CasparCG templates)

**Response:**
```json
{
  "ok": true,
  "count": 12,
  "scenes": [
    {
      "id": "a1b2c3d4e",
      "name": "Lower Third - John Doe",
      "templateName": "LowerThird",
      "graphicChannel": "A",
      "graphicLayer": 1
    }
  ]
}
```

#### `GET /api/media/videos`
Returns all available video files

**Response:**
```json
{
  "ok": true,
  "count": 42,
  "videos": [
    "INTRO.mp4",
    "VT_Interview.mov",
    "BUMPER_01.mp4"
  ]
}
```

---

### 3. Vision Mixer Control (Program/Preview)
#### `POST /api/visionMixer/onAir`
Switch a vision mixer input to **Program (on-air)**

**Request:**
```json
{
  "input": 1,
  "transitionStyle": "cut",
  "transitionDuration": 0
}
```

**Parameters:**
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `input` | number | Yes | — | Vision mixer input number |
| `transitionStyle` | string | No | `"cut"` | `"cut"`, `"mix"`, `"dip"`, `"wipe"`, `"sting"` |
| `transitionDuration` | number | No | `0` | Duration in frames |

**Response:**
```json
{ "ok": true }
```

---

## New Endpoints and Required Endpoint Enhancements

### 4. Vision Mixer Preview Control (NEW)
#### `POST /api/visionMixer/preview`
Switch a vision mixer input to **Preview (PVW)**

**Request:**
```json
{
  "input": 2
}
```

**Parameters:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `input` | number | Yes | Vision mixer input number |

**Response:**
```json
{ "ok": true }
```

**Errors:**
- `400` — Missing `input`
- `404` — Input not found
- `503` — Vision mixer not connected

---

### 5. Function Execution
#### `POST /api/function/run`
Execute a Falcon Play automation function

**Request:**
```json
{
  "functionUid": "k7f2m9x1a"
}
```

**Parameters:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `functionUid` | string | Yes | The UID from `/api/functions` |

**Response:**
```json
{ "ok": true }
```

---

### 6. Graphic Scene Control
#### `POST /api/scene/play`
Play a graphic scene (CasparCG template)

**Request:**
```json
{
  "sceneId": "a1b2c3d4e"
}
```

**Parameters:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `sceneId` | string | Yes | The ID from `/api/scenes` |

**Response:**
```json
{ "ok": true, "scene": "Lower Third - John Doe" }
```

---

#### `POST /api/scene/stop` (NEW)
Stop (take off) a graphic with out-animation

**Request:**
```json
{
  "graphicChannel": "A",
  "graphicLayer": 1
}
```

**Alternative (stop all layers):**
```json
{
  "graphicChannel": "A",
  "graphicLayer": -1
}
```

**Parameters:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `graphicChannel` | string | Yes | Graphic engine: `"A"` to `"Z"` |
| `graphicLayer` | number | Yes | Layer number (1–100), or `-1` for all layers |

**Response:**
```json
{ "ok": true }
```

**Errors:**
- `400` — Missing parameters
- `404` — Graphic channel/layer not found
- `503` — Graphics server not connected

---

#### `POST /api/scene/clear` (NEW)
Clear (instantly remove) a graphic

**Request:**
```json
{
  "graphicChannel": "A",
  "graphicLayer": 1
}
```

**Alternative (clear all layers):**
```json
{
  "graphicChannel": "A",
  "graphicLayer": -1
}
```

**Parameters:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `graphicChannel` | string | Yes | Graphic engine: `"A"` to `"Z"` |
| `graphicLayer` | number | Yes | Layer number (1–100), or `-1` for all layers |

**Response:**
```json
{ "ok": true }
```

---

### 7. Video Playback Control
#### `POST /api/media/play`
Play a video file

**Request:**
```json
{
  "videofile": "INTRO.mp4",
  "server": "A",
  "layer": 1
}
```

**Parameters:**
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `videofile` | string | Yes | — | Video filename from `/api/media/videos` |
| `server` | string | No | `"A"` | Video server channel (`"A"` to `"D"`) |
| `layer` | number | No | `1` | CasparCG layer number (1–100) |

**Response:**
```json
{ "ok": true }
```

This endpoint should also support a second mode where a previously loaded video is started by channel/layer only.

**Alternate request for Play Video (Simple):**
```json
{
  "server": "A",
  "layer": 1
}
```

In this mode, Falcon Play should start playback of the media already loaded/cued on that output.

---

#### `POST /api/media/load`
Cue (load) a video without playing

**Request:**
```json
{
  "videofile": "INTRO.mp4",
  "server": "A",
  "layer": 1
}
```

**Parameters:** Same as `/api/media/play`

**Response:**
```json
{ "ok": true }
```

---

#### `POST /api/media/stop` (EXISTING)
Stop a video

**Request:**
```json
{
  "server": "A",
  "layer": 1
}
```

**Parameters:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `server` | string | No | Video server channel (default: `"A"`) |
| `layer` | number | No | Layer number (default: `1`) |

**Response:**
```json
{ "ok": true }
```

---

#### `POST /api/media/clear` (EXISTING)
Remove a video completely

**Request:**
```json
{
  "server": "A",
  "layer": 1
}
```

**Parameters:** Same as `/api/media/stop`

**Response:**
```json
{ "ok": true }
```

---

### 8. Rundown Control
#### `POST /api/rundown/take`
Advance the rundown (take cued item on-air)

**Request:**
```json
{
  "transitionStyle": "cut",
  "transitionDuration": 0
}
```

**Alternate request using the item's default transition:**
```json
{}
```

**Parameters:**
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `transitionStyle` | string | No | item default | `"cut"`, `"mix"`, `"dip"`, `"wipe"`, `"sting"`; omit to use the cued item's own configured transition |
| `transitionDuration` | number | No | item default | Duration in frames; only sent when `transitionStyle` is explicitly set |

**Response:**
```json
{ "ok": true }
```

**Errors:**
- `400` — No rundown active
- `503` — Rundown manager not connected

---

#### `POST /api/rundown/move-next-forward`
Move the cued item one step forward in the active rundown without taking it on-air.

**Request:**
```json
{}
```

**Response:**
```json
{
  "ok": true,
  "moved": true,
  "cuedUID": "abc123",
  "cuedIndex": 7,
  "itemName": "My Next Item"
}
```

**Parameters:** None

**Response fields:**
| Field | Type | Notes |
|---|---|---|
| `ok` | boolean | True when request was processed |
| `moved` | boolean | False when cue is already at the last item |
| `cuedUID` | string | UID of the cued item after the operation |
| `cuedIndex` | number | 0-based cue index after the operation |
| `itemName` | string or null | Name of the cued item after the operation |

**Errors:**
- `400` — No rundown is on-air or the rundown is empty
- `500` — Internal server error

#### `POST /api/rundown/move-next-backward`
Move the cued item one step backward in the active rundown without taking it on-air.

**Request:**
```json
{}
```

**Response:**
```json
{
  "ok": true,
  "moved": true,
  "cuedUID": "abc123",
  "cuedIndex": 5,
  "itemName": "Previous Item"
}
```

**Parameters:** None

**Response fields:** Same as `/api/rundown/move-next-forward`

**Errors:**
- `400` — No rundown is on-air or the rundown is empty
- `500` — Internal server error

**Behavior notes for both move endpoints:**
- These operations adjust cue position only; they do not trigger playback or transition.
- They use force-cue semantics internally.
- They clamp at the rundown boundaries.
- At the boundaries, return `ok: true` and `moved: false`.

---

#### `POST /api/rundown/latest-extern-to-preview`
Cue the most recently played live/Extern input as the next temporary preview item.

**Request:**
```json
{}
```

**Response:**
```json
{
  "ok": true,
  "uid": "a3f9c2x1b",
  "name": "EXT 1"
}
```

**Response fields:**
| Field | Type | Notes |
|---|---|---|
| `uid` | string | UID of the inserted temporary preview item |
| `name` | string | Name of the inserted input |

**Errors:**
- `400` — No on-air rundown, or no on-air item to insert after
- `404` — No Extern input found in the played history of the active rundown

**Behavior:**
- Searches backward through the played history, starting at the current on-air item.
- Inserts a temporary preview item immediately after the current on-air item.
- Replaces any existing temporary item at the preview position.
- Force-cues the new temporary item as next.
- Does not perform TAKE or transition by itself.

#### `POST /api/rundown/latest-ss-dve-to-preview`
Cue the most recently played SuperSource or DVE input as the next temporary preview item.

**Request:**
```json
{}
```

**Response:**
```json
{
  "ok": true,
  "uid": "b7d1e4m2c",
  "name": "SuperSource 1"
}
```

**Response fields:** Same as `/api/rundown/latest-extern-to-preview`

**Errors:**
- `400` — No on-air rundown, or no on-air item to insert after
- `404` — No SuperSource or DVE input found in the played history of the active rundown

**Behavior:**
- Searches backward through the played history for the latest input with subtype `SuperSource` or `DVE`.
- Inserts and force-cues a temporary preview item.
- Replaces any existing temporary item at the preview position.
- Does not perform TAKE or transition by itself.

---

## Summary of What Falcon Play Must Support

The following items must be implemented for full Companion module compatibility:

| Endpoint | Method | Type | Purpose | Priority |
|---|---|---|---|---|
| `/api/visionMixer/preview` | `POST` | New endpoint | Set input to Preview/PVW | **HIGH** |
| `/api/scene/stop` | `POST` | New endpoint | Stop graphic(s) with animation | **HIGH** |
| `/api/scene/clear` | `POST` | New endpoint | Clear graphic(s) instantly | **HIGH** |
| `/api/media/play` | `POST` | Enhance existing endpoint | Accept both `{ videofile, server, layer }` and `{ server, layer }` | **HIGH** |
| `/api/rundown/take` | `POST` | Enhance existing endpoint | Accept `{}` for item default transition or `{ transitionStyle, transitionDuration }` | **HIGH** |
| `/api/rundown/move-next-forward` | `POST` | New endpoint | Move cued item one step forward | **HIGH** |
| `/api/rundown/move-next-backward` | `POST` | New endpoint | Move cued item one step backward | **HIGH** |
| `/api/rundown/latest-extern-to-preview` | `POST` | New endpoint | Cue latest live/Extern item to preview | **HIGH** |
| `/api/rundown/latest-ss-dve-to-preview` | `POST` | New endpoint | Cue latest SuperSource or DVE item to preview | **HIGH** |

All other endpoints are already implemented or already match the Companion module's expectations.

## Endpoint Checklist

Falcon Play should support the following complete set for this Companion module:

- `GET /api/status`
- `GET /api/inputs`
- `GET /api/functions`
- `GET /api/scenes`
- `GET /api/media/videos`
- `POST /api/visionMixer/onAir`
- `POST /api/visionMixer/preview`
- `POST /api/function/run`
- `POST /api/scene/play`
- `POST /api/scene/stop`
- `POST /api/scene/clear`
- `POST /api/media/load`
- `POST /api/media/play`
- `POST /api/media/stop`
- `POST /api/media/clear`
- `POST /api/rundown/take`
- `POST /api/rundown/move-next-forward`
- `POST /api/rundown/move-next-backward`
- `POST /api/rundown/latest-extern-to-preview`
- `POST /api/rundown/latest-ss-dve-to-preview`

---

## Testing Guide

To verify endpoints are working:

```bash
# Test status endpoint
curl http://localhost/api/status

# Test set preview
curl -X POST http://localhost/api/visionMixer/preview \
  -H "Content-Type: application/json" \
  -d '{"input": 1}'

# Test take next using item default transition
curl -X POST http://localhost/api/rundown/take \
  -H "Content-Type: application/json" \
  -d '{}'

# Test take next using explicit transition
curl -X POST http://localhost/api/rundown/take \
  -H "Content-Type: application/json" \
  -d '{"transitionStyle": "mix", "transitionDuration": 25}'

# Test move next forward
curl -X POST http://localhost/api/rundown/move-next-forward \
  -H "Content-Type: application/json" \
  -d '{}'

# Test move next backward
curl -X POST http://localhost/api/rundown/move-next-backward \
  -H "Content-Type: application/json" \
  -d '{}'

# Test latest live/Extern to preview
curl -X POST http://localhost/api/rundown/latest-extern-to-preview \
  -H "Content-Type: application/json" \
  -d '{}'

# Test latest SS/DVE to preview
curl -X POST http://localhost/api/rundown/latest-ss-dve-to-preview \
  -H "Content-Type: application/json" \
  -d '{}'

# Test stop graphic
curl -X POST http://localhost/api/scene/stop \
  -H "Content-Type: application/json" \
  -d '{"graphicChannel": "A", "graphicLayer": 1}'

# Test clear all graphics on channel A
curl -X POST http://localhost/api/scene/clear \
  -H "Content-Type: application/json" \
  -d '{"graphicChannel": "A", "graphicLayer": -1}'
```

---

## Implementation Notes

1. **Authentication:** Current implementation assumes local network with no authentication. If adding auth, update Companion module config.
2. **Error Handling:** Always return `ok: false` with descriptive error message for any failure.
3. **Timeout:** Companion expects responses within 5 seconds. Avoid long-running operations on these endpoints.
4. **Polling:** Status endpoint is called frequently (every 2s); keep response payload minimal and updates fast.
5. **List Updates:** Inputs, functions, scenes, and videos are refreshed every 10 seconds; caching is acceptable.
6. **Program vs rundown transitions:** `POST /api/visionMixer/onAir` always receives explicit transition settings from Companion, while `POST /api/rundown/take` may receive either explicit transition settings or an empty body to mean "use the item's default transition".
7. **Cue move operations:** `POST /api/rundown/move-next-forward` and `POST /api/rundown/move-next-backward` should be safe to call repeatedly and should return updated cue metadata so Companion can log or display the result.
8. **Latest-to-preview operations:** `POST /api/rundown/latest-extern-to-preview` and `POST /api/rundown/latest-ss-dve-to-preview` should insert a temporary preview item and return the new item's `uid` and `name`.
