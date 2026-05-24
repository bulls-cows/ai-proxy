import { doRequest } from '@/scripts/requestUtils'
import type { Config, ProxyProfile } from '@/stores/config'
import type { StatsSnapshot } from '@/stores/stats'

// Config API
export function getConfig() {
  return doRequest<Config>('get_config')
}

export function saveConfig(config: Config) {
  return doRequest<void>('save_config', { config })
}

export function createProfile(profile: Omit<ProxyProfile, 'id'>) {
  return doRequest<ProxyProfile>('create_profile', { profile })
}

export function updateProfile(profile: ProxyProfile) {
  return doRequest<void>('update_profile', { profile })
}

export function deleteProfile(id: string) {
  return doRequest<void>('delete_profile', { id })
}

export function setActiveProfile(id: string) {
  return doRequest<void>('set_active_profile', { id })
}

// Proxy API
export function startProxy() {
  return doRequest<number>('start_proxy')
}

export function stopProxy() {
  return doRequest<void>('stop_proxy')
}

export function getProxyStatus() {
  return doRequest<string>('get_proxy_status')
}

// Stats API
export function getStats() {
  return doRequest<StatsSnapshot>('get_stats')
}

export function resetStats() {
  return doRequest<void>('reset_stats')
}
