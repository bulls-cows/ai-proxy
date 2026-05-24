<template>
  <div class="home-page">
    <div class="page-header">
      <h2 class="page-title">仪表盘</h2>
      <p class="page-desc">配置代理服务并启动</p>
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
              <span class="status-label">监听端口:</span>
              <span class="status-value">{{ proxyStore.port }}</span>
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

const activeProfile = computed(() => configStore.activeProfile)

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
}

.status-label {
  color: var(--text-tertiary);
}

.status-value {
  color: var(--text-primary);
  font-weight: 500;
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
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
