export interface JsErrorInfo {
  message: string
  stack?: string
  filename?: string
  lineno?: number
  colno?: number
  errorType?: string
  timestamp: number
  pageUrl: string
  userAgent?: string
}

export interface JsErrorOptions {
  enable?: boolean
  serverUrl?: string
  onJsError?: (error: JsErrorInfo) => void
  ignoreErrors?: RegExp[]
  sampling?: number
}