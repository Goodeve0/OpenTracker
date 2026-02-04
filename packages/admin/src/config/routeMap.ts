// 路由到菜单key的映射
export const routeToKeyMap: Record<string, string> = {
  '/home/dashboard': 'sub11',
  '/home/visitor/trends': 'sub21',
  '/home/visitor/device': 'sub22',
  '/home/behavior/event': 'sub31',
  '/home/behavior/page': 'sub32',
  '/home/customer/growth': 'sub41',
  '/home/customer/source': 'sub42',
  '/home/error/overview': 'sub51',
  '/home/error/logs': 'sub52',
  '/home/performance/overview': 'sub61',
  '/home/blank/analysis': 'sub71',
}

// 路由名称映射，用于生成面包屑
export const routeNameMap: Record<string, string> = {
  '/home': '首页',
  '/home/dashboard': '数据概览',
  '/home/visitor': '访客分析',
  '/home/visitor/trends': '访客趋势',
  '/home/visitor/device': '设备分析',
  '/home/behavior': '行为分析',
  '/home/behavior/event': '事件分析',
  '/home/behavior/page': '页面访问',
  '/home/customer': '获客分析',
  '/home/customer/growth': '用户增长',
  '/home/customer/source': '来源分析',
  '/home/error': '错误分析',
  '/home/error/logs': '错误日志',
  '/home/error/overview': '错误概览',
  '/home/performance': '性能分析',
  '/home/performance/overview': '性能概览',
  '/home/blank': '白屏监控',
  '/home/blank/analysis': '白屏分析',
}

export const routeMap: Record<string, string> = {
  sub11: '/home/dashboard',
  sub21: '/home/visitor/trends',
  sub22: '/home/visitor/device',
  sub31: '/home/behavior/event',
  sub32: '/home/behavior/page',
  sub41: '/home/customer/growth',
  sub42: '/home/customer/source',
  sub51: '/home/error/overview',
  sub52: '/home/error/logs',
  sub61: '/home/performance/overview',
  sub71: '/home/blank/analysis',
}
