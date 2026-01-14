// SDK内核配置管理器
import { ApiMonitorOptions } from '../../../types/src/plugins/api-error.js'

// 插件配置基础接口
export interface BasePluginConfig {
  enable?: boolean // 是否启用插件
  debug?: boolean // 是否启用调试模式
}

// 所有插件配置的集合
export interface AllPluginsConfig {
  apiError?: ApiMonitorOptions // API错误监控配置
  jsError?: BasePluginConfig & {
    // JS错误监控特有配置
    sampling?: number
  }
  webError?: BasePluginConfig
  performance?: BasePluginConfig & {
    // 性能监控特有配置
    timeout?: number
    sampling?: number
  }
  behavior?: BasePluginConfig
  [key: string]: any // 支持扩展自定义插件配置
}

// 统一配置接口
export interface UnifiedConfig {
  // 核心配置
  core: {
    apiKey: string
    serverUrl: string
    batchLimit?: number
    immediateMaxSize?: number
    batchMaxSize?: number
    debug?: boolean
    userId?: string
  }
  // 插件配置
  plugins: AllPluginsConfig
  // 全局配置
  global: {
    reportStrategy?: string
    retryConfig?: {
      maxTimes: number
      baseDelay: number
    }
    storageConfig?: {
      enabled?: boolean
      maxSize?: number
      maxAge?: number
    }
  }
}

// 配置验证结果
export interface ConfigValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class ConfigManager {
  private config: UnifiedConfig
  private defaultConfig: UnifiedConfig

  constructor(defaultConfig: UnifiedConfig) {
    this.defaultConfig = defaultConfig
    this.config = { ...defaultConfig }
    console.log('SDK内核配置管理器已初始化')
  }

  /**
   * 设置配置
   * @param config 要设置的配置
   */
  setConfig(config: Partial<UnifiedConfig>): void {
    // 深度合并配置
    this.config = this.deepMerge(this.config, config)
    console.log('配置已更新')
  }

  /**
   * 获取完整配置
   * @returns 完整配置对象
   */
  getConfig(): UnifiedConfig {
    return { ...this.config }
  }

  /**
   * 获取核心配置
   * @returns 核心配置
   */
  getCoreConfig(): UnifiedConfig['core'] {
    return { ...this.config.core }
  }

  /**
   * 获取特定插件的配置
   * @param pluginName 插件名称
   * @returns 插件配置
   */
  getPluginConfig<T extends BasePluginConfig>(pluginName: string): T | undefined {
    return this.config.plugins[pluginName] as T
  }

  /**
   * 获取全局配置
   * @returns 全局配置
   */
  getGlobalConfig(): UnifiedConfig['global'] {
    return { ...this.config.global }
  }

  /**
   * 更新插件配置
   * @param pluginName 插件名称
   * @param config 插件配置
   */
  updatePluginConfig(pluginName: string, config: Record<string, any>): void {
    if (!this.config.plugins[pluginName]) {
      this.config.plugins[pluginName] = {}
    }
    this.config.plugins[pluginName] = this.deepMerge(this.config.plugins[pluginName], config)
    console.log(`插件 ${pluginName} 配置已更新`)
  }

  /**
   * 重置配置到默认值
   */
  resetConfig(): void {
    this.config = { ...this.defaultConfig }
    console.log('配置已重置为默认值')
  }

  /**
   * 验证配置的有效性
   * @returns 验证结果
   */
  validateConfig(): ConfigValidationResult {
    const result: ConfigValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    }

    // 验证核心配置
    if (!this.config.core.apiKey) {
      result.isValid = false
      result.errors.push('核心配置缺少apiKey')
    }

    if (!this.config.core.serverUrl) {
      result.isValid = false
      result.errors.push('核心配置缺少serverUrl')
    }

    // 验证插件配置
    Object.keys(this.config.plugins).forEach((pluginName) => {
      const pluginConfig = this.config.plugins[pluginName]
      if (pluginConfig && typeof pluginConfig !== 'object') {
        result.isValid = false
        result.errors.push(`插件 ${pluginName} 的配置必须是对象类型`)
      }
    })

    return result
  }

  /**
   * 深度合并两个对象
   * @param target 目标对象
   * @param source 源对象
   * @returns 合并后的对象
   */
  private deepMerge(target: any, source: any): any {
    if (source === undefined || source === null) {
      return target
    }

    let output = { ...target }

    Object.keys(source).forEach((key) => {
      if (source[key] instanceof Object && key in output) {
        output[key] = this.deepMerge(output[key], source[key])
      } else {
        output[key] = source[key]
      }
    })

    return output
  }
}

// 默认配置
export const defaultUnifiedConfig: UnifiedConfig = {
  core: {
    apiKey: '',
    serverUrl: '',
    batchLimit: 20,
    immediateMaxSize: 50,
    batchMaxSize: 100,
    debug: false,
  },
  plugins: {
    apiError: {
      enable: true,
      sampling: 1,
      ignoreUrls: [],
    },
    jsError: {
      enable: true,
      sampling: 1,
    },
    webError: {
      enable: true,
    },
    performance: {
      enable: true,
      timeout: 3000,
      sampling: 1,
    },
    behavior: {
      enable: true,
    },
  },
  global: {
    reportStrategy: 'XHR',
    retryConfig: {
      maxTimes: 3,
      baseDelay: 1000,
    },
    storageConfig: {
      enabled: true,
      maxSize: 1000,
      maxAge: 86400000,
    },
  },
}
