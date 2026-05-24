<template>
  <!-- BaseSelect - 基础下拉选择组件 -->
  <div class="select-wrapper">
    <!-- 选择框标签 -->
    <label v-if="label" class="select-label">{{ label }}</label>
    <!-- 选择框容器 -->
    <div class="select-container">
      <select
        :value="modelValue"
        :disabled="disabled"
        class="select-field"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
      >
        <!-- 循环: 选项列表 -->
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <!-- 选择框箭头 -->
      <span class="select-arrow">▼</span>
    </div>
  </div>
</template>

<script setup lang="ts">
// 选项类型定义
interface Option {
  // label: 显示文本
  label: string
  // value: 选项值
  value: string | number
}

// Props 定义
defineProps<{
  // modelValue: 绑定的值
  modelValue: string | number
  // label: 选择框标签
  label?: string
  // options: 选项列表
  options: Option[]
  // disabled: 禁用状态
  disabled?: boolean
}>()

// Emits 定义
defineEmits<{
  // update:modelValue: 值变更事件
  'update:modelValue': [value: string]
}>()
</script>

<style lang="scss" scoped>
/* 选择框外层容器 */
.select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 选择框标签 */
.select-label {
  font-size: var(--font-md);
  color: var(--text-primary);
  font-weight: 500;
}

/* 选择框容器 */
.select-container {
  position: relative;
  display: flex;
  align-items: center;
}

/* 选择框字段 */
.select-field {
  width: 100%;
  padding: 10px 36px 10px 12px;
  font-size: var(--font-md);
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  appearance: none;
  transition: all var(--transition-fast);

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    outline: none;
  }

  &:disabled {
    cursor: not-allowed;
    color: var(--text-tertiary);
  }
}

/* 选择框箭头 */
.select-arrow {
  position: absolute;
  right: 12px;
  font-size: 10px;
  color: var(--text-tertiary);
  pointer-events: none;
}
</style>
