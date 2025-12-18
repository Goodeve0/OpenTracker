import { ApiMonitorOptions } from '../plugins/api-error'
import { JsErrorOptions } from '../plugins/js-error'
import { XoErrorOptions } from '../plugins/xo-error'

export interface MonitoringOptions {
  api?: ApiMonitorOptions
  jsError?: JsErrorOptions
  xoError?: XoErrorOptions
}
