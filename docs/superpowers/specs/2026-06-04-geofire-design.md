# GeoFire — Design Spec
_Date: 2026-06-04_

## Overview

Standalone open-source Vue 3 + Vite single-page app. Generalized GeoJSON location trail simulator. Users draw trails on a map, configure an HTTP POST endpoint, and fire GeoJSON features point-by-point or in batches. Replaces the original Map.vue component extracted from a private project.

---

## Stack

- **Vue 3** (Composition API, `<script setup>`) — NOT Vue 2
- **Vite** — build tool
- **Leaflet** + `@geoman-io/leaflet-geoman-free` + `leaflet-rotatedmarker`
- **@turf/turf** — distance/heading/chunking
- **moment** — time manipulation
- **random-location** — error-circle point generation
- **sweetalert2** — circle-area dialog
- **downloadjs** — GeoJSON file export
- **Custom CSS only** — no UI framework (no Ant Design, no Vuetify)

---

## Architecture

Feature-split components. `App.vue` owns all shared state and coordinates children via props + emits.

```
src/
  main.js
  App.vue                   # root state owner
  composables/
    useGeoJSON.js           # trail CRUD, undo, time-shift logic
    useFireEngine.js        # setInterval fire loop (pointRate + reportRate)
    useStorage.js           # localStorage: config persist + named sessions
  components/
    ConfigPanel.vue         # endpoint, headers, default props, fire settings, sessions
    MapView.vue             # Leaflet map, geoman controls, markers, popup trigger
    PointEditor.vue         # per-point custom props modal
    FireControls.vue        # start/pause/reset, progress, time-shift toolbar
    FireLog.vue             # terminal-style scrolling log
  assets/
    icons/                  # movement/stop SVGs (blue/green/orange/red)
    style/
      global.css            # CSS custom properties, reset, dark theme
      components.css        # shared component styles
```

---

## Data Model

### GeoJSON Feature (internal)

```js
{
  groupId: Number,
  leaflet_id: Number,        // internal only — stripped before POST
  type: "Feature",
  geometry: {
    type: "Point",
    coordinates: [lat, lng]
  },
  properties: {
    time: { utc: "ISO8601", tz: "IANA timezone" },
    speedKMH: Number,
    heading: Number | null,  // null = stopped
    locationMethod: "GNSS" | "LBS" | "BLP" | "Cache",
    accuracy: Number,        // meters
    lbsInfo: {               // only present if locationMethod === "LBS"
      subMethod: "Wifi" | "Cell" | "NONE",
      cellularsNumber: Number,
      hotspotsNumber: Number,
      cellularInfo: []
    },
    customProps: {           // per-point open key-value pairs
      [key: string]: string
    }
  }
}
```

### POST Body

`leaflet_id`, `groupId`, and `customProps` are stripped. `defaultCustomProps` (from config) and per-point `customProps` are merged flat into `properties`. Per-point key wins on collision.

```js
{
  type: "Feature",
  geometry: { type: "Point", coordinates: [lat, lng] },
  properties: {
    time, speedKMH, heading, locationMethod, accuracy,
    ...lbsInfo (if LBS),
    ...defaultCustomProps,
    ...customProps          // per-point overrides default
  }
}
```

### Config (persisted to localStorage key `geofire_config`)

```js
{
  endpointUrl: String,
  headers: [{ key: String, value: String }],
  defaultCustomProps: [{ key: String, value: String }]
}
```

### Named Sessions (persisted to localStorage key `geofire_sessions`)

```js
{
  [sessionName: string]: {
    savedAt: "ISO8601",
    geojson: FeatureCollection,
    config: Config
  }
}
```

---

## Components

### `ConfigPanel.vue`
Collapsible left sidebar. Sections:
- **Endpoint** — URL text input
- **Headers** — add/remove key-value rows (e.g. `Authorization: Bearer …`)
- **Default Custom Props** — add/remove key-value rows merged into every fired feature
- **Trail Settings** — speed (km/h), accuracy (m), logging rate (sec), location method dropdown, LBS sub-method (shown only if LBS selected)
- **Fire Settings** — pointRate interval (sec) OR reportRate batch (sec) radio toggle, timeout-between-days (sec)
- **Toggles** — mark-with-error, show-map, advance-trail-over-time (+ num-loops input)
- **Sessions** — save-as (name input), list of saved sessions with load/delete buttons

### `MapView.vue`
Full Leaflet map. Responsibilities:
- Init map with OpenStreetMap tiles
- Geoman draw controls: marker + circle only
- `pm:create` → compute line points via turf → emit `addFeatures`
- Render markers with directional rotation (leaflet-rotatedmarker)
- Marker colors: blue = pending, green = fired ok, orange = currently firing, red = error
- Marker click → emit `editPoint(featureIndex)` to open PointEditor
- Expose methods: `changeMarkerToGreen`, `changeMarkerToOrange`, `changeMarkerToRed`, `resetAllMarkers`, `zoomToLast`, `clearMarkers`

