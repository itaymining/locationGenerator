# 🔥 GeoFire

### ▶ [Try GeoFire live →](https://itaymining.github.io/GeoFire/)

Open-source GeoJSON location trail simulator. Draw trails on a map, configure any HTTP POST endpoint, and fire location points for testing and development purposes.

## Features

- **Draw trails** — click the map to place points; intermediate points auto-generated based on speed + logging rate
- **Circle area** — drop a circle to generate random stop/movement points within it
- **Upload GeoJSON** — load existing trail files
- **Configure endpoint** — POST to any URL with custom request headers (auth, API keys, etc.)
- **Custom default properties** — key-value pairs merged into every fired feature
- **Per-point custom properties** — click any marker to add open key-value pairs to that specific point
- **Fire modes** — point-by-point rate OR batch report rate
- **Day timeout** — pause between day-boundary crossings
- **Advance trail over time** — loop the trail shifting timestamps forward each cycle
- **Named sessions** — save/load/delete trails + config in localStorage
- **Time shift** — rescale all trail timestamps to a new start time
- **Terminal log** — live scrolling POST log with status codes, auto-sticks to bottom
- **Download** — export current trail as `.geojson` file
- **Location methods** — GNSS, LBS (Wifi/Cell sub-method), BLP, Cache

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:5173`

## GeoJSON Format

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [32.106, 34.834] },
      "properties": {
        "time": { "utc": "2024-01-01T10:00:00.000Z", "tz": "Asia/Jerusalem" },
        "speedKMH": 5,
        "accuracy": 12,
        "locationMethod": "GNSS"
      }
    }
  ]
}
```

## POST Payload

Each fired point is a clean GeoJSON Feature with `defaultCustomProps` and per-point `customProps` merged flat into `properties`:

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [32.106, 34.834] },
  "properties": {
    "time": { "utc": "...", "tz": "..." },
    "speedKMH": 5,
    "heading": 45,
    "locationMethod": "GNSS",
    "accuracy": 12,
    "myCustomKey": "myValue"
  }
}
```

## Tests

```bash
npm test
```

## License

MIT
