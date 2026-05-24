/**
 * config.ts - 配置管理 Store
 *
 * 业务职责：
 * - 管理应用配置数据的加载、保存
 * - 管理代理配置方案的增删改查
 * - 支持多个配置方案的切换
 *
 * @author Auto Generated
 * @since 2026-05-24
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getConfig,
  saveConfig as saveConfigApi,
  createProfile as createProfileApi,
  updateProfile as updateProfileApi,
  deleteProfile as deleteProfileApi,
  setActiveProfile as setActiveProfileApi,
} from '@/apis/api'

/**
 * 代理配置方案接口
 */
export interface ProxyProfile {
  id: string
  name: string
  local_port: number
  target_base_url: string
  max_retries: number
  retry_delay_ms: number
  retry_status_codes: number[]
}

/**
 * 应用配置接口
 */
export interface Config {
  profiles: ProxyProfile[]
  active_profile_id: string | null
  auto_start: boolean
  minimize_to_tray: boolean
  start_on_boot: boolean
}

export const useConfigStore = defineStore('config', () => {
  // 配置数据
  const config = ref<Config | null>(null)
  // 加载状态
  const loading = ref(false)
  // 错误信息
  const error = ref<string | null>(null)

  /**
   * 当前激活的配置方案
   */
  const activeProfile = computed(() => {
    if (!config.value) return null
    return config.value.profiles.find(p => p.id === config.value?.active_profile_id)
  })

  /**
   * 加载配置数据
   */
  async function loadConfig() {
    loading.value = true
    error.value = null
    try {
      config.value = await getConfig()
    } catch (e) {
      error.value = String(e)
    } finally {
      loading.value = false
    }
  }

  /**
   * 保存配置数据
   * @param newConfig - 新的配置数据
   */
  async function saveConfig(newConfig: Config) {
    try {
      await saveConfigApi(newConfig)
      config.value = newConfig
    } catch (e) {
      error.value = String(e)
    }
  }

  /**
   * 创建新的配置方案
   * @param profile - 配置方案数据（不含id）
   * @returns 创建成功的配置方案
   */
  async function createProfile(profile: Omit<ProxyProfile, 'id'>) {
    try {
      const createdProfile = await createProfileApi(profile)
      await loadConfig()
      return createdProfile
    } catch (e) {
      error.value = String(e)
      return null
    }
  }

  /**
   * 更新配置方案
   * @param profile - 配置方案数据
   */
  async function updateProfile(profile: ProxyProfile) {
    try {
      await updateProfileApi(profile)
      await loadConfig()
    } catch (e) {
      error.value = String(e)
    }
  }

  /**
   * 删除配置方案
   * @param id - 配置方案ID
   */
  async function deleteProfile(id: string) {
    try {
      await deleteProfileApi(id)
      await loadConfig()
    } catch (e) {
      error.value = String(e)
    }
  }

  /**
   * 设置当前激活的配置方案
   * @param id - 配置方案ID
   */
  async function setActiveProfile(id: string) {
    try {
      await setActiveProfileApi(id)
      await loadConfig()
    } catch (e) {
      error.value = String(e)
    }
  }

  return {
    config,
    loading,
    error,
    activeProfile,
    loadConfig,
    saveConfig,
    createProfile,
    updateProfile,
    deleteProfile,
    setActiveProfile,
  }
})
