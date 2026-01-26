import React from 'react'
import { useNavigate } from 'react-router-dom'

const BlankScreen: React.FC = () => {
  const navigate = useNavigate()

  React.useEffect(() => {
    navigate('/home/blank/analysis')
  }, [navigate])

  return null
}

export default BlankScreen
