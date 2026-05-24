<template>
  <div class="home-page">
    <div class="home-page__header">
      <h2 class="home-page__title">仪表盘</h2>
      <p class="home-page__desc">配置代理服务并启动</p>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats">
      <Card>
        <div class="quick-stats__item">
          <span class="quick-stats__value">{{ statsStore.stats.total_requests }}</span>
          <span class="quick-stats__label">总请求数</span>
        </div>
      </Card>
      <Card>
        <div class="quick-stats__item">
          <span class="quick-stats__value quick-stats__value--success">{{
            statsStore.stats.successful_requests
          }}</span>
          <span class="quick-stats__label">成功请求</span>
        </div>
      </Card>
      <Card>
        <div class="quick-stats__item">
          <span class="quick-stats__value quick-stats__value--danger">{{
            statsStore.stats.failed_requests
          }}</span>
          <span class="quick-stats__label">失败请求</span>
        </div>
      </Card>
      <Card>
        <div class="quick-stats__item">
          <span class="quick-stats__value quick-stats__value--warning">{{
            statsStore.stats.total_retries
          }}</span>
          <span class="quick-stats__label">重试次数</span>
        </div>
      </Card>
    </div>

    <!-- Status Card -->
    <Card class="home-page__status-card" title="配置方案">
      <template #header>
        <div class="card-header-content">
          <div class="profile-selector-inline">
            <Select
              v-if="hasProfiles"
              v-model="activeProfileId"
              :options="profileOptions"
              @update:model-value="onProfileChange"
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
      <div class="status__content">
        <template v-if="hasProfiles">
          <div class="status__main">
            <div :class="['status__badge', `status__badge--${proxyStore.status}`]">
              <span class="status__icon" />
              {{ proxyStore.status === 'running' ? '运行中' : '已停止' }}
            </div>
            <div v-if="proxyStore.status === 'running'" class="status__info">
              <span class="status__label">Base URL:</span>
              <div class="base-url-wrapper">
                <span class="status__value">{{ baseUrl }}</span>
                <button
                  class="copy-btn"
                  :class="{ 'copy-btn--copied': copied }"
                  @click="copyBaseUrl"
                >
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
            <Button v-if="proxyStore.status === 'stopped'" type="primary" @click="onStartProxy">
              启动服务
            </Button>
            <Button v-else type="danger" @click="onStopProxy"> 停止服务 </Button>
          </div>
        </template>
        <div v-else class="status__empty">暂无方案，请点击「新建方案」</div>
      </div>
    </Card>

    <!-- Create Profile Modal -->
    <DialogEditProfile v-model="showCreateModal" @create="onCreateProfile" />

    <!-- Config Detail Modal -->
    <DialogEditProfile
      v-model="showConfigModal"
      :profile="activeProfile"
      :show-delete-button="(configStore.config?.profiles?.length ?? 0) > 1"
      @save="onSaveProfile"
      @delete="onDeleteProfile"
    />

    <!-- Toast -->
    <Toast :message="toastMessage" :visible="toastVisible" />
  </div>
</template>

<script setup lang="ts">
/**
 * Home.vue - 仪表盘页面组件
 *
 * 业务职责：
 * - 展示代理服务的实时统计数据（总请求数、成功/失败请求、重试次数）
 * - 管理配置方案的切换、创建、编辑和删除
 * - 控制代理服务的启动和停止
 * - 提供基础URL复制功能
 *
 * 数据流向：
 * 1. 组件挂载时加载配置、检查代理状态、加载统计数据
 * 2. 监听配置变化，同步选中的配置方案
 * 3. 用户操作触发相应的 store 方法
 *
 * 核心交互：
 * - 配置方案选择器：切换不同配置
 * - 启动/停止按钮：控制代理服务状态
 * - 新建/编辑方案：通过弹窗管理配置
 * - 复制URL：一键复制代理服务地址
 *
 * @author Auto Generated
 * @since 2026-05-24
 */
import { ref, computed, onMounted, watch } from 'vue'

// 基础组件
import Card from '@/components/base/Card.vue'
import Button from '@/components/base/Button.vue'
import Select from '@/components/base/Select.vue'
import Toast from '@/components/base/Toast.vue'

// 业务组件
import DialogEditProfile from '@/components/DialogEditProfile/DialogEditProfile.vue'

// Pinia Stores
import { useConfigStore } from '@/stores/config'
import type { ProxyProfile } from '@/stores/config'
import { useProxyStore } from '@/stores/proxy'
import { useStatsStore } from '@/stores/stats'

