import { ApiErrorInfo, ApiMonitorOptions } from '../../../../types/src/plugins/api-error'
import ApiReporter from './api-reporter'
/**
 * API错误监控器 - 负责拦截和捕获API请求错误
 */
export class ApiErrorMonitor {
  private options: ApiMonitorOptions
  private originalXHR: typeof XMLHttpRequest
  private originalFetch: typeof fetch
  private isInitialized = false
  private reporter: ApiReporter | null = null
  // 初始化监控器
  constructor(options: ApiMonitorOptions = {}) {
    this.options = {
      enable: true,
      sampling: 1,
      ignoreUrls: [],
      ...options,
    }
    this.originalXHR = window.XMLHttpRequest
    this.originalFetch = window.fetch
    if (this.options.serverUrl) {
      this.reporter = new ApiReporter(this.options.serverUrl)
    }
  }
  // 1.设置拦截器
  private async setupInterceptors(): Promise<void> {
    return new Promise((resolve) => {
      //如果页面还在加载，等待加载完成
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          // 页面完成后开始拦截
          this.interceptXHR()
          this.interceptFetch()
          resolve()
        })
      } else {
        // 页面已经完成加载，直接开始拦截
        this.interceptXHR()
        this.interceptFetch()
        resolve()
      }
    })
  }
  // 2.拦截XHR请求
  private interceptXHR(): void {
    const self = this
    //重写全局的 XMLHttpRequest 对象
    window.XMLHttpRequest = function () {
      //创建原始的 XMLHttpRequest 对象
      const xhr = new self.originalXHR()
      // 包装这个对象，添加监控逻辑
      return self.wrapXHR(xhr)
    } as any

    // 保持原型链一致
    window.XMLHttpRequest.prototype = this.originalXHR.prototype
    // 复制静态属性
    for (const key in this.originalXHR) {
      if (this.originalXHR.hasOwnProperty(key)) {
        ;(window.XMLHttpRequest as any)[key] = (this.originalXHR as any)[key]
      }
    }
  }

  // 3.包装XHR对象，添加监控逻辑
  private wrapXHR(xhr: XMLHttpRequest): XMLHttpRequest {
    const self = this
    const startTime = Date.now()

    //存储请求信息
    const requestInfo = {
      method: '',
      url: '',
      startTime: startTime,
    }
    // 重写open方法，记录请求信息
    const originalOpen = xhr.open
    xhr.open = function (
      method: string,
      url: string,
      async: boolean = true,
      username?: string,
      password?: string
    ) {
      // 保存请求方法和方法
      requestInfo.method = method
      requestInfo.url = url
      // 调用原始的 open 方法
      return originalOpen.call(this, method, url, async, username, password)
    }

    //重写 send 方法，添加事件监听
    const originalSend = xhr.send
    xhr.send = function (body?: Document | XMLHttpRequestBodyInit | null) {
      // 更新请求开始时间
      requestInfo.startTime = Date.now()

      // 检查是否需要忽略这个URL
      if (self.shouldIgnore(requestInfo.url)) {
        return originalSend.call(this, body)
      }
      //监听请求完成事件
      this.addEventListener('loadend', function () {
        const duration = Date.now() - requestInfo.startTime

        //如果是错误状态码（400-500）并且需要采样
        if (this.status >= 400 && self.shouldSample()) {
          self.handleXHRError({
            type: 'xhr_error',
            method: requestInfo.method,
            url: requestInfo.url,
            status: this.status,
            statusText: this.statusText,
            duration: duration,
            response: this.response,
            requestData: body,
            timestamp: Date.now(),
            pageUrl: location.href,
          })
        }
      })

      //监听网络错误事件
      this.addEventListener('error', function () {
        if (self.shouldSample()) {
          const duration = Date.now() - requestInfo.startTime
          self.handleXHRError({
            type: 'xhr_network_error',
            method: requestInfo.method,
            url: requestInfo.url,
            status: 0,
            statusText: 'Network Error',
            duration: duration,
            response: null,
            requestData: body,
            timestamp: Date.now(),
            pageUrl: location.href,
          })
        }
      })
      //监听超时事件
      this.addEventListener('timeout', function () {
        if (self.shouldSample()) {
          const duration = Date.now() - requestInfo.startTime
          self.handleXHRError({
            type: 'xhr_timeout',
            method: requestInfo.method,
            url: requestInfo.url,
            status: 0,
            statusText: 'Timeout',
            duration: duration,
            requestData: body,
            timestamp: Date.now(),
            pageUrl: location.href,
            timeout: this.timeout,
          })
        }
      })
      return originalSend.call(this, body)
    }

    return xhr
  }
  // 4. 检查URL是否需要忽略
  private shouldIgnore(url: string): boolean {
    if (!this.options.ignoreUrls || this.options.ignoreUrls.length === 0) {
      return false
    }
    // 检查URL是否匹配任何忽略规则
    return this.options.ignoreUrls.some((pattern) => pattern.test(url))
  }

  // 5. 采样率检查
  private shouldSample(): boolean {
    const sampling = this.options.sampling ?? 1
    return Math.random() <= sampling
  }

  // 6. 处理XHR错误
  private handleXHRError(errorInfo: Omit<ApiErrorInfo, 'userAgent'>): void {
    const fullErrorInfo: ApiErrorInfo = {
      ...errorInfo,
      userAgent: navigator.userAgent,
    }

    console.log('捕获到XHR错误:', fullErrorInfo)

    // 调用用户自定义回调
    if (this.options.onApiError) {
      try {
        this.options.onApiError(fullErrorInfo)
      } catch (error) {
        console.warn('onApiError回调执行失败:', error)
      }
    }

    if (this.reporter) {
      this.reporter.report(fullErrorInfo).catch((error) => {
        console.error('API 错误上报失败', error)
      })
    }
  }

  // 7. 拦截Fetch请求
  private interceptFetch(): void {
    const self = this
    const originalFetch = window.fetch

    // 重写全局的fetch函数
    window.fetch = async function (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const startTime = Date.now()
      // 提取请求URL
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url

      // 检查是否需要忽略这个URL
      if (self.shouldIgnore(url)) {
        return originalFetch.call(this, input, init)
      }

      try {
        // 调用原始的fetch函数
        const response = await originalFetch.call(this, input, init)
        const duration = Date.now() - startTime

        // 检查是否是错误响应 (4xx, 5xx状态码)
        if (!response.ok && self.shouldSample()) {
          await self.handleFetchError({
            url,
            init,
            response,
            duration,
            startTime,
          })
        }

        return response
      } catch (error) {
        // 处理网络错误或其他异常
        if (self.shouldSample()) {
          const duration = Date.now() - startTime
          self.handleFetchNetworkError({
            url,
            init,
            error: error as Error,
            duration,
            startTime,
          })
        }
        // 重新抛出错误，不影响原有业务逻辑
        throw error
      }
    }
  }

  // 8. 处理Fetch的HTTP错误 (4xx, 5xx)
  private async handleFetchError(params: {
    url: string
    init?: RequestInit | undefined
    response: Response
    duration: number
    startTime: number
  }): Promise<void> {
    const { url, init, response, duration, startTime } = params

    try {
      // 克隆response来读取响应内容（response.body只能读取一次）
      const responseText = await response.clone().text()

      this.handleFetchReport({
        type: 'fetch_error',
        url,
        method: init?.method || 'GET',
        status: response.status,
        statusText: response.statusText,
        duration,
        response: responseText,
        requestData: init?.body,
        timestamp: startTime,
        pageUrl: window.location.href,
      })
    } catch (parseError) {
      // 如果解析响应体失败，仍然上报基础错误信息
      this.handleFetchReport({
        type: 'fetch_error',
        url,
        method: init?.method || 'GET',
        status: response.status,
        statusText: response.statusText,
        duration,
        response: 'Failed to parse response body',
        requestData: init?.body,
        timestamp: startTime,
        pageUrl: window.location.href,
      })
    }
  }

  // 9. 处理Fetch的网络错误
  private handleFetchNetworkError(params: {
    url: string
    init?: RequestInit | undefined
    error: Error
    duration: number
    startTime: number
  }): void {
    const { url, init, error, duration, startTime } = params

    this.handleFetchReport({
      type: 'fetch_network_error',
      url,
      method: init?.method || 'GET',
      status: 0,
      statusText: error.message,
      duration,
      requestData: init?.body,
      timestamp: startTime,
      pageUrl: window.location.href,
      errorName: error.name,
    })
  }

  // 10. 处理Fetch错误上报
  private handleFetchReport(errorInfo: Omit<ApiErrorInfo, 'userAgent'>): void {
    const fullErrorInfo: ApiErrorInfo = {
      ...errorInfo,
      userAgent: navigator.userAgent,
    }

    console.log('捕获到Fetch错误:', fullErrorInfo)

    // 调用用户自定义回调
    if (this.options.onApiError) {
      try {
        this.options.onApiError(fullErrorInfo)
      } catch (error) {
        console.warn('onApiError回调执行失败:', error)
      }
    }

    if (this.reporter) {
      this.reporter.report(fullErrorInfo).catch((error) => {
        console.error('API 错误上报失败', error)
      })
    }
  }
  async init(): Promise<void> {
    //如果已经初始化过了，直接返回
    if (this.isInitialized) {
      return
    }
    //如果配置中禁用了监控，直接返回
    if (!this.options.enable) {
      return
    }
    try {
      await this.setupInterceptors()
      this.isInitialized = true
    } catch (error) {
      throw error
    }
  }
}
