<template>
  <!-- BaseTag - 基础标签组件 -->
  <span :class="['tag', `tag-${type}`]">
    <slot />
  </span>
</template>

<script setup lang="ts">
/**
 * BaseTag.vue - 基础标签组件
 *
 * 业务职责：
 * - 提供多种颜色类型的标签组件
 * - 支持默认、主要、成功、警告、危险、信息六种类型
 * - 通过插槽自定义标签内容
 *
 * @author Auto Generated
 * @since 2026-05-24
 */
// Props 定义
defineProps<{
  // type: 标签类型 (default/primary/success/warning/danger/info)
  type?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
}>()
</script>

<style lang="scss" scoped>
/* 标签基础样式 */
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  font-size: var(--font-xs);
  font-weight: 500;
  border-radius: var(--radius-sm);
}

/* 标签 > 类型 */
.tag-default {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.tag-primary {
  background: rgba(64, 158, 255, 0.1);
  color: var(--color-primary);
}

.tag-success {
  background: rgba(103, 194, 58, 0.1);
  color: var(--color-success);
}

.tag-warning {
  background: rgba(230, 162, 60, 0.1);
  color: var(--color-warning);
}

.tag-danger {
  background: rgba(245, 108, 108, 0.1);
  color: var(--color-danger);
}

.tag-info {
  background: rgba(144, 147, 153, 0.1);
  color: var(--color-info);
}
</style>
