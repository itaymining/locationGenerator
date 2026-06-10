<template>
  <div class="fire-controls">
    <div class="controls-row">

      <!-- Fire actions -->
      <div class="btn-group">
        <button
          class="btn btn-success fire-btn"
          :disabled="isFiring"
          data-tip="Fire trail to endpoint"
          @click="$emit('start')"
        >
          <span class="btn-icon-sym">▶</span> START
        </button>
        <button
          class="btn btn-ghost"
          :disabled="!canPause"
          :data-tip="inPause ? 'Resume firing' : 'Pause firing'"
          @click="$emit('pause')"
        >
          <span class="btn-icon-sym">{{ inPause ? '▶' : '⏸' }}</span>
          {{ inPause ? 'RESUME' : 'PAUSE' }}
        </button>
        <button
          class="btn btn-ghost"
          :disabled="!isRunning && !inPause && progress === 0"
          data-tip="Reset all markers to default state"
          @click="$emit('reset')"
        >
          <span class="btn-icon-sym">↺</span> RESET
        </button>
      </div>

      <div class="divider-v"></div>

      <!-- Map tools -->
      <div class="tool-group">
        <button
          class="tool-btn"
          data-tip="Clear all trail points"
          @click="$emit('clear-all')"
        >
          <span class="tool-icon">⊘</span>
          <span class="tool-label">CLR</span>
        </button>
        <button
          class="tool-btn"
          data-tip="Undo last drawn group"
          @click="$emit('undo')"
        >
          <span class="tool-icon">↩</span>
          <span class="tool-label">UNDO</span>
        </button>
        <button
          class="tool-btn"
          data-tip="Export trail as GeoJSON file"
          @click="$emit('download')"
        >
          <span class="tool-icon">⇓</span>
          <span class="tool-label">EXPORT</span>
        </button>
        <button
          class="tool-btn"
          data-tip="Zoom map to last point"
          @click="$emit('zoom-last')"
        >
          <span class="tool-icon">⊕</span>
          <span class="tool-label">ZOOM</span>
        </button>
        <button
          class="tool-btn"
          :class="{ 'tool-btn--active': showTimeShift }"
          data-tip="Shift trail timestamps"
          @click="openTimeShift"
        >
          <span class="tool-icon">◷</span>
          <span class="tool-label">TIME</span>
        </button>
        <button
          class="tool-btn"
          data-tip="Toggle raw GeoJSON view"
          @click="$emit('toggle-raw')"
        >
          <span class="tool-icon">{ }</span>
          <span class="tool-label">JSON</span>
        </button>
      </div>

      <div class="divider-v"></div>

      <!-- Status -->
      <div class="status-area">
        <template v-if="progress > 0">
          <div v-if="!inPause" class="firing-dot"></div>
          <div class="progress-bar-track" style="width: 90px">
            <div class="progress-bar-fill" :style="{ width: progressPct + '%' }"></div>
          </div>
          <span class="stat">{{ progress }}<span class="stat-sep">/</span>{{ total }}</span>
          <span class="stat muted">{{ progressPct }}%</span>
          <span class="stat muted">{{ timeLeft }}</span>
          <span class="stat mono">{{ currentTimestamp }}</span>
          <span v-if="settings.advanceTrailOverTime" class="badge badge-info">
            LOOP {{ processLoopCount }}/{{ settings.advanceTrailOverTimeNumOfLoops }}
          </span>
        </template>
        <template v-else>
          <span class="stat">
            <span class="stat-count">{{ total }}</span> pts
          </span>
          <span v-if="trailDurationStr" class="stat muted mono">{{ trailDurationStr }}</span>
        </template>
      </div>

    </div>

    <!-- Time shift panel -->
    <div v-if="showTimeShift" class="time-shift-panel">
      <div class="ts-col">
        <span class="ts-field-label">Current From</span>
        <input class="input input-sm input-mono" type="datetime-local" :value="originalFrom" disabled />
      </div>
      <div class="ts-col">
        <span class="ts-field-label">Current To</span>
        <input class="input input-sm input-mono" type="datetime-local" :value="originalTo" disabled />
      </div>
      <div class="ts-arrow">⟶</div>
      <div class="ts-col">
        <span class="ts-field-label">New From</span>
        <input class="input input-sm input-mono" type="datetime-local" v-model="newFrom" @change="onFromChange" />
      </div>
      <div class="ts-col">
        <span class="ts-field-label">New To</span>
        <input class="input input-sm input-mono" type="datetime-local" v-model="newTo" @change="onToChange" />
      </div>
      <div class="ts-actions">
        <button class="btn btn-primary btn-sm" data-tip="Apply time shift" @click="applyTimeShift">Apply</button>
        <button class="btn btn-ghost btn-sm" @click="showTimeShift = false">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import moment from 'moment'

const props = defineProps({
  geojson: { type: Object, required: true },
  progress: { type: Number, default: 0 },
  inPause: { type: Boolean, default: false },
  isRunning: { type: Boolean, default: false },
  processLoopCount: { type: Number, default: 1 },
  settings: { type: Object, required: true },
  firstPointTime: { type: Object, default: null },
  trailDuration: { type: Object, default: null },
})

const emit = defineEmits([
  'start', 'pause', 'reset',
  'clear-all', 'undo', 'download', 'zoom-last', 'toggle-raw',
  'change-trail-times',
])

const showTimeShift = ref(false)
const newFrom = ref('')
const newTo = ref('')

const total = computed(() => props.geojson.features.length)
const isFiring = computed(() => props.isRunning)
const canPause = computed(() => props.isRunning || props.inPause)

