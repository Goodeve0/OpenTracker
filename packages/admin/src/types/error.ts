// 错误类型枚举
export type ErrorType = 'js' | 'api' | 'framework' | 'cors' | 'crash' | 'resource'

// 错误数据接口（后端存储格式）
export interface ErrorItem {
  id: string
  type: ErrorType
  message: string
  url: string // 页面URL (pageUrl)
  userAgent: string
  timestamp: string // ISO 格式时间字符串
  userId?: string // 用户ID（后端从token中解析）
  status: 'unresolved' | 'resolved' // 处理状态（后端管理）

  // JS错误特有字段
  stack?: string // 错误堆栈
  filename?: string // 错误文件名 (source)
  lineno?: number // 错误行号
  colno?: number // 错误列号
  errorType?: string // 错误类型 (js-error | unhandled-rejection)

  // API错误特有字段
  statusCode?: number // HTTP状态码 (status)
  method?: string // HTTP方法
  statusText?: string // HTTP状态文本
  duration?: number // 请求耗时
  requestData?: any // 请求数据
  response?: any // 响应数据
  errorName?: string // 错误名称
  timeout?: number // 超时时间
}

// ============================================
// SDK 统一上报格式（SDK -> Server）
// ============================================

// 统一的上报数据格式（所有错误类型都使用此格式）
export interface UnifiedErrorReport {
  type: 'Error' // 统一类型标识
  data: {
    subType: string // 错误子类型，用于区分不同的错误类型
    [key: string]: any // 其他错误数据字段
  }
}

// 错误子类型
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

// JS错误上报数据（在 data 字段中）
export interface JsErrorReportData {
  subType: 'js-error' | 'unhandled-rejection'
  message: string
  source: string // 错误发生的文件路径
  lineno: number // 错误行号
  colno: number // 错误列号
  stack: string // 错误堆栈
  // 注意：SDK上报时可能还会包含 pageUrl 和 userAgent（通过其他方式传递）
}

// API错误上报数据（在 data 字段中）
export interface ApiErrorReportData {
  subType:
    | 'xhr_error'
    | 'fetch_error'
    | 'xhr_network_error'
    | 'fetch_network_error'
    | 'xhr_timeout'
    | 'manual_api_error'
  method?: string
  url: string // 请求的API地址
  status: number // HTTP状态码
  statusText: string
  duration?: number
  response?: any
  requestData?: any
  timestamp: number // 时间戳（毫秒）
  pageUrl: string // 发生错误的页面URL
  userAgent?: string
  errorName?: string
  timeout?: number
}

// 跨域错误上报数据（在 data 字段中）
export interface CorsErrorReportData {
  subType: 'cross-origin'
  message: string
  url: string // 请求的URL
  pageUrl: string // 发生错误的页面URL
  userAgent?: string
  timestamp: number
  [key: string]: any
}

// 行为异常上报数据（在 data 字段中）
export interface BehaviorErrorReportData {
  subType: 'behavior'
  message: string
  pageUrl: string
  userAgent?: string
  timestamp: number
  [key: string]: any
}

// ============================================
// 数据转换说明
// ============================================
// 1. SDK 上报格式（统一格式）：
//    {
//      type: 'Error',
//      data: {
//        subType: 'js-error' | 'xhr_error' | 'cross-origin' | 'behavior' 等,
//        ...其他错误数据
//      }
//    }
//
// 2. 后端接收后需要：
//    - 解析统一格式，提取 data 字段
//    - 根据 subType 映射为 ErrorItem 的 type：
//      * 'js-error' | 'unhandled-rejection' -> 'js'
//      * 'xhr_error' | 'fetch_error' 等 -> 'api'
//      * 'cross-origin' -> 'cors'
//      * 'behavior' -> 'behavior'
//    - 添加 id（数据库生成）
//    - 添加 userId（从 token 解析）
//    - 添加 status（默认为 'unresolved'）
//    - 转换 timestamp 格式（从 number 转为 ISO 字符串）
//    - 将 SDK 的 url（API地址）和 pageUrl 分别存储
//
// 3. ErrorItem 是后端存储和前端展示的统一格式
