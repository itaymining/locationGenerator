<template>
  <aside class="config-panel" :class="{ collapsed }">
    <div class="panel-header">
      <span v-if="!collapsed" class="panel-title">
        <span class="title-icon">◈</span> GEOFIRE
      </span>
      <button
        class="btn btn-ghost btn-icon collapse-btn"
        :data-tip="collapsed ? 'Expand panel' : 'Collapse panel'"
        @click="collapsed = !collapsed"
      >{{ collapsed ? '›' : '‹' }}</button>
    </div>

    <div v-show="!collapsed" class="panel-tabs">
      <button
        class="panel-tab"
        :class="{ active: activeTab === 'editor' }"
        @click="activeTab = 'editor'"
      >Editor</button>
      <button
        class="panel-tab"
        :class="{ active: activeTab === 'sessions' }"
        @click="activeTab = 'sessions'"
      >Sessions</button>
      <button
        class="panel-tab"
        :class="{ active: activeTab === 'run' }"
        @click="activeTab = 'run'"
      >Run</button>
    </div>

    <div v-show="!collapsed" class="panel-body">

      <div v-show="activeTab === 'editor'" class="panel-tab-content">

      <!-- Default Properties -->
      <div class="section-header">
        Default Properties
        <HelpTip text="Key-value pairs added to every fired point's properties. Per-point custom props override these when keys conflict." />
      </div>
      <p class="hint">Merged into every fired point. Per-point values override.</p>
      <div class="kv-table">
        <div class="kv-header-row">
          <span class="kv-col-label">Key</span>
          <span class="kv-col-label">Value</span>
        </div>
        <div v-for="(p, i) in local.defaultCustomProps" :key="i" class="kv-row">
          <input class="input input-sm input-mono" v-model="p.key" placeholder="key" @input="syncConfig" />
          <input class="input input-sm input-mono" v-model="p.value" placeholder="value" @input="syncConfig" />
          <button
            class="btn btn-danger btn-sm btn-icon"
            data-tip="Remove property"
            @click="removeProp(i)"
          >✕</button>
        </div>
        <button class="btn btn-ghost btn-sm add-row-btn" @click="addProp">
          <span class="add-icon">+</span> Add Property
        </button>
      </div>

      <!-- Trail Settings -->
      <div class="section-header">
        Trail Settings
        <HelpTip text="Controls how the trail is interpolated when you click on the map." />
      </div>
      <div class="fields-grid">
        <div class="field">
          <label class="label label-with-help">
            Speed km/h
            <HelpTip text="Subject movement speed. Used to auto-generate intermediate points between clicks — the farther apart, the more points." />
          </label>
          <input class="input input-sm" type="number" v-model.number="localSettings.subjectSpeedKMPH" @input="syncSettings" />
        </div>
        <div class="field">
          <label class="label label-with-help">
            Accuracy m
            <HelpTip text="GPS accuracy radius in metres. Each point is randomly offset within this radius to simulate real device noise." />
          </label>
          <input class="input input-sm" type="number" v-model.number="localSettings.locationMarginError" @input="syncSettings" />
        </div>
        <div class="field">
          <label class="label label-with-help">
            Sample sec
            <HelpTip text="Device reporting interval in seconds. One point is generated per interval — determines point density along the trail." />
          </label>
          <input class="input input-sm" type="number" v-model.number="localSettings.deviceSamplingSeconds" @input="syncSettings" />
        </div>
      </div>

      <div class="toggle-row" style="margin-top: 8px">
        <label class="toggle">
          <input type="checkbox" v-model="localSettings.speedIsMaster" @change="syncSettings" />
          <span class="toggle-slider"></span>
        </label>
        <span>Keep speed fixed (strict)</span>
        <HelpTip text="When on, speed and sampling rate are both fixed — points sit exactly stepMeters apart on a straight line, no jitter. A click too close to the previous point to fit one interval is rejected with a brief warning. A click farther than a whole number of intervals only draws the intervals that fit; the leftover distance to your click is dropped silently." />
      </div>

      <!-- Options -->
      <div class="section-header">Options</div>
      <div class="toggle-list">
        <div class="toggle-row">
          <label class="toggle">
            <input type="checkbox" v-model="localSettings.markLocationWithError" @change="syncSettings" />
            <span class="toggle-slider"></span>
          </label>
          <span>Mark accuracy circle on map</span>
          <HelpTip text="Draw a translucent circle around each point representing the GPS accuracy radius. Helps visualise position uncertainty." />
        </div>
        <div class="toggle-row">
          <label class="toggle">
            <input type="checkbox" v-model="localSettings.showMap" @change="syncSettings" />
            <span class="toggle-slider"></span>
          </label>
          <span>Show map</span>
          <HelpTip text="Toggle the map panel. Hide it to get more space for the raw JSON view or the log." />
        </div>
      </div>

      </div>

      <div v-show="activeTab === 'sessions'" class="panel-tab-content">

      <div class="session-save">
        <input class="input input-sm" v-model="newSessionName" placeholder="Session name…" @keyup.enter="saveCurrentSession" />
        <button
          class="btn btn-primary btn-sm"
          data-tip="Save current trail as session"
          :disabled="!newSessionName.trim()"
          @click="saveCurrentSession"
        >Save</button>
      </div>

      <div class="session-list">
        <div v-if="sessionNames.length === 0" class="no-sessions">
          <span>No saved sessions</span>
        </div>
        <div v-for="name in sessionNames" :key="name" class="session-row">
          <span class="session-name" :title="name">{{ name }}</span>
          <div class="session-actions">
            <button
              class="btn btn-ghost btn-sm"
              data-tip="Load this session"
              @click="loadSession(name)"
            >Load</button>
            <button
              class="btn btn-danger btn-sm"
              data-tip="Delete session"
              @click="removeSession(name)"
            >Del</button>
          </div>
        </div>
      </div>

      </div>

      <div v-show="activeTab === 'run'" class="panel-tab-content">

      <RunControls
        :geojson="geojson"
        :progress="progress"
        :in-pause="inPause"
        :is-running="isRunning"
        :process-loop-count="processLoopCount"
        :settings="localSettings"
        :trail-duration="trailDuration"
        @start="$emit('start')"
        @pause="$emit('pause')"
        @reset="$emit('reset')"
      />

      <!-- Endpoint -->
      <div class="section-header">
        Endpoint
        <HelpTip text="The URL that receives each location point as an HTTP POST request with a GeoJSON Feature body." />
      </div>
      <div class="field">
        <label class="label">POST URL</label>
        <input
          class="input input-mono"
          v-model="local.endpointUrl"
          placeholder="https://api.example.com/locations"
          autocomplete="off"
          spellcheck="false"
          @input="syncConfig"
        />
      </div>

      <!-- Request Headers -->
      <div class="section-header">
        Request Headers
        <HelpTip text="HTTP headers sent with every POST request. Use for authentication (e.g. Authorization: Bearer token) or custom API keys." />
      </div>
      <div class="kv-table">
        <div class="kv-header-row">
          <span class="kv-col-label">Header</span>
          <span class="kv-col-label">Value</span>
        </div>
        <div v-for="(h, i) in local.headers" :key="i" class="kv-row">
          <input class="input input-sm input-mono" v-model="h.key" placeholder="X-Api-Key" @input="syncConfig" />
          <input class="input input-sm input-mono" v-model="h.value" placeholder="value" @input="syncConfig" />
          <button
            class="btn btn-danger btn-sm btn-icon"
            data-tip="Remove header"
            @click="removeHeader(i)"
          >✕</button>
        </div>
        <button class="btn btn-ghost btn-sm add-row-btn" @click="addHeader">
          <span class="add-icon">+</span> Add Header
        </button>
      </div>

      <!-- Fire Settings -->
      <div class="section-header">
        Fire Settings
        <HelpTip text="Controls the speed at which points are sent to the endpoint." />
      </div>
      <div class="fire-mode-group">
        <label class="fire-mode-option" :class="{ active: localSettings.fireType === 'pointRate' }">
          <input type="radio" v-model="localSettings.fireType" value="pointRate" @change="syncSettings" />
          <span class="mode-label" style="display:flex;align-items:center;gap:4px">
            Point Rate
            <HelpTip text="Fire one point every N seconds. Simple metered sending — each point is sent individually on a fixed interval." />
          </span>
          <div class="mode-input-wrap">
            <input
              class="input input-sm"
              type="number"
              step="0.1"
              v-model.number="localSettings.fireTimeoutSec"
              :disabled="localSettings.fireType !== 'pointRate'"
              @input="syncSettings"
            />
            <span class="mode-unit">sec/pt</span>
          </div>
        </label>

        <label class="fire-mode-option" :class="{ active: localSettings.fireType === 'reportRate' }">
          <input type="radio" v-model="localSettings.fireType" value="reportRate" @change="syncSettings" />
          <span class="mode-label" style="display:flex;align-items:center;gap:4px">
            Report Rate
            <HelpTip text="Fire all points that fall within a time window (batch). Simulates a device that sends accumulated reports every N seconds." />
          </span>
          <div class="mode-input-wrap">
            <input
              class="input input-sm"
              type="number"
              v-model.number="localSettings.fireBatchTimeoutSec"
              :disabled="localSettings.fireType !== 'reportRate'"
              @input="syncSettings"
            />
            <span class="mode-unit">sec/batch</span>
          </div>
        </label>
      </div>

      <div v-if="localSettings.fireType === 'pointRate'" class="field" style="margin-top: 6px">
        <label class="label label-with-help">
          Day Boundary Timeout (sec)
          <HelpTip text="Extra pause (in seconds) when the trail crosses midnight. Simulates a device that goes silent at day rollover before resuming. Set to 0 for no pause." />
        </label>
        <input class="input input-sm" type="number" v-model.number="localSettings.fireTimeoutBetweenDaysSec" @input="syncSettings" />
      </div>

      <div class="toggle-row" style="margin-top: 8px">
        <label class="toggle">
          <input type="checkbox" v-model="localSettings.advanceTrailOverTime" @change="syncSettings" />
          <span class="toggle-slider"></span>
        </label>
        <span>Advance trail over time</span>
        <HelpTip text="After completing the full trail, shift all timestamps forward by the sampling interval and loop again. Simulates a device that keeps reporting continuously over many cycles." />
      </div>
      <div v-if="localSettings.advanceTrailOverTime" class="field" style="margin-top: 6px">
        <label class="label label-with-help">
          Loops
          <HelpTip text="Number of times to repeat the trail. Each loop shifts timestamps forward by the sample interval. Set to a high value for long-running simulations." />
        </label>
        <input class="input input-sm" type="number" v-model.number="localSettings.advanceTrailOverTimeNumOfLoops" @input="syncSettings" />
      </div>

      </div>

    </div>
  </aside>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useStorage } from '../composables/useStorage.js'
