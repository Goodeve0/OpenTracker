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

export class XoErrorReporter {
  private serverUrl: string

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl
  }

  public async report(data: XoErrorInfo): Promise<void> {
    if (!this.serverUrl) {
      console.warn('跨域错误上报失败：serverUrl未配置')
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
            subType: 'cross-origin', // 添加子类型区分不同错误类型
          },
        }),
        keepalive: true,
      })

      if (!response.ok) {
        console.warn('跨域错误上报失败：', response.statusText)
      }
    } catch (error) {
      console.warn('跨域错误上报失败：', error)
    }
  }
}
