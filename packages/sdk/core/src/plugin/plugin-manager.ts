// SDK内核插件管理器
import { Plugin, PluginContext } from './types.js'

export class PluginManager {
  loadAll() {
    throw new Error('Method not implemented.')
  }
  private plugins: Map<string, Plugin> = new Map() // 已注册的插件
  private loadedPlugins: Map<string, Plugin> = new Map() // 已加载的插件
  private pluginContext: PluginContext | null = null // 插件上下文

  /**
   * 初始化插件管理器
   * @param context 插件上下文
   */
  constructor(context?: PluginContext) {
    if (context) {
      this.setContext(context)
    }
    console.log('🔌 SDK内核插件管理器已初始化')
  }

  /**
   * 设置插件上下文
   * @param context 插件上下文
   */
  setContext(context: PluginContext): void {
    this.pluginContext = context
    console.log('📋 插件上下文已设置')
  }

  /**
   * 注册单个插件
   * @param plugin 插件对象
   */
  registerPlugin(plugin: Plugin): void {
    if (!plugin.name || !plugin.version || !plugin.init) {
      throw new Error('插件必须包含name、version和init方法')
    }

    if (this.plugins.has(plugin.name)) {
      console.warn(`⚠️  插件 ${plugin.name} 已存在，将被覆盖`)
    }

    this.plugins.set(plugin.name, plugin)
    console.log(`✅ 插件 ${plugin.name}@${plugin.version} 已注册`)
  }

  /**
   * 批量注册插件
   * @param plugins 插件数组
   */
  registerPlugins(plugins: Plugin[]): void {
    console.log(`📦 开始批量注册 ${plugins.length} 个插件`)
    plugins.forEach((plugin) => this.registerPlugin(plugin))
    console.log(`✅ 批量注册完成`)
  }

  /**
   * 加载单个插件
   * @param pluginName 插件名称
   * @returns 是否加载成功
   */
  loadPlugin(pluginName: string): boolean {
    if (!this.pluginContext) {
      throw new Error('插件上下文未初始化')
    }

    if (!this.plugins.has(pluginName)) {
      console.error(`❌ 插件 ${pluginName} 未注册`)
      return false
    }

    if (this.loadedPlugins.has(pluginName)) {
      console.warn(`⚠️  插件 ${pluginName} 已加载`)
      return false
    }

    const plugin = this.plugins.get(pluginName)!

    // 处理插件依赖
    if (plugin.dependencies && plugin.dependencies.length > 0) {
      console.log(`🔗 正在加载插件 ${pluginName} 的依赖: ${plugin.dependencies.join(', ')}`)
      for (const depName of plugin.dependencies) {
        if (!this.loadedPlugins.has(depName)) {
          if (!this.loadPlugin(depName)) {
            console.error(`❌ 依赖插件 ${depName} 加载失败，无法加载插件 ${pluginName}`)
            return false
          }
        }
      }
    }

    try {
      console.log(`🚀 正在初始化插件 ${pluginName}...`)
      plugin.init(this.pluginContext)
      this.loadedPlugins.set(pluginName, plugin)
      console.log(`✅ 插件 ${pluginName} 加载成功`)

      // 调用插件的start方法（如果有）
      if (plugin.start) {
        plugin.start()
        console.log(`📈 插件 ${pluginName} 已启动`)
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
  loadAllPlugins(): void {
    console.log('📦 开始加载所有已注册的插件')
    this.plugins.forEach((plugin, pluginName) => {
      if (!this.loadedPlugins.has(pluginName)) {
        this.loadPlugin(pluginName)
      }
    })
    console.log(`✅ 所有插件加载完成，已加载 ${this.loadedPlugins.size} 个插件`)
  }

  /**
   * 停止单个插件
   * @param pluginName 插件名称
   * @returns 是否停止成功
   */
  stopPlugin(pluginName: string): boolean {
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
  stopAllPlugins(): void {
    console.log('🛑 开始停止所有已加载的插件')
    this.loadedPlugins.forEach((plugin, pluginName) => {
      this.stopPlugin(pluginName)
    })
    console.log('✅ 所有插件已停止')
  }

  /**
   * 获取已注册的插件列表
   * @returns 插件数组
   */
  getRegisteredPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 获取已加载的插件列表
   * @returns 插件数组
   */
  getLoadedPlugins(): Plugin[] {
    return Array.from(this.loadedPlugins.values())
  }

  /**
   * 获取插件信息
   * @param pluginName 插件名称
   * @returns 插件对象或undefined
   */
  getPluginInfo(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName)
  }

  /**
   * 检查插件是否已注册
   * @param pluginName 插件名称
   * @returns 是否已注册
   */
  isPluginRegistered(pluginName: string): boolean {
    return this.plugins.has(pluginName)
  }

  /**
   * 检查插件是否已加载
   * @param pluginName 插件名称
   * @returns 是否已加载
   */
  isPluginLoaded(pluginName: string): boolean {
    return this.loadedPlugins.has(pluginName)
  }
}
