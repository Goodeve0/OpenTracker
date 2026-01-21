import React from 'react'
import type { MenuProps } from 'antd'
import { Layout, Menu } from 'antd'
import {
  UserOutlined,
  AppstoreOutlined,
  SolutionOutlined,
  LineChartOutlined,
  TabletOutlined,
  ContactsOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'

const { Sider } = Layout

type MenuItem = Required<MenuProps>['items'][number]

interface SiderComponentProps {
  currentKey: string
  onMenuClick: MenuProps['onClick']
  colorBgContainer: string
}

// 菜单项目定义
const subItems: MenuItem[] = [
  {
    key: 'sub1',
    icon: <AppstoreOutlined />,
    label: '报表面板',
    children: [{ key: 'sub11', label: '数据概览' }],
  },
  {
    key: 'sub2',
    icon: <UserOutlined />,
    label: '访客分析',
    children: [
      { key: 'sub21', label: '访客趋势' },
      { key: 'sub22', label: '设备分析' },
    ],
  },
  {
    key: 'sub3',
    icon: <SolutionOutlined />,
    label: '行为分析',
    children: [
      { key: 'sub31', label: '事件分析' },
      { key: 'sub32', label: '页面访问' },
    ],
  },
  {
    key: 'sub4',
    icon: <ContactsOutlined />,
    label: '获客分析',
    children: [
      { key: 'sub41', label: '用户增长' },
      { key: 'sub42', label: '来源分析' },
    ],
  },
  {
    key: 'sub5',
    icon: <CloseCircleOutlined />,
    label: '错误分析',
    children: [
      { key: 'sub51', label: '错误分析总览' },
      { key: 'sub52', label: '错误日志查询' },
    ],
  },
  {
    key: 'sub6',
    icon: <LineChartOutlined />,
    label: '性能分析',
    children: [{ key: 'sub61', label: '性能概览' }],
  },
  {
    key: 'sub7',
    icon: <TabletOutlined />,
    label: '白屏监控',
    children: [{ key: 'sub71', label: '白屏分析' }],
  },
]

const SiderComponent: React.FC<SiderComponentProps> = ({
  currentKey,
  onMenuClick,
  colorBgContainer,
}) => {
  return (
    <Sider style={{ background: colorBgContainer, width: 200, flexShrink: 0 }}>
      <Menu
        mode="inline"
        onClick={onMenuClick}
        selectedKeys={[currentKey]}
        defaultOpenKeys={['sub1']}
        style={{ height: '100%' }}
        items={subItems}
      />
    </Sider>
  )
}

export default SiderComponent
export { subItems }
