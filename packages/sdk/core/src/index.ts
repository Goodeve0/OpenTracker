// 导出核心类
export { Tracker, LifecycleManager } from './tracker.js'
export { PluginManager } from './plugin/index.js'
export type { Plugin, PluginContext } from './plugin/index.js'
// 导出生命周期相关类型
export type {
  LifecycleHook,
  LifecycleContext,
  LifecycleHookFunction,
  LifecycleManagerConfig,
} from '../../types/src/core/config.js'

// 导出全局管理方法
export { initTracker, getTracker, destroyTracker } from './tracker.js'
export { reportPerformance, reportBehavior, reportError, reportWhiteScreen } from './tracker.js'
