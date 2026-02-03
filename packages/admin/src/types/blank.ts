export interface BlankListItem {
  key: string
  page: string
  blankCounts: number
  users: number
  time: string
  state: 'NEW' | 'OPEN' | 'FIXED' | 'CLOSE'
  option: string
}

export interface WhiteScreenTrendData {
  date: string
  whiteScreenCount: number
  affectedUserCount: number
  whiteScreenRate: number
  affectedUserRate: number
}
