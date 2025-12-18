export interface XoErrorInfo {
  type: string
  message: string
  source: string
  lineno: number
  colno: number
  stack: string
  timestamp: number
  pageUrl: string
  userAgent?: string
}

export interface XoErrorOptions {
  enable?: boolean
  serverUrl?: string
  onXoError?: (error: XoErrorInfo) => void
  sampling?: number
  ignoreSources?: RegExp[]
}
