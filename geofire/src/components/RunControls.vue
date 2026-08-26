<template>
  <div class="run-controls">
    <div class="btn-row">
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

    <div class="status-block">
      <template v-if="progress > 0">
        <div class="status-line">
          <div v-if="!inPause" class="firing-dot"></div>
          <span class="stat">{{ progress }}<span class="stat-sep">/</span>{{ total }}</span>
          <span class="stat muted">{{ progressPct }}%</span>
          <span v-if="settings.advanceTrailOverTime" class="badge badge-info">
            LOOP {{ processLoopCount }}/{{ settings.advanceTrailOverTimeNumOfLoops }}
          </span>
        </div>
        <div class="progress-bar-track">
          <div class="progress-bar-fill" :style="{ width: progressPct + '%' }"></div>
        </div>
        <div class="status-line">
          <span class="stat muted">{{ timeLeft }} left</span>
          <span class="stat mono">{{ currentTimestamp }}</span>
        </div>
      </template>
      <template v-else>
        <div class="status-line">
          <span class="stat"><span class="stat-count">{{ total }}</span> pts</span>
          <span v-if="trailDurationStr" class="stat muted mono">{{ trailDurationStr }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import moment from 'moment'

const props = defineProps({
  geojson: { type: Object, required: true },
  progress: { type: Number, default: 0 },
  inPause: { type: Boolean, default: false },
  isRunning: { type: Boolean, default: false },
  processLoopCount: { type: Number, default: 1 },
  settings: { type: Object, required: true },
  trailDuration: { type: Object, default: null },
})

defineEmits(['start', 'pause', 'reset'])

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
</script>

<style scoped>
.run-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-row {
  display: flex;
  gap: 5px;
}
.btn-row .btn { flex: 1; padding-left: 6px; padding-right: 6px; }

.fire-btn { font-size: 12px; letter-spacing: 0.1em; }
.btn-icon-sym { font-size: 11px; line-height: 1; }

.status-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 9px 10px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.status-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.progress-bar-track { width: 100%; }

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
</style>
