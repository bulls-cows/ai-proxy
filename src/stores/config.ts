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

export interface ProxyProfile {
  id: string
  name: string
  local_port: number
  target_base_url: string
  max_retries: number
  retry_delay_ms: number
  retry_status_codes: number[]
}

export interface Config {
  profiles: ProxyProfile[]
  active_profile_id: string | null
  auto_start: boolean
  minimize_to_tray: boolean
  start_on_boot: boolean
}

export const useConfigStore = defineStore('config', () => {
  const config = ref<Config | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const activeProfile = computed(() => {
    if (!config.value) return null
    return config.value.profiles.find(p => p.id === config.value?.active_profile_id)
  })

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

  async function saveConfig(newConfig: Config) {
    try {
      await saveConfigApi(newConfig)
      config.value = newConfig
    } catch (e) {
      error.value = String(e)
    }
  }

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

  async function updateProfile(profile: ProxyProfile) {
    try {
      await updateProfileApi(profile)
      await loadConfig()
    } catch (e) {
      error.value = String(e)
    }
  }

  async function deleteProfile(id: string) {
    try {
      await deleteProfileApi(id)
      await loadConfig()
    } catch (e) {
      error.value = String(e)
    }
  }

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
