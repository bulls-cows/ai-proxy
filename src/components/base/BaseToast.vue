<template>
  <!-- BaseToast - 轻提示组件 -->
  <Teleport to="body">
    <Transition name="toast">
      <!-- 提示消息 -->
      <div v-if="visible" class="toast">
        {{ message }}
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
// Props 定义
defineProps<{
  // message: 提示消息内容
  message: string
  // visible: 是否显示
  visible: boolean
}>()
</script>

<style lang="scss" scoped>
/* 提示框样式 */
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

/* 提示框过渡动画 */
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
