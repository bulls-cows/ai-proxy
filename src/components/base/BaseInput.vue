<template>
  <!-- BaseInput - 基础输入框组件 -->
  <div class="input-wrapper">
    <!-- 输入框标签 -->
    <label v-if="label" class="input-label">{{ label }}</label>
    <!-- 输入框容器 -->
    <div class="input-container" :class="{ 'input-error': error }">
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        class="input-field"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </div>
    <!-- 错误提示文字 -->
    <span v-if="error" class="input-error-text">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
/**
 * BaseInput.vue - 基础输入框组件
 *
 * 业务职责：
 * - 提供带标签的输入框组件
 * - 支持多种 input 类型
 * - 支持禁用状态
 * - 支持错误提示
 * - 通过 v-model 双向绑定值
 *
 * @author Auto Generated
 * @since 2026-05-24
 */
// Props 定义
defineProps<{
  // modelValue: 绑定的值
  modelValue: string | number
  // label: 输入框标签
  label?: string
  // type: input 类型
  type?: string
  // placeholder: 占位符
  placeholder?: string
  // disabled: 禁用状态
  disabled?: boolean
  // error: 错误提示
  error?: string
}>()

// Emits 定义
defineEmits<{
  // update:modelValue: 值变更事件
  'update:modelValue': [value: string]
}>()
</script>

<style lang="scss" scoped>
/* 输入框外层容器 */
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 输入框标签 */
.input-label {
  font-size: var(--font-md);
  color: var(--text-primary);
  font-weight: 500;
}

/* 输入框容器 */
.input-container {
  display: flex;
  align-items: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);

  &:focus-within {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }

  &.input-error {
    border-color: var(--color-danger);
  }
}

/* 输入框字段 */
.input-field {
  flex: 1;
  padding: 10px 12px;
  font-size: var(--font-md);
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;

  &::placeholder {
    color: var(--text-placeholder);
  }

  &:disabled {
    cursor: not-allowed;
    color: var(--text-tertiary);
  }
}

/* 输入框错误提示 */
.input-error-text {
  font-size: var(--font-xs);
  color: var(--color-danger);
}
</style>
