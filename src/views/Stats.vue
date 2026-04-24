<template>
  <div class="stats-page">
    <div class="page-header">
      <h2 class="page-title">统计面板</h2>
      <div class="page-actions">
        <Button type="danger" @click="handleReset"> 重置统计 </Button>
      </div>
    </div>

    <!-- Overview Cards -->
    <div class="stats-grid">
      <Card>
        <div class="stat-card">
          <span class="stat-icon">📊</span>
          <div class="stat-info">
            <span class="stat-value">{{ statsStore.stats.total_requests }}</span>
            <span class="stat-label">总请求数</span>
          </div>
        </div>
      </Card>
      <Card>
        <div class="stat-card">
          <span class="stat-icon">✅</span>
          <div class="stat-info">
            <span class="stat-value text-success">{{ statsStore.stats.successful_requests }}</span>
            <span class="stat-label">成功请求</span>
          </div>
        </div>
      </Card>
      <Card>
        <div class="stat-card">
          <span class="stat-icon">❌</span>
          <div class="stat-info">
            <span class="stat-value text-danger">{{ statsStore.stats.failed_requests }}</span>
            <span class="stat-label">失败请求</span>
          </div>
        </div>
      </Card>
      <Card>
        <div class="stat-card">
          <span class="stat-icon">🔄</span>
          <div class="stat-info">
            <span class="stat-value text-warning">{{ statsStore.stats.total_retries }}</span>
            <span class="stat-label">重试次数</span>
          </div>
        </div>
      </Card>
    </div>

    <!-- Success Rate Card -->
    <Card class="rate-card">
      <template #header>
        <span>请求成功率</span>
      </template>
      <div class="rate-content">
        <div class="rate-display">
          <div class="rate-circle">
            <span class="rate-value">{{ statsStore.stats.success_rate.toFixed(1) }}%</span>
          </div>
        </div>
        <div class="rate-bar-container">
          <div class="rate-bar-label">
            <span>成功率</span>
            <span>{{ statsStore.stats.success_rate.toFixed(1) }}%</span>
          </div>
          <div class="rate-bar">
            <div class="rate-bar-fill" :style="{ width: `${statsStore.stats.success_rate}%` }" />
          </div>
        </div>
      </div>
    </Card>

    <!-- Statistics Details -->
    <Card class="details-card">
      <template #header>
        <span>详细统计</span>
      </template>
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">平均重试率</span>
          <span class="detail-value">
            {{
              statsStore.stats.total_requests > 0
                ? (
                    (statsStore.stats.total_retries / statsStore.stats.total_requests) *
                    100
                  ).toFixed(1)
                : 0
            }}%
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">失败率</span>
          <span class="detail-value text-danger">
            {{
              statsStore.stats.total_requests > 0
                ? (
                    (statsStore.stats.failed_requests / statsStore.stats.total_requests) *
                    100
                  ).toFixed(1)
                : 0
            }}%
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">成功/失败比</span>
          <span class="detail-value">
            {{
              statsStore.stats.failed_requests > 0
                ? (statsStore.stats.successful_requests / statsStore.stats.failed_requests).toFixed(
                    2
                  )
                : statsStore.stats.successful_requests > 0
                  ? '∞'
                  : '0'
            }}
          </span>
        </div>
        <div class="detail-item">
          <span class="detail-label">重试/请求比</span>
          <span class="detail-value">
            {{
              statsStore.stats.total_requests > 0
                ? (statsStore.stats.total_retries / statsStore.stats.total_requests).toFixed(2)
                : 0
            }}
          </span>
        </div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import Card from '@/components/base/Card.vue'
import Button from '@/components/base/Button.vue'
import { useStatsStore } from '@/stores/stats'

const statsStore = useStatsStore()

async function handleReset() {
  await statsStore.resetStats()
}

onMounted(async () => {
  await statsStore.loadStats()
  await statsStore.setupListeners()
})

onUnmounted(() => {
  statsStore.cleanup()
})
</script>

<style lang="scss" scoped>
.stats-page {
  max-width: 900px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.stat-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.stat-icon {
  font-size: 32px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: var(--font-sm);
  color: var(--text-tertiary);
  margin-top: 4px;
}

.text-success {
  color: var(--color-success);
}

.text-danger {
  color: var(--color-danger);
}

.text-warning {
  color: var(--color-warning);
}

.rate-card {
  margin-bottom: var(--spacing-lg);
}

.rate-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
}

.rate-display {
  flex-shrink: 0;
}

.rate-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(
    var(--color-success) 0%,
    var(--color-success) calc(var(--rate) * 3.6deg),
    var(--bg-tertiary) calc(var(--rate) * 3.6deg),
    var(--bg-tertiary) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  --rate: v-bind('statsStore.stats.success_rate');
}

.rate-circle::before {
  content: '';
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--bg-primary);
}

.rate-value {
  position: relative;
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  z-index: 1;
}

.rate-bar-container {
  flex: 1;
}

.rate-bar-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-md);
  color: var(--text-secondary);
}

.rate-bar {
  height: 12px;
  background: var(--bg-tertiary);
  border-radius: 6px;
  overflow: hidden;
}

.rate-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-success), var(--color-info));
  border-radius: 6px;
  transition: width 0.3s ease;
}

.details-card {
  margin-bottom: var(--spacing-lg);
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
}

.detail-label {
  font-size: var(--font-md);
  color: var(--text-secondary);
}

.detail-value {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .rate-content {
    flex-direction: column;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
