import axios from 'axios'

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api', // 后端 API 基础地址
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器，添加认证头
apiClient.interceptors.request.use(
  (config) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 错误数据查询接口
export const queryErrorData = async (params: {
  startTime?: number
  endTime?: number
  keyword?: string
  page?: number
  pageSize?: number
}) => {
  try {
    const response = await apiClient.get('/track/query', {
      params: {
        ...params,
        category: 'error', // 固定查询错误数据
      },
    })
    return response.data
  } catch (error) {
    console.error('查询错误数据失败:', error)
    throw error
  }
}

// 性能数据查询接口
export const queryPerformanceData = async (params: {
  startTime?: number
  endTime?: number
  page?: number
  pageSize?: number
}) => {
  try {
    const response = await apiClient.get('/track/query', {
      params: {
        ...params,
        category: 'performance', // 固定查询性能数据
      },
    })
    return response.data
  } catch (error) {
    console.error('查询性能数据失败:', error)
    throw error
  }
}

// 行为数据查询接口
export const queryBehaviorData = async (params: {
  startTime?: number
  endTime?: number
  keyword?: string
  page?: number
  pageSize?: number
}) => {
  try {
    const response = await apiClient.get('/track/query', {
      params: {
        ...params,
        category: 'behavior', // 固定查询行为数据
      },
    })
    return response.data
  } catch (error) {
    console.error('查询行为数据失败:', error)
    throw error
  }
}

// 白屏数据查询接口
export const queryBlankData = async (params: {
  startTime?: number
  endTime?: number
  page?: number
  pageSize?: number
}) => {
  try {
    const response = await apiClient.get('/track/query', {
      params: {
        ...params,
        category: 'blank', // 固定查询白屏数据
      },
    })
    return response.data
  } catch (error) {
    console.error('查询白屏数据失败:', error)
    throw error
  }
}

// 统计数据查询接口
export const queryStatsData = async (params: {
  type: string
  startTime?: number
  endTime?: number
  limit?: number
  page?: number
  pageSize?: number
}) => {
  try {
    const response = await apiClient.get('/stats', {
      params,
    })
    return response.data
  } catch (error) {
    console.error('查询统计数据失败:', error)
    throw error
  }
}
