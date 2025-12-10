import { ProxySandbox } from './ProxySandbox'
import type { TrackerConfig } from '../types/src/core/config'
import { Tracker } from '../core/src/reporter'

// 全局沙箱单例（避免重复初始化）
let sandboxInstance: ProxySandbox | null = null

/**
 * 业务层调用的入口：获取沙箱包装后的 Tracker 代理
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
