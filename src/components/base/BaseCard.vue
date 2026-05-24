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
