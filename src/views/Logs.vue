<template>
  <div class="logs-page">
    <div class="page-header">
      <h2 class="page-title">实时日志</h2>
      <div class="page-actions">
        <Select v-model="levelFilter" :options="levelOptions" label="日志级别" />
        <Button type="default" @click="onClearLogs"> 清空日志 </Button>
      </div>
    </div>

    <Card class="logs-card">
      <div ref="logContainer" class="log-container">
        <div
          v-for="(log, index) in filteredLogs"
          :key="index"
          :class="['log-entry', `log-${log.level.toLowerCase()}`]"
          @click="onToggleLogExpand(index)"
        >
          <div class="log-header">
            <span class="log-time">{{ formatTime(log.timestamp) }}</span>
            <Tag :type="getTagType(log.level)">
              {{ log.level }}
            </Tag>
            <span class="log-message">{{ log.message }}</span>
            <span class="log-expand-icon">
              {{ expandedLogs.includes(index) ? '▼' : '▶' }}
            </span>
          </div>
          <div v-if="expandedLogs.includes(index) && log.details" class="log-details">
            <div class="log-details-header">
              <span class="log-details-title">详细信息</span>
              <Button
                type="default"
                size="small"
                @click.stop="onCopyLogDetails(log.details, index)"
              >
                {{ copiedIndex === index ? '已复制' : '复制' }}
              </Button>
            </div>
            <pre class="log-details-content">{{ formatDetails(log.details) }}</pre>
          </div>
        </div>
        <div v-if="filteredLogs.length === 0" class="log-empty">暂无日志</div>
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
/**
 * Logs.vue - 实时日志页面组件
 *
 * 业务职责：
 * - 展示代理服务的实时日志列表
 * - 支持按日志级别（INFO/WARN/ERROR）过滤
 * - 支持展开查看日志详细信息
 * - 支持复制日志详情到剪贴板
 * - 支持清空日志列表
 * - 自动滚动到最新日志
 *
 * 数据流向：
 * 1. 从 proxyStore 获取日志列表
 * 2. 根据级别过滤器筛选日志
 * 3. 用户交互触发相应操作
 *
 * 核心交互：
 * - 日志级别筛选：通过下拉框选择过滤条件
 * - 点击日志：展开/折叠详细信息
 * - 复制按钮：复制日志详情
 * - 清空按钮：清空所有日志
 *
 * @author Auto Generated
 * @since 2026-05-24
 */
import { ref, computed, onMounted, nextTick, watch } from 'vue'

// 基础组件
import Card from '@/components/base/Card.vue'
import Button from '@/components/base/Button.vue'
import Select from '@/components/base/Select.vue'
import Tag from '@/components/base/Tag.vue'

// Pinia Stores
import { useProxyStore } from '@/stores/proxy'

// Pinia Store 实例
const proxyStore = useProxyStore()

// 响应式状态
const logContainer = ref<HTMLElement | null>(null)
const levelFilter = ref('ALL')
const expandedLogs = ref<number[]>([])
const copiedIndex = ref<number | null>(null)

// 日志级别选项常量
const levelOptions = [
  { label: '全部', value: 'ALL' },
  { label: 'INFO', value: 'INFO' },
  { label: 'WARN', value: 'WARN' },
  { label: 'ERROR', value: 'ERROR' },
]

// 根据级别过滤后的日志列表
const filteredLogs = computed(() => {
  if (levelFilter.value === 'ALL') {
    return proxyStore.logs
  }
  return proxyStore.logs.filter(log => log.level === levelFilter.value)
})

/**
 * 格式化时间戳为可读格式
 * @param timestamp - 时间戳字符串
 * @returns 格式化后的时间字符串
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/**
 * 根据日志级别获取标签类型
 * @param level - 日志级别（INFO/WARN/ERROR）
 * @returns 标签类型
 */
function getTagType(
  level: string
): 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' {
  const map: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    INFO: 'info',
    WARN: 'warning',
    ERROR: 'danger',
  }
  return map[level] || 'default'
}

/**
 * 格式化日志详情为JSON字符串
 * @param details - 日志详情对象
 * @returns 格式化后的JSON字符串
 */
function formatDetails(details: Record<string, unknown>): string {
  return JSON.stringify(details, null, 2)
}

/**
 * 切换日志展开状态
 * @param index - 日志索引
 */
function onToggleLogExpand(index: number) {
  const idx = expandedLogs.value.indexOf(index)
  if (idx === -1) {
    expandedLogs.value.push(index)
  } else {
    expandedLogs.value.splice(idx, 1)
  }
}

/**
 * 清空日志列表
 */
function onClearLogs() {
  proxyStore.clearLogs()
  expandedLogs.value = []
}

/**
 * 复制日志详情到剪贴板
 * @param details - 日志详情对象
 * @param index - 日志索引
 */
async function onCopyLogDetails(details: Record<string, unknown>, index: number) {
  const content = formatDetails(details)
  try {
    await navigator.clipboard.writeText(content)
    copiedIndex.value = index
    setTimeout(() => {
      copiedIndex.value = null
    }, 2000)
  } catch (err) {
    console.error('复制失败:', err)
  }
}

/**
 * 滚动到日志容器底部
 */
function scrollToBottom() {
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

/**
 * 监听日志数量变化，自动滚动到底部
 */
watch(
  () => proxyStore.logs.length,
  () => scrollToBottom()
)

/**
 * 组件挂载时初始化滚动位置
 */
onMounted(() => {
  scrollToBottom()
})
</script>

<style lang="scss" scoped>
.logs-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 48px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.page-actions {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-end;
}

.logs-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.card-body) {
    flex: 1;
    min-height: 0;
    padding: 0;
  }
}

.log-container {
  height: 100%;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
  font-size: var(--font-sm);
  padding: var(--spacing-md);
}

.log-entry {
  display: flex;
  flex-direction: column;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  margin-bottom: 4px;
  background: var(--bg-secondary);
  cursor: pointer;

  &:hover {
    background: var(--bg-tertiary);
  }
}

.log-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.log-time {
  color: var(--text-tertiary);
  font-size: var(--font-xs);
  white-space: nowrap;
}

.log-message {
  flex: 1;
  color: var(--text-primary);
  word-break: break-all;
}

.log-expand-icon {
  color: var(--text-tertiary);
  font-size: var(--font-xs);
}

.log-details {
  margin-top: 8px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-primary);
}

.log-details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-primary);
}

.log-details-title {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
}

.log-details-content {
  margin: 0;
  padding: 0;
  font-size: var(--font-xs);
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
  overflow-x: auto;
}

.log-info {
  border-left: 3px solid var(--color-info);
}

.log-warn {
  border-left: 3px solid var(--color-warning);
  background: rgba(230, 162, 60, 0.05);
}

.log-error {
  border-left: 3px solid var(--color-danger);
  background: rgba(245, 108, 108, 0.05);
}

.log-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-tertiary);
}
</style>
