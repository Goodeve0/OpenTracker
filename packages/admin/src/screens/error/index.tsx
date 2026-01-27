import React from 'react'
import { useNavigate } from 'react-router-dom'

const ErrorIndex: React.FC = () => {
  const navigate = useNavigate()

  React.useEffect(() => {
    navigate('/home/error/logs')
  }, [navigate])

  return null
}

export default ErrorIndex
