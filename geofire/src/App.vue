<template>
  <div class="app-layout">
    <ConfigPanel
      :config="config"
      :geojson="geojson"
      :is-firing="isRunning"
      @update-config="onUpdateConfig"
      @update-settings="onUpdateSettings"
      @load-session="onLoadSession"
    />

    <div class="app-main">
      <FireControls
        :geojson="geojson"
        :progress="progress"
        :in-pause="inPause"
        :is-running="isRunning"
        :process-loop-count="processLoopCount"
        :settings="settings"
        :first-point-time="firstPointTime"
        :trail-duration="trailDuration"
        @start="onStart"
        @pause="onPause"
        @reset="onReset"
        @clear-all="onClearAll"
        @undo="onUndo"
        @download="onDownload"
        @zoom-last="mapRef?.zoomToLast()"
        @toggle-raw="showRaw = !showRaw"
        @change-trail-times="onChangeTrailTimes"
      />

      <!-- File upload bar -->
      <div class="upload-bar">
        <label class="label" style="margin:0;white-space:nowrap">GeoJSON File:</label>
        <input
          type="file"
          accept=".geojson,.json"
          class="input input-sm"
          style="width:auto;flex:1"
          @change="onFileUpload"
        />
      </div>

      <div class="map-area">
        <MapView
          ref="mapRef"
          :geojson="geojson"
          :show-map="settings.showMap"
          :settings="settings"
          @add-features="onAddFeatures"
          @edit-point="onEditPoint"
        />
        <div v-if="showRaw" class="raw-json-panel">
          <div class="raw-json-head">
            <span class="raw-json-title"><span class="rj-dot"></span> RAW PAYLOAD</span>
            <span class="raw-json-count">{{ rawJsonPreview.features.length }} feat</span>
          </div>
          <pre class="raw-json">{{ JSON.stringify(rawJsonPreview, null, 2) }}</pre>
        </div>
      </div>

      <FireLog
        :entries="logEntries"
        v-model:debugFlags="debugFlags"
      />
    </div>

    <PointEditor
      v-if="editingPointIndex !== null"
      :feature="geojson.features[editingPointIndex]"
      :index="editingPointIndex"
      @save="onSavePointProps"
      @close="editingPointIndex = null"
    />
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import moment from 'moment'
import downloadjs from 'downloadjs'

import ConfigPanel from './components/ConfigPanel.vue'
import MapView from './components/MapView.vue'
import PointEditor from './components/PointEditor.vue'
import FireControls from './components/FireControls.vue'
import FireLog from './components/FireLog.vue'

import { useGeoJSON } from './composables/useGeoJSON.js'
import { useFireEngine } from './composables/useFireEngine.js'
import { useStorage } from './composables/useStorage.js'

const { loadConfig, saveConfig } = useStorage()

const {
  geojson, groupId, firstPointTime, trailDuration,
  addFeature, updateFeatureCustomProps, removeGroup, clearAll, changeTrailTimes, incrementGroupId,
} = useGeoJSON()

const { progress, inPause, isRunning, processLoopCount, start, pause, resume, reset } = useFireEngine()

const config = reactive(loadConfig())
const settings = reactive({
  showMap: true,
  subjectSpeedKMPH: 5,
  deviceSamplingSeconds: 60,
  locationMarginError: 12,
  markLocationWithError: true,
  fireType: 'pointRate',
  fireTimeoutSec: 1,
  fireBatchTimeoutSec: 120,
  fireTimeoutBetweenDaysSec: 0,
  advanceTrailOverTime: false,
  advanceTrailOverTimeNumOfLoops: 1,
})

const mapRef = ref(null)
const logEntries = ref([])
const showRaw = ref(true)
const editingPointIndex = ref(null)
const debugFlags = ref({ logBody: false, logIndex: false, logHeaders: false })