import HelpTip from './HelpTip.vue'
import RunControls from './RunControls.vue'

const props = defineProps({
  config: { type: Object, required: true },
  geojson: { type: Object, required: true },
  progress: { type: Number, default: 0 },
  inPause: { type: Boolean, default: false },
  isRunning: { type: Boolean, default: false },
  processLoopCount: { type: Number, default: 1 },
  trailDuration: { type: Object, default: null },
})

const emit = defineEmits(['update-config', 'update-settings', 'load-session', 'start', 'pause', 'reset'])

const { saveSession, deleteSession, loadSessions } = useStorage()

const collapsed = ref(false)
const activeTab = ref('editor')
const newSessionName = ref('')

const local = reactive({
  endpointUrl: props.config.endpointUrl,
  headers: JSON.parse(JSON.stringify(props.config.headers || [])),
  defaultCustomProps: JSON.parse(JSON.stringify(props.config.defaultCustomProps || [])),
})

const localSettings = reactive({
  subjectSpeedKMPH: 5,
  locationMarginError: 12,
  deviceSamplingSeconds: 60,
  speedIsMaster: false,
  fireType: 'pointRate',
  fireTimeoutSec: 1,
  fireBatchTimeoutSec: 120,
  fireTimeoutBetweenDaysSec: 0,
  markLocationWithError: true,
  showMap: true,
  advanceTrailOverTime: false,
  advanceTrailOverTimeNumOfLoops: 1,
})

