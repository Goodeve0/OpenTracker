import React from 'react'
import { useNavigate } from 'react-router-dom'

const PerformancePage: React.FC = () => {
  const navigate = useNavigate()

  React.useEffect(() => {
    navigate('/home/performance/overview')
  }, [navigate])

  return null
}

export default PerformancePage
