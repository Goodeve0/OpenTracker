import { Tracker } from '../reporter'
import { SDK_PROTECTED_METHODS } from '../../../protected-list'
import type { TrackerConfig } from '../../../types/src/core/config'

export class ProxySandbox {
  private readonly tracker: Tracker
  private readonly proxy: Tracker

  constructor(config: TrackerConfig) {
    this.tracker = Tracker.getInstance(config)
    this.proxy = this.createProxy()
  }

  // 沙箱核心逻辑
  private createProxy(): Tracker {
    const handler: ProxyHandler<Tracker> = {
      get: (target: Tracker, property: keyof Tracker | symbol, receiver: any): any => {
        if (typeof property === 'symbol') {
          return Reflect.get(target, property, receiver)
        }
        const value = Reflect.get(target, property, receiver)
        if (typeof value === 'function') {
          return this.wrapMethod(target, property as string, value)
        }
        console.log(`[ProxySandbox] 访问属性: ${String(property)}，值:`, value)
        return value
      },
      set: (
        target: Tracker,
        property: keyof Tracker | symbol,
        value: any,
        receiver: any
      ): boolean => {
        try {
          const readonlyProperties: string[] = ['config']
          // 新增：如果是方法（函数），也禁止修改
          if (
            (typeof property === 'string' && readonlyProperties.includes(property)) ||
            (typeof property === 'string' && typeof (target as any)[property] === 'function')
          ) {
            console.warn(`[ProxySandbox] 禁止修改只读属性/方法: ${String(property)}`)
            return false
          }
          console.log(`[ProxySandbox] 设置属性: ${String(property)} =`, value)
          Reflect.set(target, property, value, receiver)
          return true
        } catch (error) {
          console.error(`[ProxySandbox] 属性设置错误: ${String(property)}`, error)
          return false
        }
      },
      has: (target: Tracker, property: keyof Tracker | symbol): boolean => {
        const hasProperty = Reflect.has(target, property)
        console.log(`[ProxySandbox] 检查属性存在性: ${String(property)}，结果: ${hasProperty}`)
        return hasProperty
      },
      deleteProperty: (target: Tracker, property: keyof Tracker | symbol): boolean => {
        try {
          const protectedProperties: string[] = SDK_PROTECTED_METHODS
          if (typeof property === 'string' && protectedProperties.includes(property)) {
            console.warn(`[ProxySandbox] 禁止删除核心属性: ${String(property)}`)
            return false
          }
          console.log(`[ProxySandbox] 删除属性: ${String(property)}`)
          Reflect.deleteProperty(target, property)
          return true
        } catch (error) {
          console.error(`[ProxySandbox] 属性删除错误: ${String(property)}`, error)
          return false
        }
      },
    }
    return new Proxy(this.tracker, handler)
  }

  private wrapMethod(target: Tracker, methodName: string, method: Function): Function {
    return (...args: any[]) => {
      try {
        console.log(`[ProxySandbox] 执行方法: ${methodName}，参数:`, args)
        const result = method.apply(target, args)
        if (result instanceof Promise) {
          return result.catch((error: Error) => {
            console.error(`[ProxySandbox] 异步方法执行错误: ${methodName}`, error)
            throw error
          })
        }
        return result
      } catch (error) {
        console.error(`[ProxySandbox] 方法执行错误: ${methodName}`, error)
        return null
      }
    }
  }

  public getProxy(): Tracker {
    return this.proxy
  }

  public getRealInstance(): Tracker {
    console.warn('[ProxySandbox] 警告：直接访问原始实例会绕过沙箱！')
    return this.tracker
  }

  public destroy(): void {
    ;(this as any).proxy = null
    ;(this as any).tracker = null // 释放内存
    console.log('[ProxySandbox] 沙箱已销毁')
  }
}
