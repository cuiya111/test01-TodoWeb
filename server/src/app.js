const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const todoRouter = require('./api/todo')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/todo', todoRouter)

// 打包部署时，去掉dist 目录const webDir = path.resolve(process.cwd(),'web')
// 生产环境：托管前端静态文件（client/dist 打包后放到 server/dist/web） 'dist',
const webDir = path.resolve(process.cwd(), 'web')
if (fs.existsSync(webDir)) {
  console.log('📄 静态文件目录：', webDir)
  app.use(express.static(webDir))
  // SPA 回退：非 /api 请求均返回 index.html（Express 5 写法，不带尾斜杠避免首段冲突）
  app.get(/^(?!\/api\$).*/, (req, res, next) => {
    res.sendFile(path.join(webDir, 'index.html'))
  })
} else {
  console.log('�️ 未找到 web 目录：' + webDir + '，跳过静态文件托管')
}

module.exports = app
