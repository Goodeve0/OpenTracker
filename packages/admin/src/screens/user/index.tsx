import React, { useState, useEffect } from 'react'
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
  Modal,
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
import { authAPI, UpdateProfileRequest } from '@/api/auth'
import { projectAPI } from '@/api/project'
import { useUser } from '@/context/UserContext'
import { UserData, ProjectData } from '../../types/user'

const { Option } = Select
const { TabPane } = Tabs

const UserProfile: React.FC = () => {
  // 使用 UserContext 获取更新用户信息的方法
  const { updateUserInfo } = useUser()

  // 用户数据状态
  const [userData, setUserData] = useState<UserData>({
    id: '1',
    username: 'zhangsan',
    gender: '男',
    age: 28,
    email: 'zhangsan@example.com',
    telephone_number: '13800138000',
    bio: '这是一段个人简介，介绍自己的兴趣爱好和特长。',
    avatar: 'https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png',
  })

  // 加载状态
  const [loading, setLoading] = useState(false)

  // 项目数据状态
  const [projects, setProjects] = useState<ProjectData[]>([])

  // 控制添加项目模态框的状态
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)

  // 表单实例
  const [userInfoForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [addProjectForm] = Form.useForm()

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

  // 获取个人资料
  const fetchUserData = async () => {
    setLoading(true)
    try {
      const response = await authAPI.getProfile()
      if (response.code === 200 && response.data?.user) {
        const user = response.data.user
        setUserData(user)
        userInfoForm.setFieldsValue(user)
      } else {
        message.error(response.message || '获取个人资料失败')
      }
    } catch (error) {
      console.error('获取个人资料失败:', error)
      message.error('获取个人资料失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 加载项目数据
  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getProjects()
      if (response.code === 200 && response.data) {
        // 转换API返回的数据格式
        const formattedProjects: ProjectData[] = (response.data as any[]).map((project: any) => ({
          ...project,
          errorCount: 0, // 暂时设为0，后续可以从其他API获取
          performanceScore: 100, // 暂时设为100，后续可以从其他API获取
        }))
        setProjects(formattedProjects)
      } else {
        message.error(response.message || '获取项目列表失败')
      }
    } catch (error) {
      console.error('获取项目列表失败:', error)
      message.error('获取项目列表失败，请稍后重试')
    }
  }

  // 处理添加项目
  const handleAddProject = async (values: any) => {
    try {
      const response = await projectAPI.createProject({
        name: values.name,
        url: values.url,
        type: values.type,
        apiKey: values.apiKey,
        description: values.description,
      })

      if (response.code === 200 && response.data) {
        const newProject: ProjectData = {
          ...(response.data as any),
          errorCount: 0,
          performanceScore: 100,
        }
        setProjects([...projects, newProject])
        setIsAddModalVisible(false)
        addProjectForm.resetFields()
        message.success('项目添加成功！')
      } else {
        message.error(response.message || '添加项目失败')
      }
    } catch (error) {
      console.error('添加项目失败:', error)
      message.error('添加项目失败，请稍后重试')
    }
  }

  // 处理监控状态切换
  const handleMonitorStatusChange = async (
    projectId: number,
    newStatus: 'enabled' | 'disabled'
  ) => {
    try {
      const response = await projectAPI.updateMonitorStatus(projectId, newStatus)
      if (response.code === 200 && response.data) {
        setProjects(
          projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  monitorStatus: newStatus,
                  updatedAt: new Date().toISOString(),
                }
              : project
          )
        )
        message.success(`项目监控已${newStatus === 'enabled' ? '开启' : '关闭'}`)
      } else {
        message.error(response.message || '更新监控状态失败')
      }
    } catch (error) {
      console.error('更新监控状态失败:', error)
      message.error('更新监控状态失败，请稍后重试')
    }
  }

  // 处理删除项目
  const handleDeleteProject = async (projectId: number) => {
    try {
      const response = await projectAPI.deleteProject(projectId)
      if (response.code === 200) {
        setProjects(projects.filter((project) => project.id !== projectId))
        message.success('项目删除成功！')
      } else {
        message.error(response.message || '删除项目失败')
      }
    } catch (error) {
      console.error('删除项目失败:', error)
      message.error('删除项目失败，请稍后重试')
    }
  }

  // 组件挂载时获取个人资料和项目数据
  useEffect(() => {
    fetchUserData()
    fetchProjects()
  }, [])

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
                            <span className="info-value">{userData.telephone_number}</span>
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
                    onFinish={async (values) => {
                      try {
                        const response = await authAPI.updateProfile(values as UpdateProfileRequest)
                        if (response.code === 200 && response.data?.user) {
                          message.success('个人信息修改成功!')
                          // 更新本地用户数据
                          setUserData(response.data.user)
                          // 重置表单
                          userInfoForm.setFieldsValue(response.data.user)
                          // 调用 UserContext 的 updateUserInfo 方法，更新 header 中的用户名
                          await updateUserInfo()
                        } else {
                          message.error(response.message || '更新个人信息失败')
                        }
                      } catch (error) {
                        console.error('更新个人信息失败:', error)
                        message.error('更新个人信息失败，请稍后重试')
                      }
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
                              name="telephone_number"
                              label="手机号"
                              rules={[
                                { required: true, message: '请输入手机号' },
                                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码' },
                              ]}
                            >
                              <Input
                                type="text"
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
                    onFinish={async (values) => {
                      console.log('修改密码:', values)
                      try {
                        const response = await authAPI.changePassword(
                          values.currentPassword,
                          values.newPassword
                        )
                        if (response.code === 200) {
                          message.success(response.message || '密码修改成功!')
                          passwordForm.resetFields()
                        } else {
                          message.error(response.message || '修改密码失败')
                        }
                      } catch (error) {
                        console.error('修改密码失败:', error)
                        message.error('修改密码失败，请稍后重试')
                      }
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
                        <p>管理和监控所有项目</p>
                      </Col>
                      <Col>
                        <Button
                          type="primary"
                          icon={<SettingOutlined />}
                          onClick={() => setIsAddModalVisible(true)}
                        >
                          新建项目
                        </Button>
                      </Col>
                    </Row>
                  </div>

                  <Table
                    dataSource={projects}
                    rowKey="id"
                    bordered
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 'max-content' }}
                  >
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
                          <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                            <a href={record.url} target="_blank" rel="noopener noreferrer">
                              {record.url}
                            </a>
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
                      title="监控状态"
                      dataIndex="monitorStatus"
                      key="monitorStatus"
                      render={(status, record) => (
                        <div>
                          <Tag color={status === 'enabled' ? 'green' : 'red'}>
                            {status === 'enabled' ? '已开启' : '已关闭'}
                          </Tag>
                          <Button
                            size="small"
                            style={{ marginTop: '4px' }}
                            onClick={() =>
                              handleMonitorStatusChange(
                                record.id,
                                status === 'enabled' ? 'disabled' : 'enabled'
                              )
                            }
                          >
                            {status === 'enabled' ? '关闭监控' : '开启监控'}
                          </Button>
                        </div>
                      )}
                    />

                    <Table.Column
                      title="项目状态"
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
                          case 'pending':
                            color = 'orange'
                            text = '待处理'
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
                      title="监控数据"
                      key="monitorData"
                      render={(_, record) => (
                        <div>
                          <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                            错误数:{' '}
                            <span style={{ color: record.errorCount ? 'red' : 'green' }}>
                              {record.errorCount || 0}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px' }}>
                            性能评分:{' '}
                            <span
                              style={{
                                color: record.performanceScore
                                  ? record.performanceScore > 80
                                    ? 'green'
                                    : 'orange'
                                  : 'gray',
                              }}
                            >
                              {record.performanceScore || '--'}
                            </span>
                          </div>
                        </div>
                      )}
                    />

                    <Table.Column
                      title="API Key"
                      dataIndex="apiKey"
                      key="apiKey"
                      render={(text) => (
                        <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>{text}</div>
                      )}
                    />

                    <Table.Column title="创建时间" dataIndex="createdAt" key="createdAt" />

                    <Table.Column title="更新时间" dataIndex="updatedAt" key="updatedAt" />

                    <Table.Column
                      title="操作"
                      key="action"
                      render={(_, record) => (
                        <Space size="small">
                          <Button type="primary" size="small" icon={<EyeOutlined />}>
                            查看监控
                          </Button>
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteProject(record.id)}
                          >
                            删除
                          </Button>
                        </Space>
                      )}
                    />
                  </Table>

                  {/* 添加项目模态框 */}
                  <Modal
                    title="添加监控项目"
                    open={isAddModalVisible}
                    onCancel={() => setIsAddModalVisible(false)}
                    footer={[
                      <Button key="cancel" onClick={() => setIsAddModalVisible(false)}>
                        取消
                      </Button>,
                      <Button key="submit" type="primary" onClick={() => addProjectForm.submit()}>
                        保存
                      </Button>,
                    ]}
                  >
                    <Form form={addProjectForm} layout="vertical" onFinish={handleAddProject}>
                      <Form.Item
                        name="name"
                        label="项目名称"
                        rules={[{ required: true, message: '请输入项目名称' }]}
                      >
                        <Input placeholder="请输入项目名称" />
                      </Form.Item>
                      <Form.Item
                        name="url"
                        label="项目网址"
                        rules={[
                          { required: true, message: '请输入项目网址' },
                          {
                            validator: (_, value) => {
                              if (!value) {
                                return Promise.resolve()
                              }
                              // 简单的URL验证，允许localhost
                              const urlRegex =
                                /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
                              const localhostRegex =
                                /^(https?:\/\/)?localhost(:\d+)?([/\w .-]*)*\/?$/
                              if (urlRegex.test(value) || localhostRegex.test(value)) {
                                return Promise.resolve()
                              }
                              return Promise.reject(new Error('请输入有效的网址'))
                            },
                          },
                        ]}
                      >
                        <Input placeholder="请输入项目网址" />
                      </Form.Item>
                      <Form.Item
                        name="type"
                        label="项目类型"
                        rules={[{ required: true, message: '请选择项目类型' }]}
                      >
                        <Select placeholder="请选择项目类型">
                          <Option value="Web">Web应用</Option>
                          <Option value="Mobile">移动应用</Option>
                          <Option value="API">API服务</Option>
                          <Option value="Other">其他</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        name="apiKey"
                        label="API Key"
                        rules={[{ required: false, message: '请输入API Key' }]}
                      >
                        <Input placeholder="留空将自动生成" />
                      </Form.Item>
                      <Form.Item
                        name="description"
                        label="项目描述"
                        rules={[{ required: false, message: '请输入项目描述' }]}
                      >
                        <Input.TextArea rows={3} placeholder="请输入项目描述" />
                      </Form.Item>
                    </Form>
                  </Modal>
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
