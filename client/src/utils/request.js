import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

// 响应拦截器：自动解包 { code, data, msg }
request.interceptors.response.use(
  (res) => {
    const { code, data, msg } = res.data
    if (code === 200) return data
    return Promise.reject(new Error(msg || '请求失败'))
  },
  (err) => {
    const msg = err.response?.data?.msg || err.message || '网络错误'
    return Promise.reject(new Error(msg))
  }
)

export default request