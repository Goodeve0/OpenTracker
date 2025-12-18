import { CrashErrorData } from '../../../../types/src/plugins/crash-error.js'
import { reportCrashError } from './crash-monitoring.js'

type ReportFunction = (data: CrashErrorData) => void

const workerCode = `
  let timer;
  const TIMEOUT = 5000; 
  self.onmessage = (e) => {
    if (e.data === 'heartbeat') {
      clearTimeout(timer);
      timer = setTimeout(() => {
        self.postMessage({ type: 'crash' })
      }, TIMEOUT
    }
  }
`

export class CrashMonitor {
  private worker: Worker | null = null
  private report: ReportFunction // 保存 SDK 传进来的核心上报函数
  private timer: any

  constructor(reportFn: ReportFunction) {
    this.report = reportFn
  }

  init() {
    if (!window.Worker) return

    const blob = new Blob([workerCode], { type: 'application/javascript' })
    this.worker = new Worker(URL.createObjectURL(blob))

    this.worker.onmessage = (e) => {
      if (e.data?.type === 'crash') {
        this.handleCrash()
      }
    }

    this.startHeartbeat()
    window.addEventListener('beforeunload', () => this.destroy())
  }

  private startHeartbeat() {
    this.timer = setInterval(() => {
      this.worker?.postMessage('heartbeat')
    }, 1000)
  }

  private handleCrash() {
    reportCrashError(this.report)

    this.destroy()
  }

  private destroy() {
    clearInterval(this.timer)
    this.worker?.terminate()
  }
}
