import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Spin, Tooltip, Dropdown, Menu } from 'antd'
import { DeleteOutlined, ReloadOutlined, SettingOutlined, BorderOutlined } from '@ant-design/icons'
import { ChartConfig } from '../types'
// 添加拖拽相关导入
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface ChartContainerProps {
  config: ChartConfig
  onDelete: (id: string) => void
  onAdd?: (afterId: string) => void
  onRefresh?: (id: string) => void
  onConfigure?: (id: string) => void
  onSizeChange?: (id: string, size: 'small' | 'medium' | 'large') => void
  loading?: boolean
  children: React.ReactNode
}

// 自定义提示组件
const Toast: React.FC<{ message: string; visible: boolean; onClose: () => void }> = ({
  message,
  visible,
  onClose,
}) => {
  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '64px', // 与顶部导航栏同高
        left: '50%',
        transform: 'translate(-50%, 0)',
        backgroundColor: message === '删除成功' ? '#ff4d4f' : '#52c41a',
        color: '#fff',
        padding: '8px 16px', // 尺寸小一点
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        zIndex: 9999,
        animation: 'fadeIn 0.3s ease-in-out',
        textAlign: 'center',
        fontSize: '14px', // 字体小一点
      }}
    >
      {message}
    </div>
  )
}

const ChartContainer: React.FC<ChartContainerProps> = ({
  config,
  onDelete,
  onAdd,
  onRefresh,
  onConfigure,
  onSizeChange,
  loading = false,
  children,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [elementWidth, setElementWidth] = useState<number>(0)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // 获取尺寸类
  const getSizeClass = () => {
    switch (config.size) {
      case 'small':
        return 'chart-container-small chart-container-size-small'
      case 'medium':
        return 'chart-container-medium chart-container-size-medium'
      case 'large':
        return 'chart-container-large chart-container-size-large'
      default:
        return 'chart-container-medium chart-container-size-medium'
    }
  }

  // 监听元素宽度变化，保存实际宽度
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setElementWidth(containerRef.current.offsetWidth)
      }
    }

    // 初始获取宽度
    updateWidth()

    // 监听窗口大小变化
    window.addEventListener('resize', updateWidth)

    return () => {
      window.removeEventListener('resize', updateWidth)
    }
  }, [])

  // 添加拖拽相关配置
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: config.id,
  })

  // 图表容器样式
  const style: React.CSSProperties = {
    // 始终应用 transition，确保尺寸和位置变化时有平滑动画
    transition,
    // 只在拖拽过程中应用 transform，防止尺寸变化时位置偏移
    ...(isDragging && {
      transform: CSS.Transform.toString(transform),
      // 拖拽时设置更高的 z-index，确保显示在最上层
      zIndex: 1000,
    }),
    // 拖拽时降低透明度
    opacity: isDragging ? 0.5 : 1,
    // 始终显示拖拽光标
    cursor: 'grab',
    touchAction: 'none',
    // 确保拖拽时元素保持原始大小
    boxSizing: 'border-box',
    // 始终保持固定的 flex 属性，防止被挤压
    flex: '0 0 auto',
    flexShrink: 0,
    // 确保元素尺寸变化时有平滑过渡
    width: '100%',
    // 拖拽时强制锁定尺寸，使用实际元素宽度
    ...(isDragging &&
      elementWidth > 0 && {
        // 使用实际元素宽度，确保拖动时保持自己的原始尺寸
        width: `${elementWidth}px`,
        maxWidth: `${elementWidth}px`,
        minWidth: `${elementWidth}px`,
        // 保持相对定位，确保 transform 样式正常工作
        position: 'relative',
        // 确保内容不溢出
        overflow: 'hidden',
        // 防止被其他 flex 容器影响
        flex: 'none',
      }),
  }

  useEffect(() => {
    setIsLoading(loading)
  }, [loading])

  const handleRefresh = () => {
    setIsLoading(true)
    onRefresh?.(config.id)
    // 模拟刷新延迟
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

  // 显示自定义提示
  const showToast = (message: string) => {
    setToastMessage(message)
    setToastVisible(true)

    // 3秒后自动关闭
    setTimeout(() => {
      setToastVisible(false)
    }, 3000)
  }

  // 处理尺寸变化
  const handleSizeChange = (size: 'small' | 'medium' | 'large') => {
    onSizeChange?.(config.id, size)
    // 使用简化的提示信息
    showToast('修改成功')
  }

  // 尺寸选择菜单
  const sizeMenu = (
    <Menu
      items={[
        {
          key: 'small',
          label: '小 (1/3 宽度)',
          onClick: () => handleSizeChange('small'),
        },
        {
          key: 'medium',
          label: '中 (1/2 宽度)',
          onClick: () => handleSizeChange('medium'),
        },
        {
          key: 'large',
          label: '大 (全屏宽度)',
          onClick: () => handleSizeChange('large'),
        },
      ]}
    />
  )

  // 将title修改为可拖拽的
  const draggableTitle = (
    <div
      ref={setNodeRef}
      style={{
        cursor: 'grab',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
      {...attributes}
      {...listeners}
    >
      <span>☰</span> {config.title}
    </div>
  )

  // 当图表大小变化时，重置容器宽度，触发内部图表组件的宽度更新
  useEffect(() => {
    if (containerRef.current) {
      // 重置元素宽度，触发内部图表组件的宽度更新
      const updateWidth = () => {
        const width = containerRef.current?.offsetWidth || 0
        setElementWidth(width)
      }

      // 立即更新宽度
      updateWidth()

      // 添加延迟，确保布局已完成
      const timeout = setTimeout(() => {
        updateWidth()
      }, 100)

      return () => clearTimeout(timeout)
    }
  }, [config.size])

  // 添加CSS类来确保过渡动画正常工作
  const containerClassName = `chart-container ${getSizeClass()} ${isDragging ? 'chart-dragging' : ''}`

  return (
    <>
      {/* 自定义提示组件 */}
      <Toast message={toastMessage} visible={toastVisible} onClose={() => setToastVisible(false)} />
      <div ref={containerRef} className={containerClassName} style={style}>
        <Card
          title={draggableTitle}
          extra={
            <div style={{ display: 'flex', gap: '8px' }}>
              {/* 替换为尺寸修改按钮 */}
              <Tooltip title="修改尺寸">
                <Dropdown overlay={sizeMenu} trigger={['click']}>
                  <Button type="text" icon={<BorderOutlined />} size="small" />
                </Dropdown>
              </Tooltip>
              {onConfigure && (
                <Tooltip title="配置">
                  <Button
                    type="text"
                    icon={<SettingOutlined />}
                    onClick={() => onConfigure(config.id)}
                    size="small"
                  />
                </Tooltip>
              )}
              {onRefresh && (
                <Tooltip title="刷新">
                  <Button
                    type="text"
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    size="small"
                    loading={isLoading}
                  />
                </Tooltip>
              )}
              <Tooltip title="删除">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(config.id)}
                  size="small"
                />
              </Tooltip>
            </div>
          }
          bordered
          hoverable
        >
          <Spin spinning={isLoading} tip="加载中...">
            {/* 添加key，当图表大小变化时强制重新渲染内部图表 */}
            <div key={`${config.id}-${config.size}`}>{children}</div>
          </Spin>
        </Card>
      </div>
    </>
  )
}

export default ChartContainer
