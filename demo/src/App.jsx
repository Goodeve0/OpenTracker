import React, { useState, useEffect } from 'react'
import { trackEvent, reportError, reportPerformance, reportBehavior } from '@opentracker/sdk'

function App() {
  const [count, setCount] = useState(0)
  const [sdkStatus, setSdkStatus] = useState('初始化中...')

  useEffect(() => {
    // 模拟页面加载完成事件
    setTimeout(() => {
      setSdkStatus('SDK 初始化完成')
      // 上报页面访问事件
      reportBehavior('pv', {
        page: 'home',
        referrer: document.referrer,
      })
    }, 1000)
  }, [])

  // 测试错误监控
  const testError = () => {
    try {
      // 故意触发一个错误
      throw new Error('测试错误监控')
    } catch (error) {
      // 手动上报错误
      reportError(error, {
        context: '测试错误',
        component: 'App',
      })
      console.log('错误已上报:', error.message)
    }
  }

  // 测试性能监控
  const testPerformance = () => {
    // 模拟性能数据
    const performanceData = {
      loadTime: Math.random() * 2000,
      domContentLoaded: Math.random() * 1000,
      firstPaint: Math.random() * 500,
      firstContentfulPaint: Math.random() * 800,
      largestContentfulPaint: Math.random() * 1500,
    }
    // 上报性能数据
    reportPerformance(performanceData)
    console.log('性能数据已上报:', performanceData)
  }

  // 测试行为监控
  const testBehavior = () => {
    // 上报行为事件
    reportBehavior('click', {
      element: 'test_button',
      action: '测试行为监控',
      timestamp: Date.now(),
    })
    console.log('行为事件已上报')
  }

  // 测试自定义事件
  const testCustomEvent = () => {
    // 上报自定义事件
    trackEvent('custom_event', {
      eventName: '测试自定义事件',
      count: count,
      timestamp: Date.now(),
    })
    console.log('自定义事件已上报')
  }

  return (
    <div className="app">
      <header className="header">
        <h1>OpenTracker 测试 Demo</h1>
        <div className="sdk-status">{sdkStatus}</div>
      </header>

      <main className="main">
        <div className="counter">
          <h2>计数器: {count}</h2>
          <button className="button" onClick={() => setCount(count + 1)}>
            增加计数
          </button>
        </div>

        <div className="test-section">
          <h2>测试功能</h2>
          <div className="button-group">
            <button className="button error" onClick={testError}>
              测试错误监控
            </button>
            <button className="button performance" onClick={testPerformance}>
              测试性能监控
            </button>
            <button className="button behavior" onClick={testBehavior}>
              测试行为监控
            </button>
            <button className="button custom" onClick={testCustomEvent}>
              测试自定义事件
            </button>
          </div>
        </div>

        <div className="info-section">
          <h2>使用说明</h2>
          <ul>
            <li>确保 OpenTracker 服务端已启动（默认端口 3000）</li>
            <li>确保已在后台管理系统中创建了对应的项目（API Key: demo_project_123）</li>
            <li>点击上面的按钮测试各种监控功能</li>
            <li>在浏览器控制台查看上报日志</li>
            <li>在后台管理系统查看监控数据</li>
          </ul>
        </div>

        <div className="api-key-info">
          <h3>项目信息</h3>
          <p>
            <strong>API Key:</strong> demo_project_123
          </p>
          <p>
            <strong>服务端地址:</strong> http://localhost:3000
          </p>
          <p>
            <strong>用户ID:</strong> demo_user_123
          </p>
        </div>
      </main>

      <footer className="footer">
        <p>OpenTracker 测试 Demo &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}

export default App
