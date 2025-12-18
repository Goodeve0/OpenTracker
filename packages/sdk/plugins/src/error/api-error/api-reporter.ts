import { ApiErrorInfo } from '../../../../types/src/plugins/api-error'
export default class ApiReporter {
  private serverUrl: string
  constructor(serverUrl: string) {
    this.serverUrl = serverUrl
  }
  public async report(errorinfo: ApiErrorInfo): Promise<void> {
    if (!this.serverUrl) {
      console.error('serverUrl is not set')
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
            ...errorinfo,
            subType: errorinfo.type, // 使用原 type 作为 subType (xhr_error, fetch_error 等)
          },
        }),
        keepalive: true,
      })
      if (!response.ok) {
        console.error('report failed', response.statusText)
      }
    } catch (error) {
      console.error('API 错误上报失败', error)
    }
  }
}
