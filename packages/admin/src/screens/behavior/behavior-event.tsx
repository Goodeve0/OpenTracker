import * as React from 'react'
import { Table, DatePicker, Select, Spin, Empty, Card, Tag, Space, Input } from 'antd'
import {
  SearchOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  UserOutlined,
  IeOutlined,
  MonitorOutlined,
} from '@ant-design/icons'
import { behaviorAPI, EventStatsData } from '../../api/behavior'
import { DeviceType, EventType, UserBehaviorData, UserType } from '../../api/behavior'
import type { ColumnType } from 'antd/es/table'
import type { FilterValue, SorterResult } from 'antd/es/table/interface'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import error from '../error'

const { RangePicker } = DatePicker

// 事件类型映射
const eventTypeMap: Record<string, { name: string; color: string }> = {
  [EventType.PAGE_VIEW]: { name: '页面浏览', color: '#52c41a' },
  [EventType.CLICK]: { name: '点击事件', color: '#1890ff' },
  [EventType.SCROLL]: { name: '滚动事件', color: '#faad14' },
  [EventType.SEARCH]: { name: '搜索事件', color: '#722ed1' },
  [EventType.FORM_SUBMIT]: { name: '表单提交', color: '#eb2f96' },
  [EventType.LINK_CLICK]: { name: '链接点击', color: '#13c2c2' },
  [EventType.VIDEO_PLAY]: { name: '视频播放', color: '#fa8c16' },
  [EventType.VIDEO_PAUSE]: { name: '视频暂停', color: '#a0d911' },
}

// 设备类型映射
const deviceTypeMap: Record<string, { name: string; icon: React.ReactNode }> = {
  [DeviceType.DESKTOP]: { name: '桌面端', icon: <MonitorOutlined /> },
  [DeviceType.MOBILE]: { name: '移动端', icon: <IeOutlined /> },
  [DeviceType.TABLET]: { name: '平板', icon: <IeOutlined /> },
}

