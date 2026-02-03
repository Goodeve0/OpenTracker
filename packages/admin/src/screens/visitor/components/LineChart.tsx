import React from 'react'
import { Tooltip } from 'antd'
import { GrowthRates, Tick, YTick, LineChartProps, StatCardProps } from '../../../types/visitor'
import dayjs from 'dayjs'

// 自定义线图组件（使用SVG实现）
const LineChart: React.FC<LineChartProps> = ({
  data,
  width = 800,
  height = 200,
  viewType = 'visitors',
}) => {
  const padding = { top: 20, right: 30, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // 根据viewType选择要显示的数据字段
  const dataField = viewType === 'visitors' ? 'visitors' : 'pageViews'
  const dataLabel = viewType === 'visitors' ? '访客' : '浏览量'

  // 处理空数据情况
  if (!data || data.length === 0) {
    return (
      <svg width={width} height={height} className="line-chart">
        <text x={padding.left} y={padding.top + chartHeight / 2} fill="#8c8c8c" fontSize="14">
          暂无数据
        </text>
      </svg>
    )
  }

  // 找到数据的最大值和最小值
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d[dataField])) : 0
  const minValue = data.length > 0 ? Math.min(...data.map((d) => d[dataField])) : 0
  const valueRange = maxValue - minValue || 1 // 避免除以零

  // 计算数据点的坐标
  const dataPoints = data.map((item, index) => {
    const x = padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth
    const y = padding.top + chartHeight - ((item[dataField] - minValue) / valueRange) * chartHeight
    return { x, y, value: item[dataField], date: item.date }
  })

  // 生成路径字符串
  const pathData = dataPoints.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }
    return `${path} L ${point.x} ${point.y}`
  }, '')

  // 生成X轴刻度
  const xTicks: Tick[] = []
  const tickCount = Math.min(5, data.length) // 确保不超过数据点数量
  for (let i = 0; i < tickCount; i++) {
    const index =
      data.length > 1 ? Math.round((i / Math.max(tickCount - 1, 1)) * (data.length - 1)) : 0
    const point = dataPoints[index]
    xTicks.push({
      x: point.x,
      date: dayjs(point.date).format('MM/DD'),
    })
  }

  // 生成Y轴刻度
  const yTicks: YTick[] = []
  const yTickCount = 4
  for (let i = 0; i <= yTickCount; i++) {
    const value = minValue + (valueRange / yTickCount) * i
    const y = padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight
    yTicks.push({
      y,
      value: Math.round(value).toLocaleString(),
    })
  }

  return (
    <svg width={width} height={height} className="line-chart">
      {/* Y轴 */}
      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + chartHeight}
        stroke="#e8e8e8"
        strokeWidth="1"
      />

      {/* X轴 */}
      <line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={padding.left + chartWidth}
        y2={padding.top + chartHeight}
        stroke="#e8e8e8"
        strokeWidth="1"
      />

      {/* Y轴刻度 */}
      {yTicks.map((tick, index) => (
        <g key={`y-tick-${index}`}>
          <line
            x1={padding.left - 5}
            y1={tick.y}
            x2={padding.left}
            y2={tick.y}
            stroke="#e8e8e8"
            strokeWidth="1"
          />
          <text x={padding.left - 10} y={tick.y + 5} textAnchor="end" fill="#8c8c8c" fontSize="12">
            {tick.value}
          </text>
        </g>
      ))}

      {/* X轴刻度 */}
      {xTicks.map((tick, index) => (
        <g key={`x-tick-${index}`}>
          <line
            x1={tick.x}
            y1={padding.top + chartHeight}
            x2={tick.x}
            y2={padding.top + chartHeight + 5}
            stroke="#e8e8e8"
            strokeWidth="1"
          />
          <text
            x={tick.x}
            y={padding.top + chartHeight + 20}
            textAnchor="middle"
            fill="#8c8c8c"
            fontSize="12"
          >
            {tick.date}
          </text>
        </g>
      ))}

      {/* 网格线 */}
      {yTicks.map((tick, index) => (
        <line
          key={`grid-${index}`}
          x1={padding.left}
          y1={tick.y}
          x2={padding.left + chartWidth}
          y2={tick.y}
          stroke="#f0f0f0"
          strokeWidth="1"
          strokeDasharray="3,3"
        />
      ))}

      {/* 数据线 */}
      <path d={pathData} fill="none" stroke="#1890ff" strokeWidth="2" />

      {/* 数据点 */}
      {dataPoints.map((point, index) => (
        <Tooltip
          key={`point-${index}`}
          title={`${dayjs(point.date).format('MM月DD日')}: ${point.value.toLocaleString()} ${dataLabel}`}
        >
          <circle
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#1890ff"
            stroke="#fff"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
          />
        </Tooltip>
      ))}
    </svg>
  )
}

export default LineChart
