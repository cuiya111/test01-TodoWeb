# Todo App 项目说明

基于 Vue 3 + Node.js (Express) 的待办事项应用，支持打包为 Windows EXE 部署。

---

## 一、项目结构

```
bsy-big-screen/
├── client/                    # 前端（Vue 3 + Vite）
│   ├── index.html             # Vite 入口 HTML
│   ├── package.json
│   ├── vite.config.js         # 构建配置（开发代理 + 构建输出路径）
│   ├── public/                # 静态资源（favicon 等）
│   └── src/
│       ├── main.js            # Vue 应用挂载入口
│       ├── App.vue            # 根组件（渲染 TodoApp）
│       ├── style.css          # 全局样式
│       ├── components/
│       │   └── TodoApp.vue    # 核心业务组件（列表/新增/删除/切换完成）
│       ├── api/
│       │   └── todo.js        # 所有后端接口定义
│       └── utils/
│           └── request.js     # axios 实例 + 响应拦截器
│
├── server/                    # 后端（Express 5）
    ├── .env                   # 环境变量（DB 连接信息 + 服务端口）
    ├── package.json
    ├── db.sql                 # 建库建表 SQL
    ├── dist/                  # 打包产物目录
    │   ├── server.exe         # pkg 打包后的后端可执行文件
    │   └── web/               # 前端构建产物（vite build 输出）
    └── src/
       ├── index.js           # 启动入口（加载 .env + 启动服务）
        ├── app.js             # Express 应用（路由注册 + 静态文件托管）
        ├── db.js              # MySQL 连接池 + 连接测试
        └── api/
            └── todo.js        # 待办 CRUD 路由
 
```

---

## 二、前端（client/）

### 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.x | 组合式 API（`<script setup>`） |
| Vite | 8.x | 开发服务器 + 构建工具 |
| Axios | 1.x | HTTP 客户端 |

### 文件说明

#### `main.js` — 应用挂载
```js
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
createApp(App).mount('#app')
```
创建 Vue 应用实例，挂载到 `index.html` 中的 `#app` 元素。

#### `App.vue` — 根组件
仅渲染 `<TodoApp />`，无额外逻辑。

#### `TodoApp.vue` — 核心业务组件
- **数据**：`list`（待办数组）、`value`（输入框内容）、`loading`
- **方法**：
  - `getList()` — 获取所有待办（`onMounted` 时调用）
  - `add()` — 新增待办
  - `update(item)` — 切换完成状态（原子翻转 0�1）
  - `del(item)` — 删除待办
- **模板**：输入框 + Add 按钮 + 待办列表（checkbox + 删除按钮）

#### `utils/request.js` — axios 封装
```js
const request = axios.create({
  baseURL: '/api',   // 统一前缀，拼接后实际请求如 /api/todo
  timeout: 10000,
})
```
- **响应拦截器**：自动解包后端返回的 `{ code, data, msg }` 格式
  - `code === 200` → 直接返回 `data`
  - 其他 → `Promise.reject(new Error(msg))`

#### `api/todo.js` — 接口定义
```js
export function getAllTodos()        { return request.get('/todo') }
export function addTodo(data)        { return request.post('/todo', data) }
export function updateTodo(id)       { return request.put('/todo/:id') }
export function deleteTodo(id)       { return request.delete('/todo/:id') }
```

### 开发环境

```bash
cd client
npm install
npm run dev        # 启动 Vite 开发服务器（默认端口 5173）
```

开发时 Vite 的代理配置（`vite.config.js`）会将 `/api` 请求转发到 `http://localhost:8080`：

```js
server: {
  proxy: {
    '/api': 'http://localhost:8080'
  }
}
```

访问 `http://localhost:5173` 即可。

---

## 三、后端（server/）

### 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | 18+ | 运行时 |
| Express | 5.x | Web 框架 |
| mysql2 | 3.x | MySQL 驱动（Promise API） |
| cors | 2.x | 跨域支持 |
| dotenv | 18.x | 环境变量加载 |
| pkg (@yao-pkg) | 5.x | 打包为 EXE |

### 文件说明

#### `src/index.js` — 启动入口
```js
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') })
const app = require('./app')
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 服务启动：http://localhost:${PORT}`)
})
```
- 使用 `process.cwd()` 加载 `.env`（兼容 EXE 打包场景，`__dirname` 在 pkg 中指向虚拟快照目录）
- 从环境变量读取端口（默认 3000，`.env` 中配置为 8080）

#### `src/db.js` — MySQL 连接池
```js
const pool = mysql.createPool({
  host: process.env.DB_HOST,        // localhost
  port: process.env.DB_PORT,        // 3306
  user: process.env.DB_USER,        // root
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,// my_todolist
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})
```
- 创建连接池，所有路由共享
- 启动时执行一次连接测试，日志输出成功/失败

#### `src/app.js` — Express 应用
```js
app.use(cors())                    // 跨域
app.use(express.json())            // JSON 请求体解析

app.use('/api/todo', todoRouter)   // 注册待办路由

