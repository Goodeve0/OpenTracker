import React, { useState } from 'react'
import HeaderComponent from '@/components/header'
import {
  Card,
  Tabs,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Button,
  Avatar,
  Row,
  Col,
  Divider,
  Space,
  message,
  Table,
  Tag,
  Progress,
  Badge,
} from 'antd'
import './index.css'
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  UploadOutlined,
  LockOutlined,
  EditOutlined,
  EyeOutlined,
  SettingOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons'

const { Option } = Select
const { TabPane } = Tabs

// 个人信息数据类型
interface UserData {
  id: string
  username: string
  gender: '男' | '女' | string
  age: number
  email: string
  phone: string
  bio: string
  avatar: string
}

// 项目数据类型
interface ProjectData {
  id: string
  name: string
  status: 'running' | 'stopped' | 'pending' | 'completed'
  progress: number
  created: string
  updated: string
  type: string
  description: string
}

const UserProfile: React.FC = () => {
  // 模拟用户数据
  const [userData] = useState<UserData>({
    id: '1',
    username: 'zhangsan',
    gender: '男',
    age: 28,
    email: 'zhangsan@example.com',
    phone: '13800138000',
    bio: '这是一段个人简介，介绍自己的兴趣爱好和特长。',
    avatar: 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png',
  })

  // 模拟项目数据
  const [projects] = useState<ProjectData[]>([
    {
      id: '1',
      name: '个人网站开发',
      status: 'running',
      progress: 75,
      created: '2023-09-15',
      updated: '2023-10-20',
      type: 'Web',
      description: '使用React和Node.js开发的个人博客网站，包含文章发布、评论等功能',
    },
    {
      id: '2',
      name: '数据可视化仪表盘',
      status: 'completed',
      progress: 100,
      created: '2023-08-20',
      updated: '2023-09-30',
      type: 'Data',
      description: '基于ECharts的数据可视化项目，展示销售数据和用户行为分析',
    },
    {
      id: '3',
      name: '移动应用开发',
      status: 'pending',
      progress: 20,
      created: '2023-10-01',
      updated: '2023-10-18',
      type: 'Mobile',
      description: 'React Native跨平台移动应用，提供任务管理和日程提醒功能',
    },
    {
      id: '4',
      name: 'AI模型训练',
      status: 'stopped',
      progress: 50,
      created: '2023-09-05',
      updated: '2023-10-15',
      type: 'AI',
      description: '机器学习模型训练项目，用于图像识别和分类',
    },
  ])

  // 表单实例
  const [userInfoForm] = Form.useForm()
  const [passwordForm] = Form.useForm()

  // 头像上传配置
  const uploadProps = {
    name: 'avatar',
    action: '/api/upload',
    headers: {
      authorization: 'authorization-text',
    },
    showUploadList: false,
    beforeUpload: (file: File) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
      if (!isJpgOrPng) {
        message.error('只能上传JPG/PNG格式的图片!')
      }
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        message.error('图片大小不能超过2MB!')
      }
      return isJpgOrPng && isLt2M
    },
  }

  return (
    <div>
      <HeaderComponent />
      <div className="user-profile-container">
        <Row gutter={[24, 24]}>
          {/* 左侧用户信息 */}
          <Col xs={24} md={6}>
            <Card className="user-info-card">
              <div className="avatar-section">
                <Upload {...uploadProps}>
                  <Avatar size={120} src={userData.avatar} icon={<UserOutlined />} />
                  <div className="avatar-upload-text">点击更换头像</div>
                </Upload>
              </div>
              <div className="user-info">
                <h2 className="username">{userData.username}</h2>
                <div className="bio-section">
                  <h3>个人简介</h3>
                  <p>{userData.bio}</p>
                </div>
              </div>
            </Card>
          </Col>

          {/* 右侧标签页内容 */}
          <Col xs={24} md={18}>
            <Card className="main-content-card">
              <Tabs defaultActiveKey="1">
                {/* 个人信息展示 */}
                <TabPane tab="个人信息" key="1">
                  <div className="info-section">
                    <Row gutter={[24, 24]}>
                      <Col xs={24}>
                        <div className="user-details-section">
                          <div className="info-item">
                            <span className="info-label">用户名</span>
                            <span className="info-value">{userData.username}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">性别</span>
                            <span className="info-value">{userData.gender}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">年龄</span>
                            <span className="info-value">{userData.age}岁</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">邮箱</span>
                            <span className="info-value">{userData.email}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">手机号</span>
                            <span className="info-value">{userData.phone}</span>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </TabPane>

                {/* 修改个人信息 */}
                <TabPane tab="修改信息" key="2">
                  <Form
                    form={userInfoForm}
                    layout="vertical"
                    initialValues={userData}
                    autoComplete="off"
                    onFinish={(values) => {
                      console.log('修改个人信息:', values)
                      // 这里可以添加提交到服务器的逻辑
                      message.success('个人信息修改成功!')
                      userInfoForm.resetFields()
                    }}
                  >
                    <Row gutter={[24, 24]}>
                      <Col xs={24} md={16}>
                        <Row gutter={[24, 24]}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="username"
                              label="用户名"
                              rules={[
                                { required: true, message: '请输入用户名' },
                                { min: 3, message: '用户名长度不能少于3个字符' },
                                { max: 20, message: '用户名长度不能超过20个字符' },
                                {
                                  pattern: /^[a-zA-Z0-9_]+$/,
                                  message: '用户名只能包含字母、数字和下划线',
                                },
                              ]}
                            >
                              <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
                            </Form.Item>
                          </Col>

                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="gender"
                              label="性别"
                              rules={[{ required: true, message: '请选择性别' }]}
                            >
                              <Select placeholder="请选择性别">
                                <Option value="男">男</Option>
                                <Option value="女">女</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="age"
                              label="年龄"
                              rules={[
                                { required: true, message: '请输入年龄' },
                                {
                                  type: 'number',
                                  min: 1,
                                  max: 100,
                                  message: '请输入1-100之间的有效年龄',
                                },
                              ]}
                            >
                              <InputNumber
                                placeholder="请输入年龄"
                                min={1}
                                max={100}
                                style={{ width: '100%' }}
                                precision={0}
                              />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="email"
                              label="邮箱"
                              rules={[
                                { required: true, message: '请输入邮箱地址' },
                                { type: 'email', message: '请输入有效的邮箱地址' },
                              ]}
                            >
                              <Input prefix={<MailOutlined />} placeholder="请输入邮箱地址" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              name="phone"
                              label="手机号"
                              rules={[
                                { required: true, message: '请输入手机号' },
                                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
                              ]}
                            >
                              <Input
                                type="number"
                                prefix={<PhoneOutlined />}
                                placeholder="请输入手机号"
                              />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Col>
                      <Col xs={24}>
                        <Form.Item
                          name="bio"
                          label="个人简介"
                          rules={[{ max: 200, message: '个人简介长度不能超过200个字符' }]}
                        >
                          <Input.TextArea rows={4} placeholder="请输入个人简介" />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item>
                      <Space>
                        <Button type="primary" htmlType="submit" icon={<EditOutlined />}>
                          保存修改
                        </Button>
                        <Button onClick={() => userInfoForm.resetFields()}>取消</Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </TabPane>

                {/* 密码修改 */}
                <TabPane tab="修改密码" key="3">
                  <Form
                    form={passwordForm}
                    layout="vertical"
                    autoComplete="off"
                    onFinish={(values) => {
                      console.log('修改密码:', values)
                      // 这里可以添加提交到服务器的逻辑
                      message.success('密码修改成功!')
                      passwordForm.resetFields()
                    }}
                  >
                    <Form.Item
                      name="currentPassword"
                      label="当前登录密码"
                      rules={[{ required: true, message: '请输入当前登录密码' }]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="请输入当前登录密码" />
                    </Form.Item>
                    <Form.Item
                      name="newPassword"
                      label="新登录密码"
                      rules={[
                        { required: true, message: '请输入新登录密码' },
                        {
                          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,20}$/,
                          message: '密码必须包含大小写字母和数字，长度8-20位',
                        },
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="请输入新登录密码" />
                    </Form.Item>
                    <Form.Item
                      name="confirmPassword"
                      label="确认新登录密码"
                      dependencies={['newPassword']}
                      rules={[
                        { required: true, message: '请确认新登录密码' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                              return Promise.resolve()
                            }
                            return Promise.reject(new Error('两次输入的密码不一致'))
                          },
                        }),
                      ]}
                    >
                      <Input.Password prefix={<LockOutlined />} placeholder="请确认新登录密码" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" icon={<LockOutlined />} block>
                        修改登录密码
                      </Button>
                    </Form.Item>
                  </Form>
                </TabPane>

                {/* 我的项目 */}
                <TabPane tab="我的项目" key="4">
                  <div className="projects-header">
                    <Row justify="space-between" align="middle">
                      <Col>
                        <h2>我的项目</h2>
                        <p>管理和查看所有项目</p>
                      </Col>
                      <Col>
                        <Button type="primary" icon={<SettingOutlined />}>
                          新建项目
                        </Button>
                      </Col>
                    </Row>
                  </div>

                  <Table dataSource={projects} rowKey="id" bordered pagination={{ pageSize: 10 }}>
                    <Table.Column
                      title="项目名称"
                      dataIndex="name"
                      key="name"
                      render={(text, record) => (
                        <div>
                          <div style={{ fontWeight: 600 }}>{text}</div>
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                            {record.description}
                          </div>
                        </div>
                      )}
                    />

                    <Table.Column
                      title="项目类型"
                      dataIndex="type"
                      key="type"
                      render={(text) => <Tag color="blue">{text}</Tag>}
                    />

                    <Table.Column
                      title="状态"
                      dataIndex="status"
                      key="status"
                      render={(status) => {
                        let color = ''
                        let text = ''
                        let icon = null

                        switch (status) {
                          case 'running':
                            color = 'green'
                            text = '运行中'
                            icon = (<PlayCircleOutlined />) as any
                            break
                          case 'completed':
                            color = 'green'
                            text = '已完成'
                            icon = (<Badge status="success" />) as any
                            break
                          case 'pending':
                            color = 'orange'
                            text = '进行中'
                            icon = (<Progress percent={0} size="small" />) as any
                            break
                          case 'stopped':
                            color = 'red'
                            text = '已停止'
                            icon = (<PauseCircleOutlined />) as any
                            break
                          default:
                            color = 'default'
                            text = status
                        }

                        return (
                          <Tag color={color} icon={icon}>
                            {text}
                          </Tag>
                        )
                      }}
                    />

                    <Table.Column
                      title="进度"
                      dataIndex="progress"
                      key="progress"
                      render={(progress) => (
                        <Progress
                          percent={progress}
                          size="small"
                          status={progress === 100 ? 'success' : 'active'}
                        />
                      )}
                    />

                    <Table.Column title="创建时间" dataIndex="created" key="created" />

                    <Table.Column title="更新时间" dataIndex="updated" key="updated" />

                    <Table.Column
                      title="操作"
                      key="action"
                      render={(_, record) => (
                        <Space size="small">
                          <Button type="primary" size="small" icon={<EyeOutlined />}>
                            查看
                          </Button>
                          <Button size="small" icon={<SettingOutlined />}>
                            编辑
                          </Button>
                          <Button danger size="small" icon={<DeleteOutlined />}>
                            删除
                          </Button>
                        </Space>
                      )}
                    />
                  </Table>
                </TabPane>
              </Tabs>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default UserProfile
