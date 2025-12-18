import { JsErrorReporter } from './error-reporter.js'

export const initJsErrorMonitoring = (serverUrl?: string) => {
  const reporter = serverUrl ? new JsErrorReporter(serverUrl) : null
  // 全局 JS 错误
  window.onerror = (message, source, lineno, colno, error) => {
    const errorInfo = {
      type: 'js-error',
      message: typeof message === 'string' ? message : String(message),
      source: source || '',
      lineno: lineno || 0,
      colno: colno || 0,
      stack: error instanceof Error ? error.stack || '' : '',
    }
    if (reporter) {
      reporter.report(errorInfo)
    } else {
      console.log('🚨 捕获到错误（未配置上报地址）:', errorInfo)
    }
    return true // 返回 true 防止浏览器默认处理
  }
  // Promise 未捕获错误
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason

    const errorInfo = {
      type: 'unhandled-rejection',
      message: reason instanceof Error ? reason.message : String(reason), // 如果 reason 是 Error 对象，获取 message
      source: '',
      lineno: 0,
      colno: 0,
      stack: reason instanceof Error ? reason.stack || '' : '', // 如果 reason 是 Error 对象，获取 stack
    }
    if (reporter) {
      reporter.report(errorInfo)
    } else {
      console.log('🚨 捕获到未捕获错误（未配置上报地址）:', errorInfo)
    }
  })
}
