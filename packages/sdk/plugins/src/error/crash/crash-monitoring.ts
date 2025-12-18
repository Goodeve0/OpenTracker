// packages/sdk/plugins/src/error/crash/crash-reporter.ts

import { CrashErrorData } from '../../../../types/src/plugins/crash-error.js'

// 定义 SDK 核心上报方法的类型
type ReportFunction = (data: CrashErrorData) => void

/**
 * 组装崩溃数据并上报
 * @param reportFn SDK 核心提供的上报函数
 */
export function reportCrashError(reportFn: ReportFunction) {
  const errorData: CrashErrorData = {
    // 1. 统一字段
    errorType: 'crash_error',
    timestamp: Date.now(),
    pageUrl: window.location.href,
    userAgent: navigator.userAgent,

    // 2. 崩溃特有信息
    message: 'Page Unresponsive (Heartbeat Timeout)',
    stack: new Error().stack || '',
    name: 'Page Crash',
  }

  // 调用核心上报
  reportFn(errorData)
}
