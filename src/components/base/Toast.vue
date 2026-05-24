<template>
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="visible" class="toast">
        {{ message }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  visible: boolean
}>()
</script>

<style lang="scss" scoped>
.toast {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  background: var(--text-primary);
  color: var(--bg-primary);
  border-radius: var(--radius-md);
  font-size: var(--font-sm);
  z-index: 9999;
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.3s,
    transform 0.3s;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px);
}
</style>