const sessions = ref(loadSessions())
const sessionNames = computed(() => Object.keys(sessions.value))

function syncConfig() {
  emit('update-config', {
    endpointUrl: local.endpointUrl,
    headers: JSON.parse(JSON.stringify(local.headers)),
    defaultCustomProps: JSON.parse(JSON.stringify(local.defaultCustomProps)),
  })
}

function syncSettings() {
  emit('update-settings', { ...localSettings })
}

function addHeader() { local.headers.push({ key: '', value: '' }) }
function removeHeader(i) { local.headers.splice(i, 1); syncConfig() }
function addProp() { local.defaultCustomProps.push({ key: '', value: '' }) }
function removeProp(i) { local.defaultCustomProps.splice(i, 1); syncConfig() }

function saveCurrentSession() {
  if (!newSessionName.value.trim()) return
  saveSession(newSessionName.value.trim(), props.geojson, { ...props.config })
  sessions.value = loadSessions()
  newSessionName.value = ''
}

function loadSession(name) {
  const s = sessions.value[name]
  if (s) emit('load-session', { geojson: s.geojson, config: s.config })
}

function removeSession(name) {
  deleteSession(name)
  sessions.value = loadSessions()
}
</script>

<style scoped>
.config-panel {
  width: 280px;
  min-width: 280px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  flex-shrink: 0;
  background:
    linear-gradient(180deg, rgba(240,168,48,0.025), transparent 200px),
    var(--bg-panel);
  box-shadow: inset -1px 0 0 rgba(255,255,255,0.03), 6px 0 28px rgba(0,0,0,0.35);
  transition: width var(--transition-slow), min-width var(--transition-slow);
}

.config-panel.collapsed {
  width: 44px;
  min-width: 44px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 8px 0 15px;
  height: 48px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: linear-gradient(180deg, rgba(16,18,25,0.99), rgba(10,12,17,0.99));
  z-index: 10;
  flex-shrink: 0;
}

