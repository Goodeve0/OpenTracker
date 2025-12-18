export interface WebErrorInfo {
  type: string
  tagName: string
  url: string
  timestamp: number
  detail: string
  pageUrl: string
  userAgent?: string
}

export interface WebErrorOptions {
  enable?: boolean
  serverUrl?: string
  onWebError?: (error: WebErrorInfo) => void
  sampling?: number
}
