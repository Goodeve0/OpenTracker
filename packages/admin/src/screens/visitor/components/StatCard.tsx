import React from 'react'
import { Card, Statistic, Tooltip } from 'antd'
import { ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { StatCardProps } from '../../../types/visitor'

// 统计卡片组件
const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit = '',
  rate,
  description,
  color = '#3f8600',
}) => {
  // 安全地格式化值
  const formattedValue = typeof value === 'number' ? value : value || '0'

  return (
    <Card size="small" style={{ height: '100%' }}>
      <Statistic
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{title}</span>
            {description && (
              <Tooltip title={description}>
                <InfoCircleOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
              </Tooltip>
            )}
          </div>
        }
        value={formattedValue}
        precision={rate !== undefined ? 1 : 0}
        valueStyle={{ color }}
        suffix={
          <>
            {unit}
            {rate !== undefined && (
              <span style={{ marginLeft: 4, fontSize: 12 }}>
                ({rate > 0 ? '+' : ''}
                {rate}%)
              </span>
            )}
          </>
        }
        prefix={
          rate !== undefined &&
          (rate > 0 ? (
            <ArrowUpOutlined style={{ color: '#f5222d' }} />
          ) : rate < 0 ? (
            <ArrowDownOutlined style={{ color: '#52c41a' }} />
          ) : null)
        }
      />
    </Card>
  )
}

export default StatCard
