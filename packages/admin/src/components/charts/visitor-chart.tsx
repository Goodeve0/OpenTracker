import React, { useRef, useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Spin } from 'antd'
import { visitorAPI, VisitorDataPoint } from '../../api/visitor'

interface VisitorChartDataPoint {
  date: string
  visitors: number
  pageViews: number
}

interface VisitorChartProps {
  data?: VisitorChartDataPoint[]
  width?: number
  height?: number
  viewType?: 'visitors' | 'pageViews'
  loading?: boolean
}

interface Tick {
  x: number
  date: string
}

interface YTick {
  y: number
  value: string
}

const VisitorChart: React.FC<VisitorChartProps> = ({
  data: propData,
  width: propWidth,
  height = 300,
  viewType = 'visitors',
  loading: propLoading,
}) => {
  const [data, setData] = useState<VisitorDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [actualWidth, setActualWidth] = useState<number>(propWidth || 800)
  const containerRef = useRef<HTMLDivElement>(null)

  // 添加状态，控制图表是否已获取正确宽度
  const [isWidthInitialized, setIsWidthInitialized] = useState(false)

  // 动态获取容器宽度
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        setActualWidth(width)
        setIsWidthInitialized(true)
      }
    }

    // 初始加载时获取宽度
    updateWidth()

    // 监听窗口大小变化
    window.addEventListener('resize', updateWidth)

    // 添加延迟再次检查，确保容器布局完成
    const resizeTimeout = setTimeout(() => {
      updateWidth()
    }, 100)

    return () => {
      window.removeEventListener('resize', updateWidth)
      clearTimeout(resizeTimeout)
    }
  }, [propWidth])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const startDate = dayjs().subtract(30, 'day').format('YYYY-MM-DD')
        const endDate = dayjs().format('YYYY-MM-DD')
        const response = await visitorAPI.fetchVisitorTrends(startDate, endDate)
        if (response.data) {
          setData(response.data)
        }
      } catch (error) {
        console.error('获取访客数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    // 如果没有传入数据，则从API获取
    if (!propData) {
      fetchData()
    }
  }, [propData])

  const displayData = propData || data
  const displayLoading = propLoading !== undefined ? propLoading : loading

  const padding = { top: 20, right: 10, bottom: 40, left: 30 }
  const chartWidth = actualWidth - padding.left - padding.right - 16 // 减去padding和内边距
  const chartHeight = height - padding.top - padding.bottom - 16

  // 确保图表宽度不会为负，避免渲染错误
  const safeChartWidth = Math.max(chartWidth, 100)

  const dataField = viewType === 'visitors' ? 'visitors' : 'pageViews'
  const dataLabel = viewType === 'visitors' ? '访客' : '浏览量'

  if (displayLoading) {
    return (
      <div
        ref={containerRef}
        style={{ width: '100%', height, padding: '8px', boxSizing: 'border-box' }}
      >
        <div
          style={{
            width: '100%',
            height: height - 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spin />
        </div>
      </div>
    )
  }

  if (!displayData || displayData.length === 0) {
    return (
      <div
        ref={containerRef}
        style={{ width: '100%', height, padding: '8px', boxSizing: 'border-box' }}
      >
        <svg width={actualWidth - 16} height={height - 16} className="line-chart">
          <text x={padding.left} y={padding.top + chartHeight / 2} fill="#8c8c8c" fontSize="14">
            暂无数据
          </text>
        </svg>
      </div>
    )
  }

  const maxValue = Math.max(...displayData.map((d) => d[dataField]))
  const minValue = Math.min(...displayData.map((d) => d[dataField]))
  const valueRange = maxValue - minValue || 1

  const dataPoints = displayData.map((item, index) => {
    const x = padding.left + (index / Math.max(displayData.length - 1, 1)) * safeChartWidth
    const y = padding.top + chartHeight - ((item[dataField] - minValue) / valueRange) * chartHeight
    return { x, y, value: item[dataField], date: item.date }
  })

  const pathData = dataPoints.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }
    return `${path} L ${point.x} ${point.y}`
  }, '')

  const xTicks: Tick[] = []
  const tickCount = Math.min(5, displayData.length)
  for (let i = 0; i < tickCount; i++) {
    const index = Math.round((i / (tickCount - 1)) * (displayData.length - 1))
    const point = dataPoints[index]
    if (point) {
      xTicks.push({
        x: point.x,
        date: dayjs(point.date).format('MM/DD'),
      })
    }
  }

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
    <div
      ref={containerRef}
      style={{ width: '100%', height, padding: '8px', boxSizing: 'border-box' }}
    >
      <svg width={actualWidth - 16} height={height - 16} className="line-chart">
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartHeight}
          stroke="#e8e8e8"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={padding.left + safeChartWidth}
          y2={padding.top + chartHeight}
          stroke="#e8e8e8"
          strokeWidth="1"
        />
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
            <text
              x={padding.left - 10}
              y={tick.y + 5}
              textAnchor="end"
              fill="#8c8c8c"
              fontSize="12"
            >
              {tick.value}
            </text>
          </g>
        ))}
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
        {yTicks.map((tick, index) => (
          <line
            key={`grid-${index}`}
            x1={padding.left}
            y1={tick.y}
            x2={padding.left + safeChartWidth}
            y2={tick.y}
            stroke="#f0f0f0"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        ))}
        <path d={pathData} fill="none" stroke="#1890ff" strokeWidth="2" />
        {dataPoints.map((point, index) => (
          <circle
            key={`point-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#1890ff"
            stroke="#fff"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
          />
        ))}
      </svg>
    </div>
  )
}

export default VisitorChart
