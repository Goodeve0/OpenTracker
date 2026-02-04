export type CoreVitals = { lcp?: number | null; inp?: number | null; cls?: number | null }

export type LoadingPerf = {
  ttfb?: number | null
  fp?: number | null
  fcp?: number | null
  dcl?: number | null
  load?: number | null
}

export type NetworkPerf = { dns?: number | null; tcp?: number | null }

export type RuntimePerf = {
  longTask?: number | null
  fps?: number | null
  resourceLoad?: number | null
}
