<template>
  <div class="fire-log-wrap">
    <!-- Terminal header -->
    <div class="terminal-header">
      <span class="terminal-title">TERMINAL</span>
      <div class="debug-checks">
        <label class="debug-check">
          <input type="checkbox" v-model="logBody" />
          <span>Log Body</span>
        </label>
        <label class="debug-check">
          <input type="checkbox" v-model="logIndex" />
          <span>Log Pt#</span>
        </label>
        <label class="debug-check">
          <input type="checkbox" v-model="logHeaders" />
          <span>Log Headers</span>
        </label>
      </div>
    </div>

    <!-- Log scroll area -->
    <div class="fire-log" ref="logEl" @scroll="onScroll">
      <div class="log-inner">
        <div v-if="entries.length === 0" class="log-empty">
          — no activity yet —
        </div>
        <template v-for="(entry, i) in entries" :key="i">
          <div class="log-line" :class="`log-${entry.type}`">
            <span class="log-time">{{ entry.time }}</span>
            <span class="log-msg">{{ entry.message }}</span>
          </div>
          <!-- Debug: point index -->
          <div
            v-if="logIndex && entry.index !== undefined"
            class="log-line log-debug"
          >
            <span class="log-time"></span>
            <span class="log-msg">  pt# {{ entry.index + 1 }}{{ entry.indices ? ` – ${entry.indices[entry.indices.length - 1] + 1}` : '' }}</span>
          </div>
          <!-- Debug: POST body -->
          <div
            v-if="logBody && entry.body"
            class="log-line log-debug log-body"
          >
            <span class="log-time"></span>
            <span class="log-msg">{{ JSON.stringify(entry.body) }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  entries: { type: Array, default: () => [] },
  debugFlags: { type: Object, default: () => ({ logBody: false, logIndex: false, logHeaders: false }) },
})
const emit = defineEmits(['update:debugFlags'])

const logEl = ref(null)
const userScrolled = ref(false)

const logBody = ref(props.debugFlags.logBody)
const logIndex = ref(props.debugFlags.logIndex)
const logHeaders = ref(props.debugFlags.logHeaders)

watch([logBody, logIndex, logHeaders], () => {
  emit('update:debugFlags', {
    logBody: logBody.value,
    logIndex: logIndex.value,
    logHeaders: logHeaders.value,
  })
})

function onScroll() {
  const el = logEl.value
  if (!el) return
  const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20
  userScrolled.value = !atBottom
}

watch(() => props.entries.length, async () => {
  if (userScrolled.value) return
  await nextTick()
  if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
})
</script>

<style scoped>
.fire-log-wrap {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border);
  background: #060810;
}

/* ─── Terminal header ──────────────────────────── */
.terminal-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 12px;
  height: 28px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  background: rgba(4, 5, 8, 0.9);
}

.terminal-title {
  font-family: var(--font-condensed);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: var(--text-muted);
  text-transform: uppercase;
  flex-shrink: 0;
}

.debug-checks {
  display: flex;
  gap: 10px;
  flex: 1;
}

.debug-check {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-family: var(--font-condensed);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-dim);
  transition: color 0.15s;
  user-select: none;
  white-space: nowrap;
}

.debug-check:hover { color: var(--text-secondary); }
.debug-check input:checked + span { color: var(--accent); }

.debug-check input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 11px;
  height: 11px;
  border: 1px solid #2a3545;
  border-radius: 2px;
  background: transparent;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: border-color 0.15s, background 0.15s;
}

.debug-check input[type="checkbox"]:checked {
  background: rgba(232,160,32,0.15);
  border-color: var(--accent);
}

.debug-check input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 2px;
  top: 0px;
  width: 4px;
  height: 7px;
  border: 1.5px solid var(--accent);
  border-top: none;
  border-left: none;
  transform: rotate(45deg);
}

/* ─── Log scroll area ──────────────────────────── */
.fire-log {
  height: 140px;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: 11px;
  position: relative;
}

.fire-log::before {
  content: '';
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(#060810, transparent);
  display: block;
  pointer-events: none;
  z-index: 1;
  flex-shrink: 0;
}

.log-inner {
  padding: 4px 0 8px;
  display: flex;
  flex-direction: column;
}

.log-empty {
  color: var(--text-dim);
  font-style: italic;
  padding: 12px 16px;
  letter-spacing: 0.04em;
}

.log-line {
  display: flex;
  gap: 0;
  line-height: 1.7;
  padding: 0 12px;
  transition: background var(--transition);
  border-left: 2px solid transparent;
}

.log-line:hover { background: rgba(255,255,255,0.025); }

.log-success { border-left-color: rgba(0,214,143,0.4); }
.log-error   { border-left-color: rgba(255,77,77,0.4); }
.log-warn    { border-left-color: rgba(232,160,32,0.4); }
.log-info    { border-left-color: transparent; }
.log-debug   { border-left-color: rgba(74,90,106,0.3); }

.log-time {
  color: #4a5a6c;
  flex-shrink: 0;
  width: 80px;
  font-size: 10px;
  padding-top: 1px;
  font-family: var(--font-mono);
}

.log-msg { word-break: break-all; font-family: var(--font-mono); }
.log-success .log-msg { color: #2ee0a4; }
.log-error   .log-msg { color: #ff7070; }
.log-info    .log-msg { color: #9aa7b6; }
.log-warn    .log-msg { color: var(--accent-hover); }
.log-debug   .log-msg { color: #6b7a8c; font-size: 10px; }
.log-body    .log-msg { color: #6f93a6; word-break: break-all; }
</style>
