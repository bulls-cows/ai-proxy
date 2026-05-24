/**
 * stringUtils.ts - 字符串工具函数
 *
 * 业务职责：
 * - 提供字符串处理的工具函数
 *
 * @author Auto Generated
 * @since 2026-05-24
 */

/**
 * 将下划线命名转换为标题格式
 * 例如: 'ai_proxy' -> 'Ai Proxy'
 * @param name - 下划线格式的字符串
 * @returns 标题格式的字符串
 */
export function toTitleCase(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}