// Raw JSON preview: show what will actually be fired (defaults merged into customProps)
const rawJsonPreview = computed(() => {
  const defaults = Object.fromEntries(
    (config.defaultCustomProps || []).filter(p => p.key).map(p => [p.key, p.value])
  )
  return {
    type: 'FeatureCollection',
    features: geojson.value.features.map(({ leaflet_id, groupId: gId, ...f }) => ({
      ...f,
      properties: {
        ...f.properties,
        customProps: { ...defaults, ...f.properties.customProps },
      },
    })),
  }
})

watch(config, (val) => saveConfig({ ...val }), { deep: true })

function onUpdateConfig(updates) { Object.assign(config, updates) }
function onUpdateSettings(updates) { Object.assign(settings, updates) }

function onAddFeatures(featuresData) {
  // increment once per draw action — all points in batch share same gId
  const gId = incrementGroupId()
  for (const fd of featuresData) {
    addFeature(
      fd.lat, fd.lng, fd.time,
      settings.subjectSpeedKMPH, gId,
      fd.addRand, 'GNSS',
      fd.setZero, null,
      settings.locationMarginError, 'NONE',
      (feat, idx) => mapRef.value?.addMarker(feat, idx)
    )
  }
}

function onEditPoint(index) { editingPointIndex.value = index }

function onSavePointProps({ index, customProps }) {
  updateFeatureCustomProps(index, customProps)
  mapRef.value?.refreshPopups()
  editingPointIndex.value = null
}

function fireCallbacks() {
  return {
    onFire: (i) => { const f = geojson.value.features[i]; if (f) mapRef.value?.setMarkerFiring(f.leaflet_id) },
    onSuccess: (i) => { const f = geojson.value.features[i]; if (f) mapRef.value?.setMarkerSuccess(f.leaflet_id) },
    onError: (i) => { const f = geojson.value.features[i]; if (f) mapRef.value?.setMarkerError(f.leaflet_id) },
    onLog: (entry) => {
      // main log line — carry body/index/indices for debug rendering in FireLog
      logEntries.value.push({
        type: entry.type,
        message: entry.message,
        time: new Date().toLocaleTimeString(),
        body: debugFlags.value.logBody ? entry.body : undefined,
        index: debugFlags.value.logIndex ? entry.index : undefined,
        indices: debugFlags.value.logIndex ? entry.indices : undefined,
      })
      // headers debug line
      if (debugFlags.value.logHeaders && config.headers?.length) {
        const hdrs = Object.fromEntries(config.headers.filter(h => h.key).map(h => [h.key, h.value]))
        logEntries.value.push({
          type: 'debug',
          message: `  headers: ${JSON.stringify(hdrs)}`,
          time: '',
        })
      }
    },
  }
}

function fireSettings() {
  return {
    ...settings,
    onChangeTrailTimes: (t) => { changeTrailTimes(t); mapRef.value?.refreshPopups() },
  }
}

function onStart() {
  if (!config.endpointUrl) { addLog('error', '✗ Endpoint URL is required'); return }
  if (geojson.value.features.length === 0) { addLog('error', '✗ No trail to fire — add points first'); return }
  addLog('info', `Starting — ${geojson.value.features.length} points → ${config.endpointUrl}`)
  start(geojson, config, fireCallbacks(), fireSettings())
}

function onPause() {
  if (inPause.value) {
    addLog('info', `Resuming from point ${progress.value + 1}`)
    resume(geojson, config, fireCallbacks(), fireSettings())
  } else {
    pause()
    addLog('warn', `Paused at point ${progress.value} / ${geojson.value.features.length}`)
  }
}

function onReset() { reset(); mapRef.value?.resetAllMarkers(); addLog('info', 'Reset') }

function onClearAll() { reset(); clearAll(); mapRef.value?.clearAll(); logEntries.value = [] }

function onUndo() {
  if (geojson.value.features.length === 0) return
  const gId = groupId.value
  mapRef.value?.removeGroup(gId)
  removeGroup(gId)
}

function onDownload() {
  const exportData = {
    type: 'FeatureCollection',
    features: geojson.value.features.map(({ leaflet_id, groupId: gId, ...f }) => f),
  }
  downloadjs(JSON.stringify(exportData, null, 2), 'geofire-trail.geojson', 'application/json')
}