.panel-title {
  font-family: var(--font-condensed);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  text-shadow: 0 0 18px rgba(240,168,48,0.45);
}

.title-icon {
  font-size: 15px;
  color: var(--accent-hover);
  filter: drop-shadow(0 0 5px rgba(240,168,48,0.7));
  animation: title-pulse 3.2s ease-in-out infinite;
}
@keyframes title-pulse {
  0%, 100% { opacity: 0.85; }
  50% { opacity: 1; filter: drop-shadow(0 0 9px rgba(240,168,48,0.9)); }
}

.collapse-btn {
  font-size: 16px;
  color: var(--text-muted);
  border: none;
  min-width: 26px;
}
.collapse-btn:hover { color: var(--text-primary); }

.panel-tabs {
  display: flex;
  flex-shrink: 0;
  position: sticky;
  top: 48px;
  z-index: 9;
  background: linear-gradient(180deg, rgba(16,18,25,0.99), rgba(10,12,17,0.99));
  border-bottom: 1px solid var(--border);
}

.panel-tab {
  flex: 1;
  padding: 9px 0 8px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-muted);
  font-family: var(--font-condensed);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color var(--transition), border-color var(--transition), background var(--transition);
}
.panel-tab:hover { color: var(--text-secondary); }
.panel-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  background: linear-gradient(180deg, rgba(240,168,48,0.09), transparent);
  text-shadow: 0 0 10px rgba(240,168,48,0.35);
}

.panel-body {
  padding: 10px 13px 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.panel-tab-content {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field { display: flex; flex-direction: column; gap: 3px; }
.label-with-help { display: flex; align-items: center; gap: 4px; }

.fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 5px;
}

.hint {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: -3px;
  line-height: 1.45;
  font-family: var(--font-ui);
  letter-spacing: 0.01em;
}

/* KV table column headers */
.kv-header-row {
  display: flex;
  gap: 5px;
  padding: 0 0 2px;
}
.kv-col-label {
  flex: 1;
  font-size: 9.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  font-family: var(--font-condensed);
  padding-left: 2px;
}

.add-row-btn {
  align-self: flex-start;
  color: var(--text-muted);
  border-color: transparent;
  font-size: 11px;
  padding: 2px 6px;
  gap: 4px;
}
.add-row-btn:hover { color: var(--accent); border-color: var(--border-accent); }
.add-icon { font-size: 13px; line-height: 1; }

/* Fire mode selector */
.fire-mode-group { display: flex; flex-direction: column; gap: 5px; }
.fire-mode-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 9px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  cursor: pointer;
  transition: border-color var(--transition), background var(--transition);
}
.fire-mode-option:hover { border-color: var(--border-strong); background: var(--bg-surface); }
.fire-mode-option.active {
  border-color: var(--border-accent);
  background: linear-gradient(180deg, rgba(240,168,48,0.1), rgba(240,168,48,0.03));
  box-shadow: inset 0 0 0 1px rgba(240,168,48,0.12), 0 2px 12px rgba(240,168,48,0.08);
}
.fire-mode-option input[type="radio"] { accent-color: var(--accent); flex-shrink: 0; }
.mode-label {
  font-size: 12px;
  font-family: var(--font-condensed);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-secondary);
  flex: 1;
  text-transform: uppercase;
}
.fire-mode-option.active .mode-label { color: var(--text-primary); }
.mode-input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}
.mode-input-wrap .input { width: 60px; text-align: right; }
.mode-unit {
  font-size: 9.5px;
  color: var(--text-dim);
  font-family: var(--font-mono);
  letter-spacing: 0.02em;
  white-space: nowrap;
}

/* Toggles */
.toggle-list { display: flex; flex-direction: column; gap: 8px; }
.toggle-row {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 12px;
  font-family: var(--font-condensed);
  font-weight: 500;
  letter-spacing: 0.03em;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
  padding: 2px 0;
  transition: color var(--transition);
}
.toggle-row:hover { color: var(--text-primary); }

/* Sessions */
.session-save {
  display: flex;
  gap: 5px;
  align-items: center;
}
.session-save .input { flex: 1; }

.session-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 2px;
}

.no-sessions {
  padding: 10px 0;
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-condensed);
  letter-spacing: 0.05em;
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: var(--radius);
}

.session-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 9px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-left: 2px solid rgba(232,160,32,0.2);
  border-radius: var(--radius);
  transition: border-color var(--transition), background var(--transition);
  gap: 6px;
}
.session-row:hover {
  background: var(--bg-surface-hover);
  border-left-color: var(--accent);
}

.session-name {
  font-size: 12px;
  font-family: var(--font-mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-secondary);
  flex: 1;
  min-width: 0;
}

.session-actions { display: flex; gap: 3px; flex-shrink: 0; }
</style>
