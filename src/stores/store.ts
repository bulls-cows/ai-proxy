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
