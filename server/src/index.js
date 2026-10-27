require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') })
const app = require('./app')

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🚀 服务启动：http://localhost:${PORT}`)
})
