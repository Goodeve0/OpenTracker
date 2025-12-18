import { FrameworkErrorData } from '../../../../types/src/plugins/framework-error.js'

type ReportFunction = (data: FrameworkErrorData) => void
export function reportFrameworkError(
  error: Error,
  componentStack: string,
  reportFn: ReportFunction
) {
  const errorData: FrameworkErrorData = {
    // 1. 对齐公共字段
    errorType: 'react_error',
    timestamp: Date.now(),
    pageUrl: window.location.href,
    userAgent: navigator.userAgent,

    // 2. 填充基础错误信息
    name: error.name || 'ReactError',
    message: error.message || 'Unknown React Error',
    stack: error.stack || '',

    // 3. 填充 React 独有信息
    componentStack: componentStack || '',
  }
  reportFn(errorData)
}
