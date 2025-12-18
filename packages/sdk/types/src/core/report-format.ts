// 统一的上报数据格式
export interface UnifiedReportData<T = any> {
  type: 'Error' // 统一类型标识
  data: T & {
    subType: string // 错误子类型，用于区分不同的错误类型
  }
}

// 错误子类型枚举
export type ErrorSubType =
  // JS 错误
  | 'js-error'
  | 'unhandled-rejection'
  // API 错误
  | 'xhr_error'
  | 'fetch_error'
  | 'xhr_network_error'
  | 'fetch_network_error'
  | 'xhr_timeout'
  | 'manual_api_error'
  // 跨域错误
  | 'cross-origin'
  // 行为异常
  | 'behavior'
