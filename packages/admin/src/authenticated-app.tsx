import React from 'react'
import type { MenuProps } from 'antd'
import { Breadcrumb, Button, Layout, Menu, Typography, theme } from 'antd'
import { LaptopOutlined, NotificationOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { removeToken } from '@/utils/token'

const { Header, Content, Footer, Sider } = Layout
const { Title } = Typography

const items1: MenuProps['items'] = ['1', '2', '3'].map((key) => ({
  key,
  label: `nav ${key}`,
}))

const items2: MenuProps['items'] = [UserOutlined, LaptopOutlined, NotificationOutlined].map(
  (icon, index) => {
    const key = String(index + 1)

    return {
      key: `sub${key}`,
      icon: React.createElement(icon),
      label: `subnav ${key}`,
      children: Array.from({ length: 4 }).map((_, j) => {
        const subKey = index * 4 + j + 1
        return {
          key: subKey,
          label: `option${subKey}`,
        }
      }),
    }
  }
)

const AuthenticatedApp: React.FC = () => {
  const navigate = useNavigate()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  const handleLogout = () => {
    removeToken()
    navigate('/')
  }

  return (
    <Layout>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div className="demo-logo" />
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['2']}
          items={items1}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Button type="default" danger onClick={handleLogout}>
          退出登录
        </Button>
      </Header>
      <div style={{ padding: '0 48px' }}>
        <Breadcrumb
          style={{ margin: '16px 0' }}
          items={[{ title: 'Home' }, { title: 'List' }, { title: 'App' }]}
        />
        <Layout
          style={{ padding: '24px 0', background: colorBgContainer, borderRadius: borderRadiusLG }}
        >
          <Sider style={{ background: colorBgContainer }} width={200}>
            <Menu
              mode="inline"
              defaultSelectedKeys={['1']}
              defaultOpenKeys={['sub1']}
              style={{ height: '100%' }}
              items={items2}
            />
          </Sider>
          <Content style={{ padding: '0 24px', maxHeight: 684, overflow: 'auto' }}>
            <Title level={1}>主页</Title>
            <p>欢迎使用 OpenTracker 埋点平台</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
            <p>测试滚轮</p>
          </Content>
        </Layout>
      </div>
      <Footer style={{ textAlign: 'center' }}>
        Ant Design ©{new Date().getFullYear()} Created by Ant UED
      </Footer>
    </Layout>
  )
}

export default AuthenticatedApp
