import { ProxySandbox } from './ProxySandbox.js'
import type { TrackerConfig } from '../../../types/src/core/config.js'
import { Tracker } from '../tracker.js'

// 全局沙箱单例（避免重复初始化）
let sandboxInstance: ProxySandbox | null = null

/**
 * @param config SDK 所需的配置
 * @returns 沙箱代理后的 Tracker 实例
 */
export const getTrackerView = (config: TrackerConfig): Tracker => {
  if (!sandboxInstance) {
    sandboxInstance = new ProxySandbox(config)
  }
  return sandboxInstance.getProxy()
}

/**
 * 销毁沙箱
 */
export const destroyTrackerView = (): void => {
  if (sandboxInstance) {
    sandboxInstance.destroy()
    sandboxInstance = null
  }
}

// 导出沙箱类
export { ProxySandbox }
