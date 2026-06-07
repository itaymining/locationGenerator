<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal glass-panel">
      <div class="modal-header">
        <h3>Edit Point Properties</h3>
        <button class="btn btn-ghost btn-sm btn-icon" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div class="info-grid">
          <div class="info-row">
            <span class="label">Time (UTC)</span>
            <span class="info-val">{{ feature.properties.time.utc }}</span>
          </div>
          <div class="info-row">
            <span class="label">Speed</span>
            <span class="info-val">{{ feature.properties.speed }} km/h</span>
          </div>
          <div class="info-row">
            <span class="label">Heading</span>
            <span class="info-val">{{ feature.properties.heading ?? 'stopped' }}°</span>
          </div>
          <div class="info-row">
            <span class="label">Accuracy</span>
            <span class="info-val">{{ feature.properties.accuracy }}m</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="section-header">Custom Properties</div>
        <div class="kv-table">
          <div v-for="(row, i) in localProps" :key="i" class="kv-row">
            <input class="input input-sm" v-model="row.key" placeholder="key" />
            <input class="input input-sm" v-model="row.value" placeholder="value" />
            <button class="btn btn-danger btn-sm btn-icon" @click="removeRow(i)">✕</button>
          </div>
          <button class="btn btn-ghost btn-sm" @click="addRow">+ Add Property</button>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-ghost btn-sm" data-tip="Discard changes" @click="$emit('close')">Cancel</button>
        <button class="btn btn-primary btn-sm" data-tip="Save custom properties" @click="save">Save</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  feature: { type: Object, required: true },
  index: { type: Number, required: true },
})

const emit = defineEmits(['save', 'close'])

const localProps = ref([])

onMounted(() => {
  const cp = props.feature.properties.customProps || {}
  localProps.value = Object.entries(cp).map(([key, value]) => ({ key, value }))
})

function addRow() { localProps.value.push({ key: '', value: '' }) }
function removeRow(i) { localProps.value.splice(i, 1) }

function save() {
  const customProps = {}
  for (const row of localProps.value) {
    if (row.key) customProps[row.key] = row.value
  }
  emit('save', { index: props.index, customProps })
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(6px);
  animation: backdrop-in 0.15s ease;
}
@keyframes backdrop-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  width: 460px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  background: #0a0b10;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  box-shadow: 0 24px 64px rgba(0,0,0,0.85), 0 0 0 1px rgba(232,160,32,0.08);
  animation: modal-in 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(8px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid var(--border);
  background: rgba(232,160,32,0.03);
}

.modal-header h3 {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-secondary);
  font-family: var(--font-condensed);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 10px 18px;
  border-top: 1px solid var(--border);
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border);
}
.info-row:last-child { border-bottom: none; }
.info-row:nth-child(odd) { background: rgba(255,255,255,0.015); }

.info-val {
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 11px;
}
</style>
