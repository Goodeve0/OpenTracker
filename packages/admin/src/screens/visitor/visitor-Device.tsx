import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Table, Input, Spin, ConfigProvider, Tag, Empty } from 'antd'
import {
  SearchOutlined,
  MobileOutlined,
  TabletOutlined,
  LaptopOutlined,
  TagOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { visitorAPI, VisitorDeviceType, DeviceModel } from '../../api/visitor'

const { Search } = Input

// 根据设备类型获取图标
const getDeviceIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'desktop':
    case '桌面':
      return <LaptopOutlined />
    case 'mobile':
    case 'smartphone':
    case '智能手机':
      return <MobileOutlined />
    case 'tablet':
    case '平板电脑':
      return <TabletOutlined />
    default:
      return <UnorderedListOutlined />
  }
}

// 获取设备统计数据的API调用
const fetchDeviceStats = async () => {
  try {
    const response = await visitorAPI.fetchDeviceStats()
    return response.data
  } catch (error) {
    console.error('获取设备统计数据失败:', error)
    return { deviceTypes: [], deviceModels: [] }
  }
}

const VisitorDevice: React.FC = () => {
  const [deviceTypeData, setDeviceTypeData] = useState<VisitorDeviceType[]>([])
  const [deviceModelData, setDeviceModelData] = useState<DeviceModel[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [deviceTypeSearch, setDeviceTypeSearch] = useState<string>('')
  const [deviceModelSearch, setDeviceModelSearch] = useState<string>('')
  const [deviceTypePage, setDeviceTypePage] = useState<number>(1)
  const [deviceModelPage, setDeviceModelPage] = useState<number>(1)
  const pageSize = 10

  // 加载数据
  useEffect(() => {
    const fetchData = async (): Promise<void> => {
      setLoading(true)
      try {
        // 获取设备统计数据
        const { deviceTypes, deviceModels } = await fetchDeviceStats()

        // 为每个设备类型添加图标
        const deviceTypesWithIcons = deviceTypes.map((type) => ({
          ...type,
          icon: getDeviceIcon(type.name),
        })) as VisitorDeviceType[]

        setDeviceTypeData(deviceTypesWithIcons)
        setDeviceModelData(deviceModels)
      } catch (error: any) {
        console.error('获取设备数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 过滤设备类型数据
  const filteredDeviceTypeData = deviceTypeData.filter((type) =>
    type.name.toLowerCase().includes(deviceTypeSearch.toLowerCase())
  )

  // 过滤设备型号数据
  const filteredDeviceModelData = deviceModelData.filter(
    (model) =>
      model.name.toLowerCase().includes(deviceModelSearch.toLowerCase()) ||
      (model.brand && model.brand.toLowerCase().includes(deviceModelSearch.toLowerCase()))
  )

  // 设备类型表格列定义
  const deviceTypeColumns = [
    {
      title: '类型',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: VisitorDeviceType) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {record.icon}
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: VisitorDeviceType, b: VisitorDeviceType) => a.count - b.count,
      render: (text: number) => <Tag color="blue">{text}</Tag>,
    },
  ]

  // 设备型号表格列定义
  const deviceModelColumns = [
    {
      title: '型号',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: DeviceModel) => (
        <div>
          {record.brand && record.brand !== 'Unknown' && (
            <Tag color="green" style={{ marginBottom: 4 }}>
              {record.brand}
            </Tag>
          )}
          <div>{text}</div>
        </div>
      ),
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
      sorter: (a: DeviceModel, b: DeviceModel) => a.count - b.count,
      render: (text: number) => <Tag color="orange">{text}</Tag>,
    },
  ]

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <div className="visitor-device">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 600, color: '#000000e0' }}>设备统计</div>
        </div>

        <Row gutter={[16, 16]}>
          {/* 设备类型表格 */}
          <Col xs={24} lg={12}>
            <Card title="设备类型">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Search
                  placeholder="搜索设备类型"
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="small"
                  value={deviceTypeSearch}
                  onChange={(e) => setDeviceTypeSearch(e.target.value)}
                  style={{ width: 200 }}
                />
              </div>

              <Spin spinning={loading}>
                {filteredDeviceTypeData.length > 0 ? (
                  <Table
                    columns={deviceTypeColumns}
                    dataSource={filteredDeviceTypeData}
                    rowKey="id"
                    pagination={{
                      current: deviceTypePage,
                      onChange: setDeviceTypePage,
                      pageSize,
                      showSizeChanger: false,
                      showTotal: (total, range) => `1-${range[1]}/${total}`,
                    }}
                    scroll={{ y: 400 }}
                  />
                ) : (
                  <Empty description="暂无设备类型数据" />
                )}
              </Spin>
            </Card>
          </Col>

          {/* 设备型号表格 */}
          <Col xs={24} lg={12}>
            <Card title="设备型号">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <Search
                  placeholder="搜索设备型号"
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="small"
                  value={deviceModelSearch}
                  onChange={(e) => setDeviceModelSearch(e.target.value)}
                  style={{ width: 200 }}
                />
              </div>

              <Spin spinning={loading}>
                {filteredDeviceModelData.length > 0 ? (
                  <Table
                    columns={deviceModelColumns}
                    dataSource={filteredDeviceModelData}
                    rowKey="id"
                    pagination={{
                      current: deviceModelPage,
                      onChange: setDeviceModelPage,
                      pageSize,
                      showSizeChanger: false,
                      showTotal: (total, range) => `1-${range[1]}/${total}`,
                    }}
                    scroll={{ y: 400 }}
                  />
                ) : (
                  <Empty description="暂无设备型号数据" />
                )}
              </Spin>
            </Card>
          </Col>
        </Row>
      </div>
    </ConfigProvider>
  )
}

export default VisitorDevice
