import React, { useState, useEffect } from 'react'
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
  // 初始openKeys，根据currentKey计算
  const getInitialOpenKeys = () => {
    if (currentKey.length === 4) {
      return [currentKey.substring(0, 3)]
    }
    return ['sub1']
  }

  // 从localStorage获取初始openKeys
  const getOpenKeysFromStorage = () => {
    const stored = localStorage.getItem('sidebar_openKeys')
    if (stored) {
      return JSON.parse(stored)
    }
    return getInitialOpenKeys()
  }

  // 添加openKeys状态管理，从localStorage恢复
  const [openKeys, setOpenKeys] = useState<string[]>(getOpenKeysFromStorage())

  // 当currentKey变化时，更新openKeys
  useEffect(() => {
    if (currentKey.length === 4) {
      const parentKey = currentKey.substring(0, 3)
      // 如果当前父菜单不在openKeys中，则添加
      if (!openKeys.includes(parentKey)) {
        const newOpenKeys = [...openKeys, parentKey]
        setOpenKeys(newOpenKeys)
        localStorage.setItem('sidebar_openKeys', JSON.stringify(newOpenKeys))
      }
    }
  }, [currentKey])

  // 处理菜单展开/折叠事件，并保存到localStorage
  const onOpenChange: MenuProps['onOpenChange'] = (keys) => {
    setOpenKeys(keys)
    localStorage.setItem('sidebar_openKeys', JSON.stringify(keys))
  }

  return (
    <Sider style={{ background: colorBgContainer, width: 200, flexShrink: 0 }}>
      <Menu
        mode="inline"
        onClick={onMenuClick}
        selectedKeys={[currentKey]}
        openKeys={openKeys}
        onOpenChange={onOpenChange}
        style={{ height: '100%' }}
        items={subItems}
      />
    </Sider>
  )
}

export default SiderComponent
export { subItems }
