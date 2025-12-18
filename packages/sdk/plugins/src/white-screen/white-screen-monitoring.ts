import { reportWhiteScreen } from '../../../core/src/reporter'
import {
  WhiteScreenInfo,
  configInfo,
  blankStateInfo,
} from '../../../types/src/plugins/white-screen'

//配置项（避免全局变量污染）
const CONFIG: configInfo = {
  containerDOM: ['#root', '#app', 'main', '.app', '[data-app]'],
  // skeletonDOM: [
  //     '.skeleton',
  //     '[data-skeleton]',
  //     '.skeleton-loader',
  //     '.loading-skeleton',
  //     '.ant-skeleton',
  //   ],
  pollInterval: 5000, //轮询间隔
  maxPollTimes: 10, //最大轮询次数，避免无限轮询
  whiteScreenThreshold: 28, //白屏判定阙值
  idleTimeout: 3000, //requestIdleCallback超过时间
  isSkeletonApp: false, //是否为骨架屏应用（待优化）
}

let blankState: blankStateInfo = {
  emptyPoints: 0, //空白点数
  whiteScreenLoopNum: 0, //轮询次数
  skeletonInitList: [], //有骨架屏的初始取点数组
  skeletonNowList: [], //有骨架屏的当前取点数组
  loopTimer: null, //轮询定时器
  isLoaded: false, //标记页面是否已加载
}

//采样对比
export function sampling(deadline: IdleDeadline): void {
  //重置空白点数，避免累加
  blankState.emptyPoints = 0

  //边界保护：窗口未初始化/无空闲时间时直接退出
  if (window.innerWidth === 0 || window.innerHeight === 0 || deadline.timeRemaining() <= 0) return

  //确保有空闲时间再采样
  if (deadline.timeRemaining() > 0) {
    for (let i: number = 1; i <= 9; i++) {
      //x轴采样点
      const xElements: Element[] | null =
        document?.elementsFromPoint((window.innerWidth * i) / 10, (window.innerHeight * i) / 2) ||
        []
      //y轴采样点
      const yElements: Element[] | null =
        document?.elementsFromPoint((window.innerWidth * i) / 2, (window.innerHeight * i) / 10) ||
        []
      //上升对角线采样点
      const upDiagonalElements: Element[] | null =
        document?.elementsFromPoint((window.innerWidth * i) / 10, (window.innerHeight * i) / 10) ||
        []
      //下降对角线采样点
      const downDiagonalElements: Element[] | null =
        document?.elementsFromPoint(
          (window.innerWidth * i) / 10,
          window.innerHeight - (window.innerHeight * i) / 10
        ) || []

      //统计空白点（判断元素存在性）
      if (xElements.length > 0 && isContainer(xElements[0] as HTMLElement)) blankState.emptyPoints++

      //中心点只计算一次
      if (i !== 5) {
        if (yElements.length > 0 && isContainer(yElements[0] as HTMLElement))
          blankState.emptyPoints++
        if (upDiagonalElements.length > 0 && isContainer(upDiagonalElements[0] as HTMLElement))
          blankState.emptyPoints++
        if (downDiagonalElements.length > 0 && isContainer(downDiagonalElements[0] as HTMLElement))
          blankState.emptyPoints++
      }
    }
  }

  //组装上报白屏错误数据
  const blankReportData: WhiteScreenInfo = {
    timestamp: Date.now(),
    url: window.location.href,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    containerSelectors: CONFIG.containerDOM,
    isSkeletonApp: CONFIG.isSkeletonApp,
    whiteScreenLoopNum: blankState.whiteScreenLoopNum,
    emptyPoints: blankState.emptyPoints,
    userAgent: navigator.userAgent,
    readyState: document.readyState,
  }

  //白屏判定核心逻辑
  if (blankState.emptyPoints >= CONFIG.whiteScreenThreshold) {
    //判定白屏：上报+启动轮询
    reportWhiteScreen(blankReportData)
    if (!blankState.loopTimer) {
      openWhiteLoop()
    }
  } else {
    //页面正常：停止轮询
    if (blankState.loopTimer) {
      clearInterval(blankState.loopTimer)
      blankState.loopTimer = null
    }
    //骨架屏：第一次采样记录初始值，启动轮询对比
    if (CONFIG.isSkeletonApp && blankState.whiteScreenLoopNum === 0) {
      openWhiteLoop()
    }
  }

  //骨架屏：对比初始 && 当前节点，判断是否一直是骨架屏（白屏）
  if (CONFIG.isSkeletonApp && blankState.whiteScreenLoopNum > 0) {
    if (blankState.skeletonNowList?.join() == blankState.skeletonInitList?.join()) {
      reportWhiteScreen(blankReportData)
    }
  }
}

//白屏轮询检测
export function openWhiteLoop(): void {
  if (blankState.loopTimer) return
  blankState.loopTimer = setInterval(() => {
    if (CONFIG.isSkeletonApp) {
      blankState.skeletonNowList = []
    }
    blankState.whiteScreenLoopNum++
    isIdleCallback()

    //轮询上限：避免无限轮询
    if (blankState.whiteScreenLoopNum >= CONFIG.maxPollTimes) {
      clearInterval(blankState.loopTimer!)
      blankState.loopTimer = null
    }
  }, CONFIG.pollInterval) as unknown as number
}

//判断采样点是否为容器节点
export function isContainer(element: HTMLElement): boolean {
  let selector: string = getSelector(element)
  if (CONFIG.isSkeletonApp) {
    blankState.whiteScreenLoopNum
      ? blankState.skeletonNowList?.push(selector)
      : blankState.skeletonInitList?.push(selector)
  }
  return CONFIG.containerDOM.indexOf(selector) !== -1
}

//选中dom点的名称
export function getSelector(element: HTMLElement): string {
  if (element.id) {
    return '#' + element.id
  } else if (element.className) {
    return (
      '.' +
      element.className
        .split(' ')
        .filter((item) => !!item)
        .join('.')
    )
  } else {
    return element.nodeName.toLowerCase()
  }
}

//浏览器空闲时，计算对比
export function isIdleCallback(): void {
  //设置timeout，避免采样永远不执行
  requestIdleCallback(sampling, { timeout: CONFIG.idleTimeout })
}

//启动白屏监控入口函数
export default function openBlankMonitoring() {
  //避免重复初始化
  if (blankState.isLoaded) return
  blankState.isLoaded = true
  //如果是骨架屏
  if (CONFIG.isSkeletonApp) {
    //在页面没有完全加载时
    if (document.readyState !== 'complete') {
      //浏览器空闲时采样
      isIdleCallback()
    }
  } else {
    //无骨架屏
    //页面加载完毕
    if (document.readyState === 'complete') {
      isIdleCallback()
    } else {
      //绑定事件时确保只执行一次
      const loadHandler = () => {
        isIdleCallback()
        window.removeEventListener('load', loadHandler)
      }
      //页面没有完全加载时
      window.addEventListener('load', loadHandler)
    }
  }
}
