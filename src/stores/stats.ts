/**
 * stats.ts - 统计数据管理 Store
 *
 * 业务职责：
 * - 收集和显示代理服务的统计数据
 * - 包括总请求数、成功请求数、失败请求数、重试次数、成功率
 * - 监听统计数据变化事件
 * - 支持重置统计数据
 *
 * @author Auto Generated
 * @since 2026-05-24
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { getStats, resetStats } from '@/apis/api'

/**
 * 统计数据快照接口
 */
export interface StatsSnapshot {
  total_requests: number
  successful_requests: number
  failed_requests: number
  total_retries: number
  success_rate: number
}

export const useStatsStore = defineStore('stats', () => {
  // 统计数据
  const stats = ref<StatsSnapshot>({
    total_requests: 0,
    successful_requests: 0,
    failed_requests: 0,
    total_retries: 0,
    success_rate: 0,
  })

  // 事件监听器
  let unlistenStats: UnlistenFn | null = null

  /**
   * 设置统计数据事件监听器
   */
  async function setupListeners() {
    unlistenStats = await listen<StatsSnapshot>('proxy-stats', event => {
      stats.value = event.payload
    })
  }

  /**
   * 加载统计数据
   */
  async function loadStats() {
    try {
      stats.value = await getStats()
    } catch (e) {
      console.error('Failed to load stats:', e)
    }
  }

  /**
   * 重置统计数据
   */
  async function resetStatsStore() {
    try {
      await resetStats()
      stats.value = {
        total_requests: 0,
        successful_requests: 0,
        failed_requests: 0,
        total_retries: 0,
        success_rate: 0,
      }
    } catch (e) {
      console.error('Failed to reset stats:', e)
    }
  }

  /**
   * 清理事件监听器
   */
  function cleanup() {
    unlistenStats?.()
  }

  return {
    stats,
    setupListeners,
    loadStats,
    resetStats: resetStatsStore,
    cleanup,
  }
})
