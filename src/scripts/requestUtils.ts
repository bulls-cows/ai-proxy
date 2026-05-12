import { invoke } from '@tauri-apps/api/core'

/**
 * 封装 Tauri invoke 调用
 * @param cmd - Tauri 命令名称
 * @param args - 命令参数（可选）
 * @returns Promise<T> - 返回命令结果
 */
export async function doRequest<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  return invoke<T>(cmd, args)
}
