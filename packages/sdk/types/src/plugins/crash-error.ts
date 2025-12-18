export interface CrashErrorData {
  errorType: 'crash_error'
  timestamp: number
  pageUrl: string
  userAgent?: string
  message: string
  stack: string
  componentStack?: string | undefined
  name: string
}