// Pinia Store 实例
const configStore = useConfigStore()
const proxyStore = useProxyStore()
const statsStore = useStatsStore()

// 响应式状态
const showCreateModal = ref(false)
const showConfigModal = ref(false)
const activeProfileId = ref<string>('')
const copied = ref(false)
const toastVisible = ref(false)
const toastMessage = ref('')

// 计算属性
const activeProfile = computed(() => configStore.activeProfile)
const baseUrl = computed(() => (proxyStore.port ? `http://localhost:${proxyStore.port}` : ''))
const hasProfiles = computed(() => (configStore.config?.profiles?.length ?? 0) > 0)
const profileOptions = computed(() =>
  (configStore.config?.profiles || []).map(p => ({
    label: p.name,
    value: p.id,
  }))
)

/**
 * 复制基础URL到剪贴板
 */
async function copyBaseUrl() {
  if (!baseUrl.value) return
  try {
    await navigator.clipboard.writeText(baseUrl.value)
    copied.value = true
    toastMessage.value = '已复制到剪贴板'
    toastVisible.value = true
    setTimeout(() => {
      copied.value = false
      toastVisible.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

/**
 * 监听配置变化，同步选中的配置方案ID
 */
watch(
  () => configStore.config?.active_profile_id,
  id => {
    if (id) activeProfileId.value = id
  },
  { immediate: true }
)

/**
 * 启动代理服务
 */
async function onStartProxy() {
  await proxyStore.start()
}

/**
 * 停止代理服务
 */
async function onStopProxy() {
  await proxyStore.stop()
}

/**
 * 切换配置方案
 * @param id - 配置方案ID
 */
async function onProfileChange(id: string) {
  await configStore.setActiveProfile(id)
}

/**
 * 创建新配置方案
 * @param profile - 配置方案数据（不含ID）
 */
async function onCreateProfile(profile: Omit<ProxyProfile, 'id'>) {
  await configStore.createProfile(profile)
  showCreateModal.value = false
}

/**
 * 保存配置方案
 * @param profile - 配置方案数据
 */
async function onSaveProfile(profile: ProxyProfile) {
  await configStore.updateProfile(profile)
  showConfigModal.value = false
}

/**
 * 删除配置方案
 * @param id - 配置方案ID
 */
async function onDeleteProfile(id: string) {
  await configStore.deleteProfile(id)
  showConfigModal.value = false
}

/**
 * 组件挂载时初始化数据
 */
onMounted(async () => {
  await configStore.loadConfig()
  await proxyStore.checkStatus()
  await statsStore.loadStats()
})
</script>

<style lang="scss" scoped>
.home-page {
  max-width: 900px;

  &__header {
    margin-bottom: var(--spacing-lg);
  }

  &__title {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 4px 0;
  }

  &__desc {
    font-size: var(--font-md);
    color: var(--text-tertiary);
    margin: 0;
  }

  &__status-card {
    margin-bottom: var(--spacing-lg);
  }
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

.status {
  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__empty {
    margin-left: auto;
    color: var(--text-tertiary);
    font-size: var(--font-md);
  }

  &__main {
    display: flex;
    align-items: center;
    gap: var(--spacing-lg);
  }

  &__badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
    font-weight: 500;

    &--running {
      background: rgba(103, 194, 58, 0.1);
      color: var(--color-success);
    }

    &--stopped {
      background: var(--bg-tertiary);
      color: var(--text-tertiary);
    }
  }

  &__icon {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: currentColor;
  }

  &__info {
    display: flex;
    gap: 8px;
    font-size: var(--font-md);
    align-items: center;
  }

  &__label {
    color: var(--text-tertiary);
  }

  &__value {
    color: var(--color-primary);
    font-weight: 500;
    font-family: var(--font-mono);
    background: var(--bg-tertiary);
    padding: 4px 12px;
    border-radius: var(--radius-sm);
  }
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

  &--copied {
    background: rgba(103, 194, 58, 0.1);
    color: var(--color-success);
  }
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  &__value {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
  }

  &__label {
    font-size: var(--font-sm);
    color: var(--text-tertiary);
    margin-top: 4px;
  }

  &__value--success {
    color: var(--color-success);
  }

  &__value--danger {
    color: var(--color-danger);
  }

  &__value--warning {
    color: var(--color-warning);
  }
}
</style>
