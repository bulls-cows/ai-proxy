/**
 * api.ts - Tauri API 调用封装
 *
 * 业务职责：
 * - 封装与 Tauri 后端的所有 API 调用
 * - 包括配置管理、代理服务、统计数据等
 * - 统一使用 doRequest 进行请求
 *
 * @author Auto Generated
 * @since 2026-05-24
 */
import { doRequest } from '@/scripts/requestUtils'
import type { Config, ProxyProfile } from '@/stores/config'
import type { StatsSnapshot } from '@/stores/stats'

// ==================== Config API ====================

/**
 * 获取配置数据
 */
export function getConfig() {
  return doRequest<Config>('get_config')
}

/**
 * 保存配置数据
 * @param config - 配置数据
 */
export function saveConfig(config: Config) {
  return doRequest<void>('save_config', { config })
}

/**
 * 创建配置方案
 * @param profile - 配置方案数据
 */
export function createProfile(profile: Omit<ProxyProfile, 'id'>) {
  return doRequest<ProxyProfile>('create_profile', { profile })
}

/**
 * 更新配置方案
 * @param profile - 配置方案数据
 */
export function updateProfile(profile: ProxyProfile) {
  return doRequest<void>('update_profile', { profile })
}

/**
 * 删除配置方案
 * @param id - 配置方案ID
 */
export function deleteProfile(id: string) {
  return doRequest<void>('delete_profile', { id })
}

/**
 * 设置激活的配置方案
 * @param id - 配置方案ID
 */
export function setActiveProfile(id: string) {
  return doRequest<void>('set_active_profile', { id })
}

// ==================== Proxy API ====================

/**
 * 启动代理服务
 * @returns 代理服务端口
 */
export function startProxy() {
  return doRequest<number>('start_proxy')
}

/**
 * 停止代理服务
 */
export function stopProxy() {
  return doRequest<void>('stop_proxy')
}

/**
 * 获取代理服务状态
 */
export function getProxyStatus() {
  return doRequest<string>('get_proxy_status')
}

// ==================== Stats API ====================

/**
 * 获取统计数据
 */
export function getStats() {
  return doRequest<StatsSnapshot>('get_stats')
}

/**
 * 重置统计数据
 */
export function resetStats() {
  return doRequest<void>('reset_stats')
}
