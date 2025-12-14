## 服务器信息

- 地址: http://123.57.81.94
- 环境: 开发环境
- 认证方式: JWT Token

## 认证流程

1. 注册/登录 → 获取 Token
2. 后续请求 → 在 Header 中添加：`Authorization: Bearer <your_token>`

## 接口列表

### 1. 健康检查

GET /health
GET /

### 2. 用户注册

POST /api/auth/register
请求体:
{
"username": "user",
"password": "123456"
}

响应示例:
{
"code": 200,
"message": "注册成功",
"data": {
"user": {
"id": "2",
"username": "user"
},
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"expiresIn": "7d"
},
"timestamp": "2025-11-20T00:00:00.000Z"
}

### 3. 用户登录

POST /api/auth/login
请求体:
{
"login": "user",
"password": "123456"
}

响应示例:
{
"code": 200,
"message": "登录成功",
"data": {
"user": {
"id": "1",
"username": "user"
},
"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
"expiresIn": "7d"
},
"timestamp": "2025-11-20T00:00:00.000Z"
}

### 4. 获取用户信息

GET /api/profile
请求头：
{
Authorization: Bearer <your_token>
}

响应示例：
{
"code": 200,
"message": "获取个人信息成功",
"data": {
"user": {
"id": "1",
"username": "user"
},
"message": "这是一个受 Token 保护的接口"
},
"timestamp": "2025-11-20T00:00:00.000Z"
}

### 4. 更新用户信息

GET /api/profile
请求头：
{
Authorization: Bearer <your_token>
}

响应示例：
{
"code": 200,
"message": "更新个人信息成功",
"data": {
"user": {
"id": "1",
"username": "user"
},
"updatedAt": "2025-11-20T00:00:00.000Z"
},
"timestamp": "2025-11-20T00:00:00.000Z"
}

### 5.SDK统一上报接口

POST /api/track/report
单条上报：
请求头：
{
"type": "error | performance | behavior | blank",
"data": { ... }
}

响应示例:
{
"code": 200,
"message": "上报成功"
}

批量上报：
[
{
"type": "error",
"data": { ... }
},
{
"type": "behavior",
"data": { ... }
}
]
响应示例：
{
"code": 200,
"message": '批量上报成功',
"count": 2,
}

### 6. 查询接口

GET /api/track/query
请求示例：

带最基础参数：GET /api/track/query?category=error

带分页：GET /api/track/query?category=behavior&page=1&pageSize=20

带时间区间：GET /api/track/query?category=performance&startTime=1732030000000&endTime=1732050000000

带关键字搜索：GET /api/track/query?category=blank&keyword=init

响应示例：
{
"total": 35,
"page": 1,
"pageSize": 20,
"list": [
{
"errorType": "JsError",
"message": "Uncaught ReferenceError: x is not defined",
"stack": "at App.js:12:9",
"time": 1732054321123,
"pageUrl": "",
"userAgent": "Mozilla/5.0 ..."
}
],
"timestamp": "2025-11-20T00:00:00.000Z"
}
