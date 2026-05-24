<template>
  <div class="home-page">
    <div class="page-header">
      <h2 class="page-title">仪表盘</h2>
      <p class="page-desc">配置代理服务并启动</p>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats">
      <Card>
        <div class="stat-item">
          <span class="stat-value">{{ statsStore.stats.total_requests }}</span>
          <span class="stat-label">总请求数</span>
        </div>
      </Card>
      <Card>
        <div class="stat-item">
          <span class="stat-value text-success">{{ statsStore.stats.successful_requests }}</span>
          <span class="stat-label">成功请求</span>
        </div>
      </Card>
      <Card>
        <div class="stat-item">
          <span class="stat-value text-danger">{{ statsStore.stats.failed_requests }}</span>
          <span class="stat-label">失败请求</span>
        </div>
      </Card>
      <Card>
        <div class="stat-item">
          <span class="stat-value text-warning">{{ statsStore.stats.total_retries }}</span>
          <span class="stat-label">重试次数</span>
        </div>
      </Card>
    </div>

    <!-- Status Card -->
    <Card class="status-card" title="配置方案">
      <template #header>
        <div class="card-header-content">
          <div class="profile-selector-inline">
            <Select
              v-if="hasProfiles"
              v-model="activeProfileId"
              :options="profileOptions"
              @update:model-value="handleProfileChange"
            />
            <Button type="default" @click="showCreateModal = true"> 新建方案 </Button>
            <Button
              v-if="hasProfiles && activeProfile"
              type="primary"
              @click="showConfigModal = true"
            >
              编辑方案
            </Button>
          </div>
        </div>
      </template>
      <div class="status-content">
        <template v-if="hasProfiles">
          <div class="status-main">
            <div :class="['status-badge', proxyStore.status]">
              <span class="status-icon" />
              {{ proxyStore.status === 'running' ? '运行中' : '已停止' }}
            </div>
            <div v-if="proxyStore.status === 'running'" class="status-info">
              <span class="status-label">Base URL:</span>
              <div class="base-url-wrapper">
                <span class="status-value">{{ baseUrl }}</span>
                <button class="copy-btn" :class="{ copied: copied }" @click="copyBaseUrl">
                  <svg
                    v-if="!copied"
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div class="status-actions">
            <Button
              v-if="proxyStore.status === 'stopped'"
              type="primary"
              size="large"
              @click="handleStart"
            >
              启动服务
            </Button>
            <Button v-else type="danger" size="large" @click="handleStop"> 停止服务 </Button>
          </div>
        </template>
        <div v-else class="status-empty">暂无方案，请点击「新建方案」</div>
      </div>
    </Card>

    <!-- Create Profile Modal -->
    <DialogEditProfile v-model="showCreateModal" @create="handleCreateProfile" />

    <!-- Config Detail Modal -->
    <DialogEditProfile
      v-model="showConfigModal"
      :profile="activeProfile"
      :show-delete-button="(configStore.config?.profiles?.length ?? 0) > 1"
      @save="handleSaveProfile"
      @delete="handleDeleteProfile"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Card from '@/components/base/Card.vue'
import Button from '@/components/base/Button.vue'
import Select from '@/components/base/Select.vue'
import DialogEditProfile from '@/components/DialogEditProfile/DialogEditProfile.vue'
import { useConfigStore } from '@/stores/config'
import type { ProxyProfile } from '@/stores/config'
import { useProxyStore } from '@/stores/proxy'
import { useStatsStore } from '@/stores/stats'

const configStore = useConfigStore()
const proxyStore = useProxyStore()
const statsStore = useStatsStore()

const showCreateModal = ref(false)
const showConfigModal = ref(false)
const activeProfileId = ref<string>('')
const copied = ref(false)

const activeProfile = computed(() => configStore.activeProfile)

const baseUrl = computed(() => {
  if (!proxyStore.port) return ''
  return `http://localhost:${proxyStore.port}`
})

async function copyBaseUrl() {
  if (!baseUrl.value) return
  try {
    await navigator.clipboard.writeText(baseUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const hasProfiles = computed(() => (configStore.config?.profiles?.length ?? 0) > 0)

const profileOptions = computed(() =>
  (configStore.config?.profiles || []).map(p => ({
    label: p.name,
    value: p.id,
  }))
)

watch(
  () => configStore.config?.active_profile_id,
  id => {
    if (id) activeProfileId.value = id
  },
  { immediate: true }
)

async function handleStart() {
  await proxyStore.start()
}

async function handleStop() {
  await proxyStore.stop()
}

async function handleProfileChange(id: string) {
  await configStore.setActiveProfile(id)
}

async function handleCreateProfile(profile: Omit<ProxyProfile, 'id'>) {
  await configStore.createProfile(profile)
  showCreateModal.value = false
}

async function handleSaveProfile(profile: ProxyProfile) {
  await configStore.updateProfile(profile)
  showConfigModal.value = false
}

async function handleDeleteProfile(id: string) {
  await configStore.deleteProfile(id)
  showConfigModal.value = false
}

onMounted(async () => {
  await configStore.loadConfig()
  await proxyStore.checkStatus()
  await statsStore.loadStats()
})
</script>

<style lang="scss" scoped>
.home-page {
  max-width: 900px;
}

.page-header {
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.page-desc {
  font-size: var(--font-md);
  color: var(--text-tertiary);
  margin: 0;
}

.status-card {
  margin-bottom: var(--spacing-lg);
}

.card-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
}

.profile-selector-inline {
  display: flex;
  gap: var(--spacing-md);
  align-items: flex-end;
  flex: 1;
}

.status-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-empty {
  margin-left: auto;
  color: var(--text-tertiary);
  font-size: var(--font-md);
}

.status-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  font-weight: 500;

  &.running {
    background: rgba(103, 194, 58, 0.1);
    color: var(--color-success);
  }

  &.stopped {
    background: var(--bg-tertiary);
    color: var(--text-tertiary);
  }
}

.status-icon {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: currentColor;
}

.status-info {
  display: flex;
  gap: 8px;
  font-size: var(--font-md);
  align-items: center;
}

.status-label {
  color: var(--text-tertiary);
}

.status-value {
  color: var(--color-primary);
  font-weight: 500;
  font-family: var(--font-mono);
  background: var(--bg-tertiary);
  padding: 4px 12px;
  border-radius: var(--radius-sm);
}

.base-url-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  &.copied {
    background: rgba(103, 194, 58, 0.1);
    color: var(--color-success);
  }
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-primary);
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
</style>
