// 插件管理器，负责插件的注册、加载和初始化流程
import { Plugin, PluginContext } from './types.js'

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map()
  private pluginContext: PluginContext | null = null
  private loadedPlugins: Map<string, Plugin> = new Map()

  /**
   * 注册插件
   * @param plugin 插件对象
   */
  register(plugin: Plugin): void {
    if (!plugin.name || !plugin.version || !plugin.init) {
      throw new Error('插件必须包含name、version和init方法')
    }

    // 检查插件是否已存在
    if (this.plugins.has(plugin.name)) {
      console.warn(`插件 ${plugin.name} 已存在，将被覆盖`)
    }

    this.plugins.set(plugin.name, plugin)
    console.log(`✅ 插件 ${plugin.name} 已注册`)
  }

  /**
   * 批量注册插件
   * @param plugins 插件数组
   */
  registerPlugins(plugins: Plugin[]): void {
    plugins.forEach((plugin) => this.register(plugin))
  }

  /**
   * 卸载插件
   * @param pluginName 插件名称
   */
  unregister(pluginName: string): void {
    if (this.plugins.has(pluginName)) {
      // 如果插件已加载，先停止它
      if (this.loadedPlugins.has(pluginName)) {
        const plugin = this.loadedPlugins.get(pluginName)!
        if (plugin.stop) {
          plugin.stop()
        }
        this.loadedPlugins.delete(pluginName)
      }
      this.plugins.delete(pluginName)
      console.log(`✅ 插件 ${pluginName} 已卸载`)
    }
  }

  /**
   * 设置插件上下文
   * @param context 插件上下文
   */
  setContext(context: PluginContext): void {
    this.pluginContext = context
  }

  /**
   * 加载插件
   * @param pluginName 插件名称
   */
  load(pluginName: string): boolean {
    if (!this.pluginContext) {
      throw new Error('插件上下文未初始化')
    }

    // 检查插件是否已注册
    if (!this.plugins.has(pluginName)) {
      console.error(`❌ 插件 ${pluginName} 未注册`)
      return false
    }

    // 检查插件是否已加载
    if (this.loadedPlugins.has(pluginName)) {
      console.warn(`⚠️  插件 ${pluginName} 已加载`)
      return false
    }

    const plugin = this.plugins.get(pluginName)!

    // 检查依赖
    if (plugin.dependencies && plugin.dependencies.length > 0) {
      for (const dependency of plugin.dependencies) {
        if (!this.loadedPlugins.has(dependency)) {
          // 尝试加载依赖
          if (!this.load(dependency)) {
            console.error(`❌ 插件 ${pluginName} 的依赖 ${dependency} 加载失败`)
            return false
          }
        }
      }
    }

    try {
      // 初始化插件
      plugin.init(this.pluginContext)
      this.loadedPlugins.set(pluginName, plugin)
      console.log(`✅ 插件 ${pluginName} 已加载`)

      // 如果插件有start方法，调用它
      if (plugin.start) {
        plugin.start()
        console.log(`🚀 插件 ${pluginName} 已启动`)
      }

      return true
    } catch (error) {
      console.error(`❌ 加载插件 ${pluginName} 失败:`, error)
      return false
    }
  }

  /**
   * 加载所有已注册的插件
   */
  loadAll(): void {
    if (!this.pluginContext) {
      throw new Error('插件上下文未初始化')
    }

    this.plugins.forEach((plugin, pluginName) => {
      if (!this.loadedPlugins.has(pluginName)) {
        this.load(pluginName)
      }
    })
  }

  /**
   * 停止插件
   * @param pluginName 插件名称
   */
  stop(pluginName: string): boolean {
    if (!this.loadedPlugins.has(pluginName)) {
      console.error(`❌ 插件 ${pluginName} 未加载`)
      return false
    }

    const plugin = this.loadedPlugins.get(pluginName)!
    try {
      if (plugin.stop) {
        plugin.stop()
        console.log(`🛑 插件 ${pluginName} 已停止`)
      }
      return true
    } catch (error) {
      console.error(`❌ 停止插件 ${pluginName} 失败:`, error)
      return false
    }
  }

  /**
   * 停止所有已加载的插件
   */
  stopAll(): void {
    this.loadedPlugins.forEach((plugin, pluginName) => {
      this.stop(pluginName)
    })
  }

  /**
   * 获取已注册的插件列表
   */
  getRegisteredPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 获取已加载的插件列表
   */
  getLoadedPlugins(): Plugin[] {
    return Array.from(this.loadedPlugins.values())
  }

  /**
   * 获取插件信息
   * @param pluginName 插件名称
   */
  getPluginInfo(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName)
  }

  /**
   * 检查插件是否已注册
   * @param pluginName 插件名称
   */
  isRegistered(pluginName: string): boolean {
    return this.plugins.has(pluginName)
  }

  /**
   * 检查插件是否已加载
   * @param pluginName 插件名称
   */
  isLoaded(pluginName: string): boolean {
    return this.loadedPlugins.has(pluginName)
  }
}
