export interface JsErrorInfo {
  type: string
  message: string
  source: string
  lineno: number
  colno: number
  stack: string
}

//上报器类，负责把错误数据发送到服务器
export class JsErrorReporter {
  private serverUrl: string
  constructor(serverUrl: string) {
    this.serverUrl = serverUrl
  }
  public async report(data: JsErrorInfo): Promise<void> {
    if (!this.serverUrl) {
      console.warn('JS错误上报失败：serverUrl未配置')
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
            subType: data.type, // 使用原 type 作为 subType (js-error 或 unhandled-rejection)
          },
        }),
        keepalive: true,
      })
      if (!response.ok) {
        console.warn('JS错误上报失败：', response.statusText)
      }
    } catch (error) {
      console.warn('JS错误上报失败：', error)
    }
  }
}
