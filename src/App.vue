<template>
  <!-- App - 应用根组件 -->
  <div class="app">
    <AppSidebar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
/**
 * App.vue - 应用根组件
 *
 * 业务职责：
 * - 作为应用的根容器，布局侧边栏和主内容区域
 * - 初始化代理和统计数据的事件监听器
 * - 处理窗口关闭事件，隐藏窗口而不是直接关闭（最小化到托盘）
 * - 在组件卸载时清理事件监听器
 *
 * 数据流向：
 * - 依赖 useProxyStore 和 useStatsStore 管理状态
 * - 通过 Tauri API 控制窗口行为
 *
 * @author Auto Generated
 * @since 2026-05-24
 */
import { onMounted, onUnmounted } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import AppSidebar from '@/components/AppSidebar.vue'
import { useProxyStore } from '@/stores/proxy'
import { useStatsStore } from '@/stores/stats'

const proxyStore = useProxyStore()
const statsStore = useStatsStore()

onMounted(async () => {
  // Setup stores
  await proxyStore.setupListeners()
  await statsStore.setupListeners()

  // Handle window close - minimize to tray instead
  const mainWindow = getCurrentWindow()
  await mainWindow.onCloseRequested(async event => {
    // Prevent the window from closing
    event.preventDefault()
    // Hide the window instead
    await mainWindow.hide()
  })
})

onUnmounted(() => {
  proxyStore.cleanup()
  statsStore.cleanup()
})
</script>

<style lang="scss" scoped>
.app {
  display: flex;
  height: 100vh;
  background: var(--bg-primary);
}

.main-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background: var(--bg-secondary);
}
</style>
