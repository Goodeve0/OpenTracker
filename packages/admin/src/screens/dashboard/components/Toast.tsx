import React from 'react'

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

export default Toast