### `PointEditor.vue`
Modal overlay triggered by map marker click or point list click.
- Displays: time, speed, heading, locationMethod, accuracy (read-only)
- Custom props table: add row (key + value inputs), remove row, edit inline
- Save → emits `updatePointProps(featureIndex, customProps)`
- Cancel → closes without change

### `FireControls.vue`
Toolbar above map:
- Start / Pause|Continue / Reset buttons (state-driven disabled logic)
- Progress bar + `X of Y (Z%)` label
- Time-left estimate, current send-timestamp display
- Trail total duration display
- Advance-trail loop counter (`Loop X of Y`) when enabled
- Time-shift panel (toggle): original From/To date pickers (disabled) + new From/To pickers + Save/Cancel
- Toolbar action buttons: clear-all, time-shift toggle, download GeoJSON, zoom-to-last, undo-last-group, show/hide raw JSON
- Raw JSON panel: monospace pre block showing full geojson

### `FireLog.vue`
Terminal panel below map. Fixed height (200px), overflow-y scroll.
- Auto-sticks to bottom on new entries UNLESS user has manually scrolled up
- Scroll detection: if `scrollTop + clientHeight < scrollHeight - threshold` → user scrolled, disable auto-stick until user scrolls to bottom again
- Each log line: `[HH:mm:ss] → POST <url> … <status>` or `[HH:mm:ss] ✗ <error message>`
- Color: green = 2xx, red = network error or 4xx/5xx, grey = info/system messages
- Monospace font, `#0a0c10` background

---

## Composables

### `useGeoJSON.js`
- `geojson` — reactive FeatureCollection ref
- `addFeature(lat, lng, time, speed, groupId, addRand, locationMethod, setZero, accuracy, lbsSubMethod)` — computes heading, speed from previous point, creates feature + marker
- `removeGroup(groupId)` — undo last group
- `clearAll()` — reset geojson + map markers
- `changeTrailTimes(fromTime)` — shift all timestamps by duration delta
- `firstPointTime`, `lastPointTime`, `trailDuration` — computed

### `useFireEngine.js`
- `startFiring(geojson, config, callbacks)` — starts interval loop
- Supports `pointRate` and `reportRate` modes
- Timeout-between-days detection (day boundary check)
- Advance-trail-over-time loop
- `pause()` / `resume()` / `reset()`
- `progress` ref, `inPause` ref
- Callbacks: `onFire(featureIndex)`, `onSuccess(featureIndex, status)`, `onError(featureIndex, error)`, `onLog(entry)`
- Clean feature before POST: strip `leaflet_id`, `groupId`, `customProps`; merge defaultCustomProps + customProps flat

### `useStorage.js`
- `loadConfig()` / `saveConfig(config)` — localStorage `geofire_config`
- `loadSessions()` / `saveSession(name, geojson, config)` / `deleteSession(name)` — localStorage `geofire_sessions`

---

## Fire Logic Detail

### pointRate
```
setInterval(() => {
  feature = geojson.features[progress]
  POST cleanFeature to endpointUrl with headers
  → success: marker green, log green
  → error: marker red, log red
  
  if day boundary crossed AND fireTimeoutBetweenDaysSec > 0:
    hold progress until elapsed >= fireTimeoutBetweenDaysSec
  else:
    progress++
  
  if progress >= total:
    if advanceTrailOverTime AND loops remaining:
      shift trail times forward by deviceSamplingSeconds
      progress = 0, loopCount++
    else:
      clearInterval, done
}, fireTimeoutSec * 1000)
```

### reportRate
```
setInterval(() => {
  find all features in [currentTime, currentTime + fireBatchTimeoutSec)
  POST each in burst
  advance progress past batch window
  if done: clearInterval
}, fireBatchTimeoutSec * 1000)
```

---

## UI Theme

CSS custom properties (dark glassmorphism):

```css
--bg-base: #0d0f14
--bg-surface: rgba(255,255,255,0.04)
--bg-surface-hover: rgba(255,255,255,0.08)
--border: rgba(255,255,255,0.10)
--accent: #6366f1
--accent-success: #22c55e
--accent-error: #ef4444
--accent-warn: #f59e0b
--text-primary: #f1f5f9
--text-muted: #64748b
--radius: 8px
--blur: blur(12px)
```

- Sidebar: frosted glass card, `backdrop-filter: var(--blur)`
- Map: fills remaining viewport width
- Inputs: dark bg, accent focus ring, no browser defaults
- Buttons: pill shape, filled accent or ghost (border only) variants
- FireLog: monospace, `#0a0c10` bg, terminal feel
- frontend-design skill applied during implementation for full visual polish

---

## Features Removed vs Original

| Removed | Reason |
|---|---|
| Rules / Trigger Rule on Trail | App-specific, not generalizable |
| Mirror Device Serial Number | App-specific |
| Legacy Subject ID / sybaseOffenderID | App-specific |
| Environment selector (EnvironementSelectList) | Replaced by generic endpoint URL |
| `locationService.injectLocation()` | Replaced by direct `fetch()` to user endpoint |
| `appState` import | No global app state needed |

---

## Open Source Considerations

- MIT license
- README with setup, screenshots, GeoJSON format docs
- `.env.example` (none needed — all config in-app)
- No backend required — pure frontend
