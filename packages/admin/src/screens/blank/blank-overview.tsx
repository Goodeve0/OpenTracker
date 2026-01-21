import React from 'react'
import BlankTrendChart from './components/blank-trendchart'
import ChartWithAdd from '../../components/chart-with-add'
import { ChartType } from '../../types'

const BlankOverview: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <ChartWithAdd
        chartType={ChartType.WHITE_SCREEN_TRENDS}
        title="白屏趋势分析"
        description="展示白屏问题发生次数、影响用户数及相应比率的变化趋势"
        category="白屏监控"
        defaultSize="large"
      >
        <BlankTrendChart />
      </ChartWithAdd>
    </div>
  )
}

export default BlankOverview
