export interface WebErrorInfo {
  type: string
  tagName: string
  url: string
  timestamp: number
  detail: string
  pageUrl: string
  userAgent?: string
}

export class WebErrorReporter {
  private serverUrl: string

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl
  }

  public async report(data: WebErrorInfo): Promise<void> {
    if (!this.serverUrl) {
      console.warn('Web error reporter: serverUrl is not configured')
      return
    }

    try {
      // 使用 SDK 统一上报接口格式
      const response = await fetch(this.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'Error', // 符合统一上报接口的类型要求
          data: {
            ...data,
            subType: 'web', // 添加子类型区分资源错误
          },
        }),
        keepalive: true, // 确保页面卸载时也能上报
      })

      if (!response.ok) {
        console.warn('Web error reporting failed:', response.statusText)
      }
    } catch (error) {
      console.warn('Web error reporting failed:', error)
    }
  }
}
