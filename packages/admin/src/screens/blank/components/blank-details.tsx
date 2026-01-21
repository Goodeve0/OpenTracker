import React from 'react'
import { Card, Col, Row, Statistic } from 'antd'

const BlankDetail: React.FC = () => {
  return (
    <Card type="inner" title="页面：/admin/1">
      <Row gutter={16}>
        <Col span={12}>
          <Card variant="borderless">
            <Statistic title="白屏数" value={2} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card variant="borderless">
            <Statistic
              title="白屏率"
              value={0.13}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card variant="borderless">
            <Statistic title="影响用户数" value={1} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={12}>
          <Card variant="borderless">
            <Statistic
              title="影响用户率"
              value={0.08}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>
    </Card>
  )
}

export default BlankDetail