const progressPct = computed(() =>
  total.value > 0 ? Math.ceil((props.progress * 100) / total.value) : 0
)

const timeLeft = computed(() => {
  if (!props.settings) return ''
  const secs = props.settings.fireType === 'pointRate'
    ? props.settings.fireTimeoutSec * (total.value - props.progress)
    : 0
  const d = new Date(null)
  d.setSeconds(secs)
  return d.toISOString().substr(11, 8)
})

const currentTimestamp = computed(() => {
  const idx = Math.min(props.progress, total.value - 1)
  if (total.value === 0) return ''
  return moment(props.geojson.features[idx].properties.time.utc).format('MM-DD HH:mm:ss')
})

const trailDurationStr = computed(() => {
  if (!props.trailDuration || props.trailDuration.asSeconds() <= 0) return ''
  const d = props.trailDuration
  const parts = []
  if (d.days() > 0) parts.push(`${d.days()}d`)
  parts.push([
    String(d.hours()).padStart(2, '0'),
    String(d.minutes()).padStart(2, '0'),
    String(d.seconds()).padStart(2, '0'),
  ].join(':'))
  return parts.join(' ')
})

const originalFrom = computed(() =>
  props.firstPointTime ? props.firstPointTime.format('YYYY-MM-DDTHH:mm') : ''
)

const originalTo = computed(() => {
  if (!props.firstPointTime || !props.trailDuration) return ''
  return props.firstPointTime.clone().add(props.trailDuration).format('YYYY-MM-DDTHH:mm')
})

function onFromChange() {
  if (!newFrom.value || !props.trailDuration) return
  newTo.value = moment(newFrom.value).add(props.trailDuration).format('YYYY-MM-DDTHH:mm')
}

function onToChange() {
  if (!newTo.value || !props.trailDuration) return
  newFrom.value = moment(newTo.value)
    .subtract(props.trailDuration.asSeconds(), 'seconds')
    .format('YYYY-MM-DDTHH:mm')
}

function openTimeShift() {
  showTimeShift.value = !showTimeShift.value
  if (showTimeShift.value && props.firstPointTime && props.trailDuration) {
    newFrom.value = props.firstPointTime.format('YYYY-MM-DDTHH:mm')
    newTo.value = props.firstPointTime.clone().add(props.trailDuration).format('YYYY-MM-DDTHH:mm')
  }
}

function applyTimeShift() {
  if (!newFrom.value) return
  emit('change-trail-times', moment(newFrom.value))
  showTimeShift.value = false
}

</script>

<style scoped>
.fire-controls {
  background: linear-gradient(180deg, rgba(16,18,25,0.96), rgba(9,11,16,0.96));
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 0 rgba(240,168,48,0.1), 0 6px 20px rgba(0,0,0,0.3);
  padding: 0 14px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
  position: relative;
  z-index: 5;
}

.controls-row {
  min-height: 48px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 6px 0;
}

.btn-group { display: flex; gap: 4px; align-items: center; flex-shrink: 0; }

.fire-btn { font-size: 12px; letter-spacing: 0.1em; }
.btn-icon-sym { font-size: 11px; line-height: 1; }

/* Tool buttons — icon + label chips */
.tool-group { display: flex; gap: 3px; align-items: center; flex-shrink: 0; }

.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 5px 8px;
  background: rgba(255,255,255,0.015);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  cursor: pointer;
  transition: background var(--transition), border-color var(--transition), color var(--transition), box-shadow var(--transition);
  color: var(--text-muted);
  min-width: 42px;
  position: relative;
}
.tool-btn:hover {
  background: var(--bg-surface-hover);
  border-color: var(--border-strong);
  color: var(--text-primary);
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}
.tool-btn--active {
  background: var(--accent-dim);
  border-color: var(--border-accent);
  color: var(--accent-hover);
  box-shadow: inset 0 0 0 1px rgba(240,168,48,0.15), 0 0 12px rgba(240,168,48,0.12);
}

.tool-icon {
  font-size: 14px;
  line-height: 1;
  letter-spacing: -0.02em;
}
.tool-label {
  font-family: var(--font-condensed);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.11em;
  text-transform: uppercase;
  line-height: 1;
}

.divider-v {
  width: 1px;
  height: 20px;
  background: var(--border);
  flex-shrink: 0;
  opacity: 0.6;
}

.status-area {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  flex-wrap: nowrap;
  overflow: hidden;
  min-width: 0;
}

.stat {
  font-size: 11px;
  color: var(--text-secondary);
  font-family: var(--font-condensed);
  font-weight: 500;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.stat.muted { color: var(--text-muted); }
.stat.mono { font-family: var(--font-mono); font-size: 10px; }
.stat-sep { color: var(--text-muted); margin: 0 1px; }
.stat-count { color: var(--text-primary); font-weight: 600; }

/* firing pulse */
.firing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-success);
  animation: pulse-dot 1s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(0,214,143,0.4); }
  50% { opacity: 0.5; transform: scale(0.7); box-shadow: 0 0 0 4px rgba(0,214,143,0); }
}

/* Time shift panel */
.time-shift-panel {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 10px 2px 10px;
  flex-wrap: wrap;
  border-top: 1px solid rgba(232,160,32,0.1);
  background: rgba(232,160,32,0.02);
}

.ts-col { display: flex; flex-direction: column; gap: 3px; }
.ts-field-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  font-family: var(--font-condensed);
}

.ts-arrow {
  font-size: 14px;
  color: var(--accent);
  padding-bottom: 4px;
  opacity: 0.6;
}

.ts-actions {
  display: flex;
  gap: 6px;
  align-items: flex-end;
  padding-bottom: 1px;
}
</style>
