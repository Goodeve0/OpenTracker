import { XoErrorInfo, XoErrorOptions } from '../../../../types/src/plugins/xo-error'
import { XoErrorReporter } from './xo-reporter'

/**
 * 跨域错误监控器 - 负责捕获和上报跨域JavaScript脚本错误
 */
export class XoErrorMonitor {
  private options: XoErrorOptions
  private isInitialized = false
  private reporter: XoErrorReporter | null = null

  constructor(options: XoErrorOptions = {}) {
    this.options = {
      enable: true,
      sampling: 1,
      ignoreSources: [],
      ...options,
    }
    if (this.options.serverUrl) {
      this.reporter = new XoErrorReporter(this.options.serverUrl)
    }
  }

  // 初始化监控
  public init(): void {
    if (this.isInitialized) {
      return
    }
    if (!this.options.enable) {
      return
    }
    this.setupErrorListeners()
    this.isInitialized = true
  }

  // 设置错误监听器
  private setupErrorListeners(): void {
    // 保存原始的错误处理器
    const originalOnError = window.onerror

    // 重写全局错误处理器
    window.onerror = (message, source, lineno, colno, error) => {
      // 判断是否为跨域错误
      if (this.isCrossOriginError(message, source, error)) {
        this.handleXoError({
          type: 'cross-origin-error',
          message: typeof message === 'string' ? message : String(message),
          source: source || '',
          lineno: lineno || 0,
          colno: colno || 0,
          stack: error instanceof Error ? error.stack || 'Script error.' : 'Script error.',
        })
      }

      // 调用原始的错误处理器
      if (typeof originalOnError === 'function') {
        return originalOnError(message, source, lineno, colno, error)
      }

      return false
    }
  }

  // 判断是否为跨域错误
  private isCrossOriginError(message: any, source: string | undefined, error: any): boolean {
    // 跨域错误的典型特征：message为"Script error."，且source包含跨域URL
    const isScriptError = typeof message === 'string' && message.includes('Script error.')
    const hasCrossOriginSource = source && this.isCrossOriginUrl(source)
    const hasNoStack = !(error instanceof Error && error.stack)

    return Boolean(isScriptError || (hasCrossOriginSource && hasNoStack))
  }

  // 判断URL是否为跨域
  private isCrossOriginUrl(url: string): boolean {
    try {
      const currentOrigin = window.location.origin
      const targetUrl = new URL(url)
      return targetUrl.origin !== currentOrigin
    } catch {
      return false
    }
  }

  // 处理跨域错误
  private handleXoError(error: {
    type: string
    message: string
    source: string
    lineno: number
    colno: number
    stack: string
  }): void {
    // 检查采样率
    if (!this.shouldSample()) {
      return
    }

    // 检查是否需要忽略该来源
    if (this.shouldIgnoreSource(error.source)) {
      return
    }

    // 构建完整的错误信息
    const xoErrorInfo: XoErrorInfo = {
      type: error.type,
      message: error.message,
      source: error.source,
      lineno: error.lineno,
      colno: error.colno,
      stack: error.stack,
      timestamp: Date.now(),
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
    }

    console.log('捕获到跨域错误:', xoErrorInfo)

    // 调用用户自定义回调
    if (this.options.onXoError) {
      try {
        this.options.onXoError(xoErrorInfo)
      } catch (callbackError) {
        console.warn('onXoError回调执行失败:', callbackError)
      }
    }

    // 上报错误
    if (this.reporter) {
      this.reporter.report(xoErrorInfo).catch((reportError) => {
        console.error('跨域错误上报失败:', reportError)
      })
    }
  }

  // 检查是否需要忽略该来源
  private shouldIgnoreSource(source: string): boolean {
    if (!this.options.ignoreSources || this.options.ignoreSources.length === 0) {
      return false
    }
    return this.options.ignoreSources.some((pattern) => pattern.test(source))
  }

  // 采样率检查
  private shouldSample(): boolean {
    const sampling = this.options.sampling ?? 1
    return Math.random() <= sampling
  }
}
