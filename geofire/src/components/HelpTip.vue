<template>
  <span class="help-tip" @mouseenter="onEnter" @mouseleave="onLeave">
    <span class="help-icon">?</span>
    <Teleport to="body">
      <div v-if="visible" class="help-tooltip-portal" :style="style">
        {{ text }}
      </div>
    </Teleport>
  </span>
</template>

<script setup>
import { ref, reactive } from 'vue'

defineProps({ text: { type: String, required: true } })

const visible = ref(false)
const style = reactive({ top: '0px', left: '0px' })

function onEnter(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  style.top = (rect.bottom + 8) + 'px'
  style.left = Math.min(rect.left, window.innerWidth - 260) + 'px'
  visible.value = true
}

function onLeave() {
  visible.value = false
}
</script>

<style scoped>
.help-tip {
  display: inline-flex;
  align-items: center;
  cursor: default;
  flex-shrink: 0;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid var(--text-muted);
  color: var(--text-muted);
  font-size: 9px;
  font-family: var(--font-condensed);
  font-weight: 700;
  line-height: 1;
  transition: border-color 0.1s, color 0.1s;
  cursor: help;
}

.help-tip:hover .help-icon {
  border-color: var(--accent);
  color: var(--accent);
}
</style>

<style>
/* Global — lives outside scoped since it's teleported to body */
.help-tooltip-portal {
  position: fixed;
  z-index: 999999;
  background: rgba(10, 12, 18, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-left: 2px solid #e8a020;
  color: #7d8fa3;
  padding: 8px 11px;
  border-radius: 4px;
  font-size: 11px;
  font-family: 'Barlow', sans-serif;
  font-weight: 400;
  line-height: 1.5;
  max-width: 240px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7);
  pointer-events: none;
  white-space: normal;
}
</style>
