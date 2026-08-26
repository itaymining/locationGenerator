<template>
  <div class="map-tools">
    <div class="controls-row">

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
  firstPointTime: { type: Object, default: null },
  trailDuration: { type: Object, default: null },
})

const emit = defineEmits([
  'clear-all', 'undo', 'download', 'zoom-last', 'toggle-raw',
  'change-trail-times',
])

const showTimeShift = ref(false)
const newFrom = ref('')
const newTo = ref('')

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
.map-tools {
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
