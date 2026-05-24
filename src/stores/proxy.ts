/**
 * proxy.ts - 代理服务管理 Store
 *
 * 业务职责：
 * - 管理代理服务的启动和停止
 * - 监听代理服务状态变化
 * - 收集和管理代理服务的日志
 *
 * @author Auto Generated
 * @since 2026-05-24
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listen, type UnlistenFn } from '@tauri-apps/api/event'
import { startProxy, stopProxy, getProxyStatus } from '@/apis/api'

/**
 * 日志条目接口
 */
export interface LogEntry {
  timestamp: string
  level: string
  message: string
  details: Record<string, unknown> | null
}

export const useProxyStore = defineStore('proxy', () => {
  // 代理服务状态
  const status = ref<'running' | 'stopped'>('stopped')
  // 代理服务端口
  const port = ref<number | null>(null)
  // 日志列表
  const logs = ref<LogEntry[]>([])
  // 错误信息
  const error = ref<string | null>(null)

  // 事件监听器
  let unlistenLog: UnlistenFn | null = null
  let unlistenStatus: UnlistenFn | null = null

  /**
   * 设置事件监听器
   * 监听代理日志和状态变化事件
   */
  async function setupListeners() {
    // Listen for log events
    unlistenLog = await listen<LogEntry>('proxy-log', event => {
      logs.value.push(event.payload)
      // Keep only last 1000 logs
      if (logs.value.length > 1000) {
        logs.value = logs.value.slice(-1000)
      }
    })

    // Listen for status events
    unlistenStatus = await listen<string>('proxy-status', event => {
      status.value = event.payload as 'running' | 'stopped'
    })
  }

  /**
   * 启动代理服务
   */
  async function start() {
    error.value = null
    try {
      port.value = await startProxy()
      status.value = 'running'
    } catch (e) {
      error.value = String(e)
    }
  }

  /**
   * 停止代理服务
   */
  async function stop() {
    error.value = null
    try {
      await stopProxy()
      status.value = 'stopped'
      port.value = null
    } catch (e) {
      error.value = String(e)
    }
  }

  /**
   * 检查代理服务状态
   */
  async function checkStatus() {
    try {
      const result = await getProxyStatus()
      status.value = result as 'running' | 'stopped'
    } catch (e) {
      error.value = String(e)
    }
  }

  /**
   * 清空日志列表
   */
  function clearLogs() {
    logs.value = []
  }

  /**
   * 清理事件监听器
   */
  function cleanup() {
    unlistenLog?.()
    unlistenStatus?.()
  }

  return {
    status,
    port,
    logs,
    error,
    setupListeners,
    start,
    stop,
    checkStatus,
    clearLogs,
    cleanup,
  }
})
