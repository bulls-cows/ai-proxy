<template>
  <!-- BaseButton - 基础按钮组件 -->
  <button
    :class="['btn', `btn-${type}`, `btn-${size}`, { 'btn-loading': loading }]"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <!-- 加载状态指示器 -->
    <span v-if="loading" class="btn-spinner" />
    <!-- 按钮内容插槽 -->
    <slot />
  </button>
</template>

<script setup lang="ts">
/**
 * BaseButton.vue - 基础按钮组件
 *
 * 业务职责：
 * - 提供多种样式类型的按钮：主要、成功、警告、危险、默认
 * - 支持三种尺寸：小、中、大
 * - 支持加载状态和禁用状态
 * - 点击事件向外 emit
 *
 * @author Auto Generated
 * @since 2026-05-24
 */
// Props 定义
withDefaults(
  defineProps<{
    // type: 按钮类型 (primary/success/warning/danger/default)
    type?: 'primary' | 'success' | 'warning' | 'danger' | 'default'
    // size: 按钮尺寸 (small/medium/large)
    size?: 'small' | 'medium' | 'large'
    // loading: 加载状态
    loading?: boolean
    // disabled: 禁用状态
    disabled?: boolean
  }>(),
  {
    type: 'default',
    size: 'medium',
  }
)

// Emits 定义
defineEmits<{
  // click: 点击事件
  click: [event: MouseEvent]
}>()
</script>

<style lang="scss" scoped>
/* 按钮基础样式 */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  background: transparent;
  line-height: 1.5;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

/* 按钮 > 尺寸 */
.btn-small {
  padding: 6px 12px;
  font-size: var(--font-sm);
}

.btn-medium {
  padding: 10px 20px;
  font-size: var(--font-md);
}

.btn-large {
  padding: 14px 28px;
  font-size: var(--font-lg);
}

/* 按钮 > 类型 */
.btn-default {
  background: var(--bg-primary);
  border-color: var(--border-primary);
  color: var(--text-primary);

  &:hover:not(:disabled) {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
}

.btn-primary {
  background: var(--color-primary);
  color: white;

  &:hover:not(:disabled) {
    background: #66b1ff;
  }
}

.btn-success {
  background: var(--color-success);
  color: white;

  &:hover:not(:disabled) {
    background: #85ce61;
  }
}

.btn-warning {
  background: var(--color-warning);
  color: white;

  &:hover:not(:disabled) {
    background: #ebb563;
  }
}

.btn-danger {
  background: var(--color-danger);
  color: white;

  &:hover:not(:disabled) {
    background: #f78989;
  }
}

/* 按钮 > 加载状态指示器 */
.btn-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
