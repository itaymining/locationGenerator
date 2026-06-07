<template>
  <div class="fire-log" ref="logEl" @scroll="onScroll">
    <div class="log-inner">
      <div v-if="entries.length === 0" class="log-empty">
        — no activity yet —
      </div>
      <div
        v-for="(entry, i) in entries"
        :key="i"
        class="log-line"
        :class="`log-${entry.type}`"
      >
        <span class="log-time">{{ entry.time }}</span>
        <span class="log-msg">{{ entry.message }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  entries: { type: Array, default: () => [] },
})

const logEl = ref(null)
const userScrolled = ref(false)

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
.fire-log {
  height: 160px;
  overflow-y: auto;
  background: #060810;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 11px;
  position: relative;
}

/* top fade gradient for depth */
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
.log-error { border-left-color: rgba(255,77,77,0.4); }
.log-warn { border-left-color: rgba(232,160,32,0.4); }
.log-info { border-left-color: transparent; }

.log-time {
  color: #243040;
  flex-shrink: 0;
  width: 80px;
  font-size: 10px;
  padding-top: 1px;
  font-family: var(--font-mono);
}

.log-msg { word-break: break-all; font-family: var(--font-mono); }
.log-success .log-msg { color: #00d68f; }
.log-error .log-msg { color: #ff6b6b; }
.log-info .log-msg { color: #4a5a6a; }
.log-warn .log-msg { color: #e8a020; }
</style>
