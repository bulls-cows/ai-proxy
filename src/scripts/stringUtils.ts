/**
 * 将下划线命名转换为标题格式
 * 例如: 'ai_proxy' -> 'Ai Proxy'
 */
export function toTitleCase(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
