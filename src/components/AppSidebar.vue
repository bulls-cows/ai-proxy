<template>
  <!-- AppSidebar - 侧边导航栏 -->
  <aside class="app-sidebar">
    <!-- 侧边栏头部：品牌信息 -->
    <div class="app-sidebar__header">
      <div class="app-sidebar__title-row">
        <h1 class="app-sidebar__title">
          {{ brandName }}
        </h1>
        <p class="app-sidebar__version">v{{ APP_VERSION }}</p>
      </div>
      <p class="app-sidebar__subtitle">AI 模型请求代理工具</p>
    </div>

    <!-- 侧边栏导航菜单 -->
    <nav class="app-sidebar__nav">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="app-sidebar__nav-item"
        :class="{ 'app-sidebar__nav-item--active': isActive(item.path) }"
      >
        <component :is="item.icon" class="app-sidebar__nav-icon" />
        <span class="app-sidebar__nav-text">{{ item.name }}</span>
      </router-link>
    </nav>

    <!-- 侧边栏底部：窗口控制与状态 -->
    <div class="app-sidebar__footer">
      <!-- 窗口置顶切换按钮 -->
      <button
        type="button"
        class="app-sidebar__pin-toggle"
        :class="{ 'app-sidebar__pin-toggle--active': isAlwaysOnTop }"
        @click="toggleAlwaysOnTop"
      >
        <PinIcon class="app-sidebar__pin-icon" />
        <span>{{ isAlwaysOnTop ? '取消置顶' : '窗口置顶' }}</span>
      </button>

      <!-- 代理服务状态指示器 -->
      <div class="app-sidebar__status-indicator">
        <span :class="['app-sidebar__status-dot', proxyStore.status]" />
        <span class="app-sidebar__status-text">
          {{ proxyStore.status === 'running' ? '运行中' : '已停止' }}
        </span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
/**
 * AppSidebar.vue - 应用侧边栏组件
 *
 * 业务职责：
 * - 提供应用品牌展示（名称、版本号）
 * - 渲染导航菜单，支持路由跳转
 * - 提供窗口置顶切换功能
 * - 显示代理服务运行状态指示
 *
 * 数据来源：
 * - store: useProxyStore (代理状态)、brandName (品牌名)、APP_VERSION (版本号)
 * - vue-router: useRoute (当前路由)
 * - @tauri-apps/api/window: getCurrentWindow (窗口控制)
 *
 * 交互关系：
 * - emit: 无（纯展示组件）
 * - 依赖组件: router-link (Vue Router)
 * - 副作用: 窗口置顶状态通过 appWindow.setAlwaysOnTop 修改
 *
 * @author Auto Generated
 * @since 2026-05-24
 */
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
/* 侧边栏容器 */
.app-sidebar {
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
}

/* 侧边栏 > 头部 */
.app-sidebar__header {
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--border-primary);
}

/* 侧边栏 > 头部 > 标题行 */
.app-sidebar__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-bottom: 4px;
}

/* 侧边栏 > 头部 > 标题 */
.app-sidebar__title {
  font-size: var(--font-xl);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* 侧边栏 > 头部 > 副标题 */
.app-sidebar__subtitle {
  font-size: var(--font-sm);
  color: var(--text-tertiary);
  margin: 0;
}

/* 侧边栏 > 导航菜单 */
.app-sidebar__nav {
  flex: 1;
  padding: var(--spacing-md);
}

/* 侧边栏 > 导航菜单 > 导航项 */
.app-sidebar__nav-item {
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

  &.app-sidebar__nav-item--active {
    background: rgba(64, 158, 255, 0.1);
    color: var(--color-primary);
  }
}

/* 侧边栏 > 导航菜单 > 图标 */
.app-sidebar__nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 侧边栏 > 导航菜单 > 文字 */
.app-sidebar__nav-text {
  font-size: var(--font-md);
  font-weight: 500;
}

/* 侧边栏 > 底部 */
.app-sidebar__footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-primary);
}

/* 侧边栏 > 底部 > 置顶按钮 */
.app-sidebar__pin-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
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

  &.app-sidebar__pin-toggle--active {
    background: rgba(64, 158, 255, 0.1);
    color: var(--color-primary);
  }
}

/* 侧边栏 > 底部 > 置顶图标 */
.app-sidebar__pin-icon {
  width: 16px;
  height: 16px;
}

/* 侧边栏 > 底部 > 状态指示器 */
.app-sidebar__status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
}

/* 侧边栏 > 底部 > 状态指示器 > 状态点 */
.app-sidebar__status-dot {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--text-tertiary);
  }

  &.running::before {
    background: var(--color-success);
    box-shadow: 0 0 8px var(--color-success);
  }
}

/* 侧边栏 > 底部 > 状态文字 */
.app-sidebar__status-text {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}

/* 侧边栏 > 头部 > 版本号 */
.app-sidebar__version {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
  margin: 0;
  white-space: nowrap;
}
</style>
