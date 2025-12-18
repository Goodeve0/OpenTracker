export enum EventTypes {
  CLICK = 'click',
  ERROR = 'error',
  CUSTOM = 'custom', // 自定义事件
  BUSINESS = 'business', // 业务事件
  PERFORMANCE = 'performance', // 性能事件
  BEHAVIOR = 'behavior', // 行为事件
  WHITE_SCREEN = 'white_screen', // 白屏事件
}

// 上报策略枚举
export enum ReportStrategy {
  BEACON = 'BEACON',
  XHR = 'XHR',
  IMG = 'IMG',
}
