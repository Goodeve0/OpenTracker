import { ProxySandbox } from './ProxySandbox.js'
// 全局沙箱单例（避免重复初始化）
let sandboxInstance: ProxySandbox | null = null
// 导出沙箱类
export { ProxySandbox }
