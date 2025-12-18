import { WebErrorReporter, WebErrorInfo } from './web-reporter'

let webErrorReporter: WebErrorReporter | null = null

export const initWebErrorMonitoring = (reporter: WebErrorReporter) => {
  webErrorReporter = reporter

  // 静态资源加载错误监控
  window.addEventListener(
    'error',
    (event) => {
      // 过滤掉 JS 错误，只处理资源加载错误
      if (event.target instanceof HTMLElement) {
        const target = event.target as HTMLElement

        // 检查是否为资源加载错误
        if (
          target.tagName === 'IMG' ||
          target.tagName === 'SCRIPT' ||
          target.tagName === 'LINK' ||
          target.tagName === 'VIDEO' ||
          target.tagName === 'AUDIO' ||
          target.tagName === 'IFRAME'
        ) {
          const resourceError: WebErrorInfo = {
            type: 'resource-error',
            tagName: target.tagName,
            url: target.src || target.href || '',
            timestamp: Date.now(),
            detail: event.message || 'Resource failed to load',
            pageUrl: window.location.href,
            userAgent: navigator.userAgent,
          }

          webErrorReporter?.report(resourceError)
        }
      }
    },
    true
  ) // 使用捕获阶段监听，确保能捕获所有资源错误

  // 页面加载错误监控
  window.addEventListener('load', () => {
    // 检查页面加载状态
    if (document.readyState === 'complete') {
      // 检查是否有失败的资源
      checkFailedResources()
    }
  })
}

// 检查页面中失败的资源
const checkFailedResources = () => {
  // 检查所有图片
  const images = document.querySelectorAll('img')
  images.forEach((img) => {
    if (!img.complete || (typeof img.naturalWidth !== 'undefined' && img.naturalWidth === 0)) {
      const resourceError: WebErrorInfo = {
        type: 'resource-error',
        tagName: 'IMG',
        url: img.src,
        timestamp: Date.now(),
        detail: 'Image failed to load',
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
      }

      webErrorReporter?.report(resourceError)
    }
  })
}
