// 导出核心功能
export {
  Tracker,
  LifecycleManager,
  PluginManager,
  initTracker,
  getTracker,
  destroyTracker,
  reportPerformance,
  reportBehavior,
  reportError,
  reportWhiteScreen,
  trackEventBus,
} from '../core/src/index.js'

// 导出类型
export type { LifecycleHook, LifecycleContext, Plugin, PluginContext } from '../core/src/index.js'

// 导出 TrackerConfig 类型
export type { TrackerConfig } from '../types/src/core/config.js'

// 导出行为监控功能
export { UserVitals } from '../plugins/src/index.js'

// 导出 JS 错误监控功能
export { initJsErrorMonitoring } from '../plugins/src/error/js-error/js-monitoring.js'

// 导出 API 错误监控功能
export { ApiErrorMonitor } from '../plugins/src/error/api-error/api-monitoring.js'

// 导出 track 函数
export function track(event: string, data?: any) {
  console.log('Tracking:', event, data)
}