// 生产环境：托管前端静态文件
const webDir = path.resolve(process.cwd(), 'dist', 'web')
if (fs.existsSync(webDir)) {
  app.use(express.static(webDir))  // 静态文件
  // SPA 回退：非 /api 请求 → index.html
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(webDir, 'index.html'))
  })
}
```

**请求处理优先级**（由上到下）：
1. `cors()` → 处理跨域头
2. `express.json()` → 解析 JSON body
3. `/api/todo/*` → 路由到 `todoRouter`
4. 静态文件 → 从 `dist/web/` 返回 HTML/JS/CSS
5. SPA 回退 → 其余 GET 请求返回 `index.html`

#### `src/api/todo.js` — 待办路由
| 路由 | 方法 | 说明 |
|------|------|------|
| `/todo` | GET | 查询全部待办（按 id 降序） |
| `/todo` | POST | 新增待办，body: `{ text }` |
| `/todo/:id` | PUT | 切换完成状态，参数id   |
| `/todo/:id` | DELETE | 删除待办，参数id   |

所有 SQL 使用参数化查询（`?` 占位符），防 SQL 注入。

### 数据库

`db.sql` 建库建表：
```sql
CREATE DATABASE my_todolist;
USE my_todolist;
CREATE TABLE todo (
  id INT PRIMARY KEY AUTO_INCREMENT,
  isCompleted TINYINT(1) NOT NULL DEFAULT 0,
  text VARCHAR(500) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 环境变量（.env）

```ini
DB_HOST=localhost
DB_PORT=3306
DB_USER=用户名
DB_PASSWORD=密码
DB_DATABASE=my_todolist
PORT=8080
```

### 开发运行

```bash
cd server
npm install
npm run dev        # 等同于 node src/index.js
```

---

## 四、前后端连接机制

### 请求链路

```
浏览器
  │
  │  GET http://localhost:8080/
  ▼
Express (app.js)
  │
  ├── express.static(webDir) → 返回 index.html
  │
  浏览器加载 index.html 中的 /assets/index-xxx.js
  │
  │  GET http://localhost:8080/assets/index-xxx.js
  ▼
Express (app.js)
  │
  ├── express.static(webDir) → 返回 JS 文件
  │
  JS 执行后发起 API 请求
  │
  │  GET http://localhost:8080/api/todo
  ▼
Express (app.js)
  │
  ├── app.use('/api/todo', todoRouter) 匹配
  ▼
todoRouter (todo.js)
  │
  ├── router.get('/getAllTodos')
  │     → pool.query('SELECT * FROM todo ORDER BY id DESC')
  │     → res.json({ code: 200, data: [...] })
```

### 开发时的代理链路

```
浏览器 (localhost:5173)
  │
  │  GET http://localhost:5173/api/todo
  ▼
Vite Dev Server (5173)
  │
  │  proxy: '/api' → 'http://localhost:8080'
  ▼
Express (8080)
  │
  ├── /api/todo 路由匹配
  ▼
返回 JSON
```

### 生产时的链路（同域）

生产环境中前端静态文件由 Express 直接托管，前后端在同一域名同一端口（8080），**无跨域问题**。

```
浏览器
  │
  │  GET http://localhost:8080/          → index.html
  │  GET http://localhost:8080/assets/... → JS/CSS
  │  GET http://localhost:8080/api/todo/... → JSON
  ▼
同一个 Express 服务（端口 8080）
```

---

## 五、接口说明

统一返回格式：
```json
{ "code": 200, "data": {}, "msg": "" }
```

### 1. 获取所有待办

```
GET /api/todo
```

**响应 200：**
```json
{
  "code": 200,
  "data": [
    { "id": 1, "isCompleted": 0, "text": "学习 Vue" },
    { "id": 2, "isCompleted": 1, "text": "写报告" }
  ]
}
```

### 2. 新增待办

```
POST /api/todo
```

**请求体：**
```json
{ "text": "学习 Vue" }
```

**响应 200：**
```json
{ "code": 200, "data": { "id": 1, "isCompleted": 0, "text": "学习 Vue" } }
```

**响应 400（text 为空）：**
```json
{ "code": 400, "msg": "待办内容不能为空" }
```


### 3. 切换完成状态

```
PUT /api/todo/:id
```
> 后端执行 `UPDATE todo SET isCompleted = 1 - isCompleted WHERE id = ?`，原子翻转。


**响应 200：**
```json
{ "code": 200, "data": { "id": 1, "isCompleted": 1, "text": "学习 Vue" } }
```

**响应 400（id 非法）：**
```json
{ "code": 400, "msg": "参数错误：id 必须为正整数" }
```

**响应 404（id 不存在）：**
```json
{ "code": 404, "msg": "待办不存在" }
```

### 4. 删除待办

```
DELETE /api/todo/:id
```

**响应 200：**
```json
{ "code": 200, "data": { "id": 1 } }
```

**响应 400（id 非法）：**
```json
{ "code": 400, "msg": "参数错误：id 必须为正整数" }
```

**响应 404（id 不存在）：**
```json
{ "code": 404, "msg": "待办不存在" }
```

### 错误码

| HTTP 状态码 | code | 说明 |
|------------|------|------|
| 400 | 400 | 参数错误（空内容 / 非法 id） |
| 404 | 404 | 记录不存在 |
| 500 | 500 | 服务器内部错误（`msg` 含 MySQL 错误详情） |

---

## 六、打包部署

### 6.1 打包步骤

```bash
# ========== 第一步：构建前端 ==========
cd client
npm install
npm run build
# 产物输出到：../server/dist/web/（由 vite.config.js 的 outDir 决定）

# ========== 第二步：打包后端 EXE ==========
cd ../server
npm install
npm run pkg
# 产物输出到：dist/server.exe（target: node18-win-x64）
```

### 6.2 部署目录结构

将 `server/dist/` 下的文件整理到部署目录：

```
部署目录/
├── server.exe           # 后端可执行文件
├── .env                 # 环境变量（必须与 exe 同级）
├── db.sql               # 数据库脚本（首次部署用）
└── dist/
    └── web/             # 前端构建产物
        ├── index.html
        ├── favicon.svg
        �── assets/
            ├── index-xxx.js
            └── index-xxx.css
```

> **关键**：`.env` 和 `dist/web/` 必须放在 `server.exe` **同级目录**下，因为代码使用 `process.cwd()` 定位这些文件。

### 6.3 目标机器准备

1. **安装 MySQL**：
```sql
-- 执行 db.sql
source db.sql;
-- 或手动：
-- CREATE DATABASE my_todolist;
-- USE my_todolist;
-- （创建 todo 表，见 db.sql）
```

2. **修改 `.env`** 中的数据库连接信息（如用户名、密码、端口）。

3. **防火墙**：放行 8080 端口（或修改 `.env` 中的 `PORT`）。

### 6.4 启动与验证

```bash
# 双击 server.exe 或在终端执行
./server.exe
```

**预期控制台输出：**
```
📄 静态文件目录： C:\部署目录\dist\web
🚀 服务启动：http://localhost:8080
✅ MySQL 连接成功
```

**验证：**
1. 浏览器访问 `http://localhost:8080` → 显示 Todo App
2. 新增一条待办 → 刷新页面后数据仍在（MySQL 持久化）
3. 切换完成/删除 → 正常响应

### 6.5 常见问题排查

| 现象 | 原因 | 解决 |
|------|------|------|
| `injected env (0)` | `.env` 未放在 exe 同级目录 | 将 `.env` 移动到 `server.exe` 所在目录 |
| `未找到 web 目录` | `dist/web/` 未放行或路径不对 | 确保 `dist/web/` 在 exe 同级目录下 |
| `MySQL 连接失败：Access denied` | `.env` 中数据库账号密码错误 | 修改 `.env` 的 `DB_USER` / `DB_PASSWORD` |
| `MySQL 连接失败：ECONNREFUSED` | MySQL 未启动或端口不对 | 启动 MySQL，确认 `DB_PORT` |
| 页面 404 | SPA 回退未匹配根路径 | 检查 `app.js` 中的正则是否为 `/^(?!\/api).*/` |
| 端口 3000 而非 8080 | `.env` 未加载成功 | 确认 `.env` 在 exe 同级目录 |

### 6.6 更新部署

1. 本地重新执行 `npm run build`（前端）+ `npm run pkg`（后端）
2. 用新的 `server.exe` 覆盖部署目录中的旧文件
3. 用新的 `dist/web/` 覆盖旧的前端产物
4. 重启 `server.exe`

---

## 七、技术要点

### Express 5 兼容性

- **ESM vs CJS**：本项目后端使用 CommonJS（`require/module.exports`）
- **路径语法变更**：Express 5 不再支持 `app.get('*')`，需使用正则或 `/{*splat}`
- **本项目的 SPA 回退方案**：`app.get(/^(?!\/api).*/, ...)` 用负向前瞻排除 `/api` 路径

### pkg 打包注意事项

- `__dirname` 在 pkg 中指向**虚拟快照目录**（`C:\snapshot\...`），不是 exe 实际所在目录
- 因此所有路径解析统一使用 `process.cwd()`（exe 运行时的工作目录）
- `.env` 和 `dist/web/` 必须放在 exe **同级目录**，不能打包进 exe 内部
- pkg 目标为 `node18-win-x64`，其他平台需修改 `--targets` 参数

### 前端构建输出路径

`vite.config.js` 中配置：
```js
build: {
  outDir: path.resolve(import.meta.dirname, '../server/dist/web'),
  emptyOutDir: true
}
```
- 构建产物直接输出到 `server/dist/web/`
- `emptyOutDir: true` 确保每次构建清除旧产物
- `import.meta.dirname` 是 Node 18+/Vite 8 推荐的目录获取方式（替代 `__dirname`）

### 数据库安全

- 所有 SQL 使用参数化查询（`?` 占位符 + 参数数组），防 SQL 注入
- `updateTodo` 使用 `1 - isCompleted` 原子翻转，避免先查后改的并发竞态
- 参数校验在前端拦截之前也做了后端二次校验（id 必须为正整数）
