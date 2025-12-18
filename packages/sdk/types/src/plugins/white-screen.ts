export interface WhiteScreenInfo {
  timestamp: number
  url: string
  viewport: string
  containerSelectors: string[]
  isSkeletonApp: boolean
  whiteScreenLoopNum: number
  emptyPoints: number
  userAgent: string
  readyState: DocumentReadyState
}

export interface configInfo {
  containerDOM: string[]
  pollInterval: number
  maxPollTimes: number
  whiteScreenThreshold: number
  idleTimeout: number
  isSkeletonApp: boolean
}

export interface blankStateInfo {
  emptyPoints: number
  whiteScreenLoopNum: number
  skeletonInitList: string[]
  skeletonNowList: string[]
  loopTimer: number | null
  isLoaded: boolean
}
