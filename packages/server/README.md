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
"username": "user",
"name": "user",
"telephone_number": null,
"gender":null,
"age": null,
"bio":null,
"avatar": null,
"createdAt":"2026-01-09T00:00:00.000Z"
"updatedAt":"2026-01-23T00:00:00.000Z"
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
"username": "user",
"name": "user",
"email": "newemail@example.com",
"telephone_number": "13800138000",
"gender":"男",
"age": 25,
"bio":"这是我的个人简介",
"avatar": null,
"createdAt":"2026-01-09T00:00:00.000Z"
"updatedAt":"2026-01-23T00:00:00.000Z"
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

### 7. 图表数据获取接口

GET /api/stats
请求头：
{
Authorization: Bearer <your_token>,
Content-Type: application/json
}
性能均值：
//响应示例
{
"code": 200,
"message": '获取成功',
"data": {
"loadTime": 1234,
"domReady": 560,
"firstPaint": 430
},
"timestamp": "2026-01-08T09:12:00.000Z"
}
错误Top N：
//响应示例
{
"code": 200,
"message": '获取成功',
"data": [
{ "message": "TypeError: xxx", "count": 42 },
{ "message": "ReferenceError: yyy", "count": 30 }
],
"timestamp": "2026-01-08T09:12:00.000Z"
}
白屏率：
//响应示例
{
"code": 200,
"message": '获取成功',
"data": {
"total": 1200,
"blank": 36,
"rate": 0.03
},
"timestamp": "2026-01-08T09:12:00.000Z"
}
仪表盘聚合数据：
//响应示例
{
"code": 200,
"message": '获取成功',
"data": {
"errorCount": 123,
"blankRate": 0.02,
"avgLoadTime": 1180,
"pv"
},
"timestamp": "2026-01-08T09:12:00.000Z"
}
访问趋势：
//响应示例
{
"code": 200,
"message": '获取成功',
"data": [
{ "date": "2026-01-01", "pv": 320, "uv": 210 },
{ "date": "2026-01-02", "pv": 410, "uv": 260 }
],
"timestamp": "2026-01-08T09:12:00.000Z"
}
访问设备分布：
//响应示例
{
"code": 200,
"message": '获取成功',
"data": [
{ "device": "PC", "count": 3200 },
{ "device": "Mobile", "count": 1800 }
],
"timestamp": "2026-01-08T09:12:00.000Z"
}
用户行为事件统计：
//响应示例
{
"code": 200,
"message": '获取成功',
"data": [
{ "event": "click_login", "count": 230 },
{ "device": "submit_form", "count": 120 }
],
"timestamp": "2026-01-08T09:12:00.000Z"
}
页面访问量：
//响应示例
{
"code": 200,
"message": '获取成功',
"data": [
{ "pageUrl": "/login", "pv": 980 },
{ "pageUrl": "/dashboard", "pv": 1560 }
],
"timestamp": "2026-01-08T09:12:00.000Z"
}
错误趋势：
//响应示例
{
"code": 200,
"message": '获取成功',
"data": [
{ "date": "2026-01-01", "count": 12 },
{ "date": "2026-01-02", "count": 20 }
],
"timestamp": "2026-01-08T09:12:00.000Z"
}
白屏趋势：
//响应示例
{
"code": 200,
"message": '获取成功',
"data": [
{ "date": "2026-01-01", "count": 2 },
{ "date": "2026-01-02", "count": 5 }
],
"timestamp": "2026-01-08T09:12:00.000Z"
}
