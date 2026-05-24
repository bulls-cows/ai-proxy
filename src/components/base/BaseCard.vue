<template>
  <!-- BaseCard - 基础卡片组件 -->
  <div class="card">
    <!-- 卡片头部 -->
    <div v-if="title || $slots.header" class="card-header">
      <h3 class="card-title">
        {{ title }}
      </h3>
      <slot name="header" />
    </div>
    <!-- 卡片内容区 -->
    <div class="card-body">
      <slot />
    </div>
    <!-- 卡片底部 -->
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * BaseCard.vue - 基础卡片组件
 *
 * 业务职责：
 * - 提供带标题和内容区域的卡片容器
 * - 支持自定义头部插槽
 * - 支持自定义底部插槽
 *
 * @author Auto Generated
 * @since 2026-05-24
 */
// Props 定义
defineProps<{
  // title: 卡片标题
  title?: string
}>()
</script>

<style lang="scss" scoped>
/* 卡片容器 */
.card {
  background: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-primary);
  overflow: hidden;
}

/* 卡片 > 头部 */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-primary);
}

/* 卡片 > 头部 > 标题 */
.card-title {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* 卡片 > 内容区 */
.card-body {
  padding: var(--spacing-lg);
}

/* 卡片 > 底部 */
.card-footer {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-primary);
  background: var(--bg-secondary);
}
</style>
