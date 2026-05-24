<template>
  <!-- BaseSwitch - 基础开关组件 -->
  <label class="switch-wrapper">
    <!-- 开关标签 -->
    <span v-if="label" class="switch-label">{{ label }}</span>
    <!-- 开关主体 -->
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :class="['switch', { 'switch-on': modelValue, 'switch-disabled': disabled }]"
      :disabled="disabled"
      @click="toggle"
    >
      <!-- 开关滑块 -->
      <span class="switch-thumb" />
    </button>
  </label>
</template>

<script setup lang="ts">
/**
 * BaseSwitch.vue - 基础开关组件
 *
 * 业务职责：
 * - 提供带标签的开关切换组件
 * - 支持禁用状态
 * - 通过 v-model 双向绑定开关状态
 *
 * @author Auto Generated
 * @since 2026-05-24
 */
// Props 定义
const props = defineProps<{
  // modelValue: 开关状态
  modelValue: boolean
  // label: 开关标签
  label?: string
  // disabled: 禁用状态
  disabled?: boolean
}>()

// Emits 定义
const emit = defineEmits<{
  // update:modelValue: 状态变更事件
  'update:modelValue': [value: boolean]
}>()

/**
 * 切换开关状态
 */
function toggle() {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}
</script>

<style lang="scss" scoped>
/* 开关外层容器 */
.switch-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

/* 开关标签 */
.switch-label {
  font-size: var(--font-md);
  color: var(--text-primary);
}

/* 开关主体 */
.switch {
  position: relative;
  width: 44px;
  height: 22px;
  background: var(--border-primary);
  border: none;
  border-radius: 11px;
  cursor: pointer;
  transition: background var(--transition-fast);
  padding: 0;

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}

/* 开关 > 开启状态 */
.switch-on {
  background: var(--color-primary);
}

/* 开关 > 禁用状态 */
.switch-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 开关 > 滑块 */
.switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: white;
  border-radius: 50%;
  transition: transform var(--transition-fast);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 开关 > 开启状态 > 滑块位置 */
.switch-on .switch-thumb {
  transform: translateX(22px);
}
</style>
