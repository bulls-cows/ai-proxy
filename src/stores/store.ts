/**
 * store.ts - 全局状态存储
 *
 * 业务职责：
 * - 管理应用级别的通用状态
 * - 包括产品品牌信息、页面导航状态等
 * - 使用 sessionStorage 进行状态持久化
 *
 * @author Auto Generated
 * @since 2026-05-24
 */
import { computed } from 'vue'
import { tempRef } from '@/scripts/storageUtils.ts'
import { APP_NAME, APP_VERSION } from '@/scripts/constantUtils.ts'
import { toTitleCase } from '@/scripts/stringUtils.ts'

/**
 * 产品身份
 */
export const brandName = tempRef<string>('brandName', toTitleCase(APP_NAME))
export const versionLabel = tempRef<string>('versionLabel', APP_VERSION)

/**
 * 页面切换状态
 */
export const isPageMounting = tempRef<boolean>('isPageMounting', false)
export const isPageUnmounting = tempRef<boolean>('isPageUnmounting', false)
export const isPageNavigating = computed<boolean>(() => {
  return isPageMounting.value || isPageUnmounting.value
})
