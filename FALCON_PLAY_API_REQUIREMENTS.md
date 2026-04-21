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
  "data": { ... }
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

## NEW ENDPOINTS REQUIRED (Not Yet Implemented)

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
  "layer": 1,
  "duration": 0
}
```

**Parameters:**
| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `videofile` | string | Yes | — | Video filename from `/api/media/videos` |
| `server` | string | No | `"A"` | Video server channel (`"A"` to `"D"`) |
| `layer` | number | No | `1` | CasparCG layer number (1–100) |
| `duration` | number | No | `0` | Duration in seconds; 0 = file duration |

**Response:**
```json
{ "ok": true }
```

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

**Parameters:** Same as `/api/media/play` (except no `duration`)

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
{}
```

**Parameters:** None

**Response:**
```json
{ "ok": true }
```

**Errors:**
- `400` — No rundown active
- `503` — Rundown manager not connected

---

## Summary of Missing Endpoints

The following endpoints must be added to Falcon Play Server for full Companion module compatibility:

| Endpoint | Method | Purpose | Priority |
|---|---|---|---|
| `/api/visionMixer/preview` | `POST` | Set input to Preview/PVW | **HIGH** |
| `/api/scene/stop` | `POST` | Stop graphic(s) with animation | **HIGH** |
| `/api/scene/clear` | `POST` | Clear graphic(s) instantly | **HIGH** |

All other endpoints are already implemented or use existing paths.

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
