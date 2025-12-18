export function track(event: string, data?: any) {
  console.log('Tracking:', event, data)
}

// 导出 JS 错误监控功能
export { initJsErrorMonitoring } from '../plugins/src/error/js-error/error-monitoring.js'

// 导出 API 错误监控功能
export { ApiErrorMonitor } from '../plugins/src/error/api-error/api-monitoring.js'
