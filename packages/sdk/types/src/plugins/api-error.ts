export interface ApiErrorInfo {
   type: 'xhr_error' | 'fetch_error' | 'xhr_network_error' | 'fetch_network_error' | 'xhr_timeout' | 'manual_api_error'
   method?: string
   url: string
   status: number
   statusText: string
   duration?: number
   response?: any
   requestData?: any
   timestamp: number
   pageUrl: string
   userAgent?: string
   errorName?: string
   timeout?: number
}
export interface ApiMonitorOptions {
  enable?: boolean
  serverUrl?: string
  onApiError?: (error: ApiErrorInfo) => void
  ignoreUrls?: RegExp[]
  sampling?: number
}