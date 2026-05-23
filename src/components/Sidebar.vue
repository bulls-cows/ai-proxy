<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <h1 class="sidebar-title">
        {{ brandName }}
      </h1>
      <p class="sidebar-subtitle">AI 模型请求代理工具</p>
    </div>

    <nav class="sidebar-nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="nav-item"
        :class="{ 'nav-item-active': isActive(item.path) }"
      >
        <component :is="item.icon" class="nav-icon" />
        <span class="nav-text">{{ item.name }}</span>
      </router-link>
    </nav>

    <div class="sidebar-footer">
      <button
        type="button"
        class="pin-toggle"
        :class="{ 'pin-toggle-active': isAlwaysOnTop }"
        @click="toggleAlwaysOnTop"
      >
        <PinIcon class="pin-icon" />
        <span>{{ isAlwaysOnTop ? '取消置顶' : '窗口置顶' }}</span>
      </button>

      <div class="status-indicator">
        <span :class="['status-dot', proxyStore.status]" />
        <span class="status-text">
          {{ proxyStore.status === 'running' ? '运行中' : '已停止' }}
        </span>
      </div>
      <p class="version">v{{ APP_VERSION }}</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { h, ref } from 'vue'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useRoute } from 'vue-router'
import { useProxyStore } from '@/stores/proxy'
import { brandName } from '@/stores/store'
import { APP_VERSION } from '@/scripts/constantUtils'

const route = useRoute()
const proxyStore = useProxyStore()
const isAlwaysOnTop = ref(false)
const appWindow = getCurrentWindow()

// Icon components using h() function to avoid v-html XSS warning
const DashboardIcon = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('rect', { x: '3', y: '3', width: '7', height: '7', rx: '1' }),
    h('rect', { x: '14', y: '3', width: '7', height: '7', rx: '1' }),
    h('rect', { x: '3', y: '14', width: '7', height: '7', rx: '1' }),
    h('rect', { x: '14', y: '14', width: '7', height: '7', rx: '1' }),
  ])

const LogsIcon = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
    h('path', { d: 'M14 2v6h6' }),
    h('line', { x1: '16', y1: '13', x2: '8', y2: '13' }),
    h('line', { x1: '16', y1: '17', x2: '8', y2: '17' }),
    h('line', { x1: '10', y1: '9', x2: '8', y2: '9' }),
  ])

const StatsIcon = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('line', { x1: '18', y1: '20', x2: '18', y2: '10' }),
    h('line', { x1: '12', y1: '20', x2: '12', y2: '4' }),
    h('line', { x1: '6', y1: '20', x2: '6', y2: '14' }),
  ])

const PinIcon = () =>
  h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
    h('path', { d: 'M12 17v5' }),
    h('path', { d: 'M5 17h14' }),
    h('path', { d: 'M7 9h10' }),
    h('path', { d: 'M9 9V4h6v5' }),
    h('path', { d: 'M8 9l-2 8h12l-2-8' }),
  ])

const navItems = [
  { path: '/', name: '仪表盘', icon: DashboardIcon },
  { path: '/logs', name: '实时日志', icon: LogsIcon },
  { path: '/stats', name: '统计面板', icon: StatsIcon },
]

function isActive(path: string) {
  return route.path === path
}

async function toggleAlwaysOnTop() {
  const nextAlwaysOnTop = !isAlwaysOnTop.value

  await appWindow.setAlwaysOnTop(nextAlwaysOnTop)
  isAlwaysOnTop.value = nextAlwaysOnTop
}
</script>

<style lang="scss" scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--border-primary);
}

.sidebar-title {
  font-size: var(--font-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.sidebar-subtitle {
  font-size: var(--font-sm);
  color: var(--text-tertiary);
  margin: 0;
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  margin-bottom: 4px;

  &:hover {
    background: var(--bg-hover);
    color: var(--color-primary);
  }

  &.nav-item-active {
    background: rgba(64, 158, 255, 0.1);
    color: var(--color-primary);
  }
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-text {
  font-size: var(--font-md);
  font-weight: 500;
}

.sidebar-footer {
  padding: var(--spacing-md) var(--spacing-lg);
  border-top: 1px solid var(--border-primary);
}

.pin-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 12px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-sm);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--bg-hover);
    color: var(--color-primary);
  }

  &.pin-toggle-active {
    background: rgba(64, 158, 255, 0.1);
    color: var(--color-primary);
  }
}

.pin-icon {
  width: 16px;
  height: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.running {
    background: var(--color-success);
    box-shadow: 0 0 8px var(--color-success);
  }

  &.stopped {
    background: var(--text-tertiary);
  }
}

.status-text {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

.version {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  margin: 0;
}
</style>
