import { TrackEventMap, TrackListener } from '../../../types/src/core/event-bus.js'

export class TrackEventBus {
  // 存储埋点事件-监听器映射（按优先级排序）
  private listeners: Map<keyof TrackEventMap, TrackListener[]> = new Map()

  /**
   * 订阅埋点事件
   * @param eventName 埋点事件名（仅支持 TrackEventMap 中定义的类型）
   * @param handler 回调函数（参数类型与事件绑定）
   * @param options 配置（once: 是否只执行一次；priority: 优先级，默认0）
   * @returns 取消订阅的函数
   */
  on<K extends keyof TrackEventMap>(
    eventName: K,
    handler: (data: TrackEventMap[K]) => void | Promise<void>,
    options: { once?: boolean; priority?: number } = {}
  ): () => void {
    // 入参校验（埋点场景必须保证 eventId 相关的事件名合法）
    if (!eventName || typeof handler !== 'function') {
      throw new Error(`埋点事件订阅失败：事件名或回调函数不合法`)
    }

    // 初始化事件监听器数组
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, [])
    }

    const listener: TrackListener<TrackEventMap[K]> = {
      handler,
      once: options.once ?? false,
      priority: options.priority ?? 0,
    }

    // 按优先级排序（高优先级先执行，异常埋点优先处理）
    const listeners = this.listeners.get(eventName)!
    listeners.push(listener)
    listeners.sort((a, b) => b.priority - a.priority) // 降序排序

    // 返回取消订阅函数（埋点场景需支持手动取消）
    return () => this.off(eventName, handler)
  }

  /**
   * 订阅一次性埋点事件（如首次进入页面的埋点）
   */
  once<K extends keyof TrackEventMap>(
    eventName: K,
    handler: (data: TrackEventMap[K]) => void | Promise<void>,
    priority = 0
  ): () => void {
    return this.on(eventName, handler, { once: true, priority })
  }

  /**
   * 发布埋点事件（核心：触发订阅的回调）
   * @param eventName 埋点事件名
   * @param data 埋点数据（TS 强制校验类型）
   */
  async emit<K extends keyof TrackEventMap>(eventName: K, data: TrackEventMap[K]): Promise<void> {
    // 补全埋点公共字段
    const trackData = {
      ...data,
      timestamp: (data as any).timestamp ?? Date.now(), // 自动填充时间戳
      pageId: (data as any).pageId ?? this.getPageId(), // 自动获取当前页面ID
    }

    const listeners = this.listeners.get(eventName)
    if (!listeners || listeners.length === 0) return

    // 复制数组避免遍历中修改（埋点场景可能在回调中取消订阅）
    const listenersCopy = [...listeners]
    const promises: Promise<void>[] = []

    for (const listener of listenersCopy) {
      try {
        // 执行回调（支持异步处理，如埋点数据加密）
        const result = listener.handler(trackData)
        if (result instanceof Promise) {
          promises.push(result)
        }

        // 一次性埋点执行后取消订阅
        if (listener.once) {
          this.off(eventName, listener.handler)
        }
      } catch (error) {
        // 埋点事件执行失败不阻塞其他回调，记录错误日志
        console.error(`[TrackSDK] 埋点事件 ${eventName} 执行失败：`, error)
      }
    }

    // 等待所有异步处理完成（如加密、补充字段）
    await Promise.all(promises)
  }

  /**
   * 取消埋点事件订阅
   * @param eventName 事件名
   * @param handler 要取消的回调（不传则清空该事件所有订阅）
   */
  off<K extends keyof TrackEventMap>(
    eventName: K,
    handler?: (data: TrackEventMap[K]) => void | Promise<void>
  ): void {
    const listeners = this.listeners.get(eventName)
    if (!listeners) return

    if (handler) {
      // 过滤指定回调
      this.listeners.set(
        eventName,
        listeners.filter((item) => item.handler !== handler)
      )
    } else {
      // 清空该事件所有订阅（埋点场景：页面卸载时清理）
      this.listeners.delete(eventName)
    }
  }

  /**
   * 批量清理低优先级埋点事件（埋点场景：页面卸载前优化）
   * @param minPriority 保留的最低优先级
   */
  clearLowPriorityEvents(minPriority: number = 1): void {
    for (const [eventName, listeners] of this.listeners) {
      const highPriorityListeners = listeners.filter((item) => item.priority >= minPriority)
      this.listeners.set(eventName, highPriorityListeners)
    }
  }

  /**
   * 清空所有埋点事件（SDK 销毁时调用）
   */
  clearAll(): void {
    this.listeners.clear()
  }

  // 辅助方法：获取当前页面ID（埋点场景必备）
  private getPageId(): string {
    return window.location.pathname + window.location.search
  }
}

// 导出单例（埋点 SDK 全局唯一总线）
export const trackEventBus = new TrackEventBus()