function onChangeTrailTimes(newFromTime) { changeTrailTimes(newFromTime); mapRef.value?.refreshPopups() }

function onLoadSession({ geojson: savedGeojson, config: savedConfig }) {
  reset(); clearAll(); mapRef.value?.clearAll()
  Object.assign(config, savedConfig)
  logEntries.value = []
  for (const f of savedGeojson.features) {
    addFeature(
      f.geometry.coordinates[0], f.geometry.coordinates[1],
      moment(f.properties.time.utc), f.properties.speed ?? f.properties.speedKMH,
      f.groupId || 0, false, 'GNSS',
      f.properties.setZero, f.properties.customProps || {},
      f.properties.accuracy, 'NONE',
      (feat, idx) => mapRef.value?.addMarker(feat, idx)
    )
  }
  if (savedGeojson.features.length > 0) {
    mapRef.value?.zoomToLast()
    addLog('info', `Loaded session — ${savedGeojson.features.length} points`)
  }
}

async function onFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (data.type !== 'FeatureCollection') { addLog('error', '✗ File must be a GeoJSON FeatureCollection'); return }
    reset(); clearAll(); mapRef.value?.clearAll()
    for (const f of data.features) {
      addFeature(
        f.geometry.coordinates[0], f.geometry.coordinates[1],
        moment(f.properties.time?.utc || new Date().toISOString()),
        (f.properties.speed ?? f.properties.speedKMH) || 5, f.groupId || 0, false,
        'GNSS', f.properties.setZero || false,
        f.properties.customProps || {}, f.properties.accuracy || 12,
        'NONE',
        (feat, idx) => mapRef.value?.addMarker(feat, idx)
      )
    }
    if (data.features.length > 0) { mapRef.value?.zoomToLast(); addLog('info', `Loaded ${data.features.length} points from ${file.name}`) }
  } catch (err) { addLog('error', `✗ Failed to parse file: ${err.message}`) }
  event.target.value = ''
}

function addLog(type, message) {
  logEntries.value.push({ type, message, time: new Date().toLocaleTimeString(), body: undefined, index: undefined })
}
</script>

<style scoped>
.app-layout { display: flex; height: 100vh; overflow: hidden; }
.app-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.upload-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 12px;
  border-bottom: 1px solid var(--border);
  background: rgba(6, 8, 13, 0.9);
  flex-shrink: 0;
}

/* style the file input */
.upload-bar input[type="file"] {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 11px;
}
.upload-bar input[type="file"]::file-selector-button {
  background: rgba(232,160,32,0.08);
  border: 1px solid rgba(232,160,32,0.2);
  color: var(--accent);
  border-radius: var(--radius-sm);
  padding: 2px 10px;
  font-size: 11px;
  font-family: var(--font-condensed);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  margin-right: 8px;
  transition: background var(--transition), border-color var(--transition);
}
.upload-bar input[type="file"]::file-selector-button:hover {
  background: rgba(232,160,32,0.16);
  border-color: var(--accent);
}

.map-area { flex: 1; display: flex; min-height: 0; overflow: hidden; }

.raw-json-panel {
  width: 320px;
  height: 100%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-left: 1px solid var(--border);
  background:
    linear-gradient(180deg, rgba(240,168,48,0.02), transparent 140px),
    rgba(5, 6, 9, 0.98);
}

.raw-json-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 30px;
  padding: 0 12px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  background: rgba(12,14,20,0.9);
}
.raw-json-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-family: var(--font-condensed);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: var(--text-secondary);
  text-transform: uppercase;
}
.rj-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 7px var(--accent-glow);
}
.raw-json-count {
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 0.02em;
  padding: 1px 7px;
  border: 1px solid var(--border-accent);
  border-radius: 3px;
  background: var(--accent-dim);
}

.raw-json {
  flex: 1;
  overflow-y: auto;
  color: #e0b878;
  font-family: var(--font-mono);
  font-size: 10.5px;
  padding: 12px 14px;
  line-height: 1.65;
}
</style>