const BehaviorEvent: React.FC = () => {
  const [data, setData] = useState<UserBehaviorData[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [sorter, setSorter] = useState<
    SorterResult<UserBehaviorData> | SorterResult<UserBehaviorData>[]
  >({ field: 'timestamp', order: 'descend' })
  const [filters, setFilters] = useState<Record<string, FilterValue | null>>({})
  // 设置默认日期范围为最近7天
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ])
  // 分页状态
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  // 筛选条件
  const [eventType, setEventType] = useState<EventType | undefined>()
  const [userType, setUserType] = useState<UserType | undefined>()
  const [deviceType, setDeviceType] = useState<DeviceType | undefined>()
  const [searchKeyword, setSearchKeyword] = useState('')

  // 获取事件统计数据
  const fetchEventStats = async () => {
    setLoading(true)
    try {
      const startDate =
        dateRange[0]?.format('YYYY-MM-DD') || dayjs().subtract(7, 'day').format('YYYY-MM-DD')
      const endDate = dateRange[1]?.format('YYYY-MM-DD') || dayjs().format('YYYY-MM-DD')

      const response = await behaviorAPI.getEventStats({
        startDate,
        endDate,
        eventType,
        userType,
        deviceType,
        searchKeyword,
      })
      if (response.code === 200) {
        // 处理统计数据
      }
    } catch (err) {
      console.error('获取事件统计数据失败:', err)
      // 即使失败也不显示错误，保持界面简洁
    } finally {
      setLoading(false)
    }
  }

  // 获取事件数据
  const fetchEventData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 使用默认日期范围（最近7天）如果没有选择日期
      const defaultStartDate = dayjs().subtract(7, 'day').format('YYYY-MM-DD')
      const defaultEndDate = dayjs().format('YYYY-MM-DD')

      const startDate = dateRange[0]?.format('YYYY-MM-DD') || defaultStartDate
      const endDate = dateRange[1]?.format('YYYY-MM-DD') || defaultEndDate

      const response = await behaviorAPI.getUserBehaviors({
        startDate,
        endDate,
        page: pagination.current,
        pageSize: pagination.pageSize,
      })
      if (response.code === 200) {
        setData(response.data.data)
        setPagination((prev) => ({
          ...prev,
          total: response.data.total,
        }))
      } else {
        setError(response.message || '获取事件数据失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      console.error('获取事件数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  // 初始加载数据
  useEffect(() => {
    fetchEventStats()
    fetchEventData()
  }, [dateRange, pagination.current, pagination.pageSize])

  // 处理排序和筛选
  const handleTableChange = (
    newPagination: any,
    newFilters: Record<string, FilterValue | null>,
    newSorter: SorterResult<UserBehaviorData> | SorterResult<UserBehaviorData>[]
  ) => {
    setFilters(newFilters)
    setSorter(newSorter)
    setPagination((prev) => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }))
  }

  // 处理日期范围变化
  const handleDateRangeChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])
    }
  }

  // 格式化时间戳
  const formatTimestamp = (timestamp: string) => {
    return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
  }

  // 表格列配置
  const columns: ColumnType<UserBehaviorData>[] = [
    {
      title: '事件类型',
      dataIndex: 'behaviorType',
      key: 'behaviorType',
      width: 120,
      filters: Object.keys(eventTypeMap).map((type) => ({
        text: eventTypeMap[type].name,
        value: type,
      })),
      onFilter: (value, record) => record.behaviorType === value,
      render: (type) => {
        const eventType = eventTypeMap[type] || { name: type, color: '#8c8c8c' }
        return <Tag color={eventType.color}>{eventType.name}</Tag>
      },
    },
    {
      title: '页面',
      dataIndex: 'pageUrl',
      key: 'pageUrl',
      width: 200,
      render: (url) => (
        <Space>
          <EyeOutlined />
          <span>{url}</span>
        </Space>
      ),
    },
    {
      title: '用户类型',
      dataIndex: 'userType',
      key: 'userType',
      width: 120,
      filters: [
        { text: '登录用户', value: 'guest' },
        { text: '注册用户', value: 'registered' },
      ],
      onFilter: (value, record) => record.userType === value,
      render: (userType) => {
        return (
          <Space>
            <UserOutlined />
            <span>{userType === 'registered' ? '注册用户' : '登录用户'}</span>
          </Space>
        )
      },
    },
    {
      title: '设备类型',
      dataIndex: 'device',
      key: 'device',
      width: 120,
      filters: Object.keys(deviceTypeMap).map((device) => ({
        text: deviceTypeMap[device].name,
        value: device,
      })),
      onFilter: (value, record) => record.device === value,
      render: (device) => {
        const deviceType = deviceTypeMap[device] || { name: device, icon: <IeOutlined /> }
        return (
          <Space>
            {deviceType.icon}
            <span>{deviceType.name}</span>
          </Space>
        )
      },
    },
    {
      title: '浏览器',
      dataIndex: 'browser',
      key: 'browser',
      width: 150,
    },
    {
      title: '停留时间',
      dataIndex: 'duration',
      key: 'duration',
      width: 120,
      sorter: (a, b) => a.duration - b.duration,
      render: (duration) => {
        const minutes = Math.floor(duration / 60)
        const seconds = duration % 60
        return (
          <Space>
            <ClockCircleOutlined />
            <span>
              {minutes > 0 ? `${minutes}分` : ''}
              {seconds}秒
            </span>
          </Space>
        )
      },
    },
    {
      title: '发生时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      sorter: (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      render: (timestamp) => formatTimestamp(timestamp),
    },
  ]

  return (
    <div className="behavior-event-page">
      <Card
        title={
          <div className="flex items-center gap-2">
            <div style={{ fontSize: '20px', fontWeight: 600, color: '#000000e0' }}>
              <SearchOutlined />
              事件分析
            </div>
          </div>
        }
        extra={
          <Space>
            <RangePicker
              onChange={(dates, _dateStrings) =>
                handleDateRangeChange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)
              }
              placeholder={['开始日期', '结束日期']}
              format="YYYY-MM-DD"
              value={dateRange}
            />
          </Space>
        }
      >
        <Spin spinning={loading} tip="加载事件数据中...">
          {error ? (
            <div className="text-center text-red-500 py-10">
              <p>{error}</p>
              <button
                onClick={fetchEventData}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                重试
              </button>
            </div>
          ) : data.length > 0 ? (
            <Table
              columns={columns}
              dataSource={data.map((item) => ({ ...item, key: item.id }))}
              rowKey="id"
              onChange={handleTableChange}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条事件记录`,
              }}
              scroll={{ x: 1200 }}
              bordered
              size="middle"
            />
          ) : (
            <Empty
              description="暂无事件数据"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              style={{ margin: '40px 0' }}
            />
          )}
        </Spin>
      </Card>
    </div>
  )
}

export default BehaviorEvent
function setPagination(_arg0: (prev: any) => any) {
  throw new Error('Function not implemented.')
}
function setError(_arg0: string) {
  throw new Error('Function not implemented.')
}
