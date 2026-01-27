import React, { useRef, useEffect, useState } from 'react'
import * as echarts from 'echarts'
import { Spin } from 'antd'
import { queryStatsData } from '../../api/track'

interface TopErrorsChartProps {
  title?: string
  height?: number
  loading?: boolean
}

const TopErrorsChart: React.FC<TopErrorsChartProps> = ({
  title = '高频报错页面',
  height = 300,
  loading = false,
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)
  const [data, setData] = useState<any[]>([])
  const [pages, setPages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [localLoading, setLocalLoading] = useState(false)

  // 从后端API获取高报错页面数据
  useEffect(() => {
    const fetchTopErrorsData = async () => {
      setError(null)
      setLocalLoading(true)
      try {
        const response = await queryStatsData({
          type: 'high_error_pages',
          limit: 5,
        })

        if (response.code === 200 && response.data) {
          let errorData: any[] = []
          let pageNames: string[] = []

          if (response.data.pages && response.data.values) {
            // 处理后端返回的pages和values格式
            errorData = response.data.values
            pageNames = response.data.pages
          } else if (Array.isArray(response.data)) {
            // 处理数组格式数据
            errorData = response.data.map((item: any) => item.count)
            pageNames = response.data.map((item: any) => item.page)
          }

          setData(errorData)
          setPages(pageNames)
        }
      } catch (err) {
        setError('获取高报错页面数据失败')
        console.error('获取高报错页面数据失败:', err)
        setData([]) // 确保数据为空，触发"暂无数据"显示
        setPages([]) // 确保页面列表为空，触发"暂无数据"显示
      } finally {
        setLocalLoading(false)
      }
    }

    fetchTopErrorsData()
  }, [])

  // 更新图表数据
  useEffect(() => {
    if (!chartRef.current) return

    // 初始化图表实例
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    // 配置图表选项
    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: { type: 'value', boundaryGap: [0, 0.01] },
      yAxis: {
        type: 'category',
        data: pages,
        axisLabel: { interval: 0, width: 80, overflow: 'truncate' },
      },
      series: [
        {
          name: '报错次数',
          type: 'bar',
          data: data,
          itemStyle: { color: '#597ef7' },
        },
      ],
    }

    chartInstance.current.setOption(option)

    // 添加延迟resize，确保容器大小已确定
    const resizeTimeout = setTimeout(() => {
      chartInstance.current?.resize()
    }, 100)

    const handleResize = () => {
      chartInstance.current?.resize()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeout) clearTimeout(resizeTimeout)
      chartInstance.current?.dispose()
    }
  }, [data, pages])

  useEffect(() => {
    if (chartInstance.current) {
      if (loading) {
        chartInstance.current.showLoading()
      } else {
        chartInstance.current.hideLoading()
      }
    }
  }, [loading])

  if (loading || localLoading) {
    return (
      <div
        style={{
          height: `${height}px`,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin tip="加载中..." />
      </div>
    )
  }

  // 无论是否有错误，只要数据为空就显示"暂无数据"
  const isEmptyData = !pages || pages.length === 0 || !data || data.length === 0

  return (
    <div style={{ height: `${height}px`, width: '100%', position: 'relative' }}>
      {isEmptyData && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            zIndex: 1,
          }}
        >
          <div style={{ color: '#8c8c8c', fontSize: '14px' }}>暂无数据</div>
        </div>
      )}
      <div ref={chartRef} style={{ height: `${height}px`, width: '100%' }} />
    </div>
  )
}

export default TopErrorsChart
