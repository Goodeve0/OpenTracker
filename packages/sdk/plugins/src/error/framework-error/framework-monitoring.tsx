import React from 'react'
import { reportFrameworkError } from './framework-reporter.js'

interface ErrorBoundaryProps {
  children: React.ReactNode
  report: (data: any) => void
  fallback?: React.ReactNode
}
interface ErrorBoundaryState {
  hasError: boolean
}
export class ReactErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
    }
  }
  static getDerivedStateFromError(_: Error) {
    return { hasError: true }
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { report } = this.props
    if (report) {
      // React 18 typings allow componentStack to be nullish; normalize to empty string
      reportFrameworkError(error, errorInfo.componentStack ?? '', report)
    }
  }
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div
          style={{
            padding: '48px 32px',
            textAlign: 'center',
            background: '#fff',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
          }}
        >
          {/* 红色错误图标 */}
          <div style={{ marginBottom: '24px' }}>
            <svg
              viewBox="64 64 896 896"
              focusable="false"
              data-icon="close-circle"
              width="64px"
              height="64px"
              fill="#ff4d4f"
              aria-hidden="true"
            >
              <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-1.9.7-3.7 1.9-5.2l130.1-155L340.5 359a8.32 8.32 0 01-1.9-5.2c0-4.4 3.6-8 8-8l66.1.3L512 464.6l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 1.9-.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z"></path>
            </svg>
          </div>

          {/* 标题 */}
          <div
            style={{ fontSize: '24px', fontWeight: 500, color: '#000000d9', marginBottom: '16px' }}
          >
            页面遇到了一些问题
          </div>

          {/* 描述 */}
          <div style={{ fontSize: '14px', color: '#00000073', marginBottom: '24px' }}>
            这就尴尬了... 这是一个意料之外的错误。我们已经记录了该问题。
          </div>

          {/* 按钮 */}
          <button
            onClick={() => window.location.reload()}
            style={{
              color: '#fff',
              backgroundColor: '#1890ff',
              border: '1px solid #1890ff',
              padding: '6px 15px',
              fontSize: '14px',
              borderRadius: '2px',
              cursor: 'pointer',
              outline: 'none',
              transition: 'all 0.3s',
            }}
          >
            刷新页面
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
