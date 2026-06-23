# CitrusAgent API 接口文档

> 本文档详细描述 CitrusAgent 后端 V1 版本全部 HTTP 接口，供前端联调与第三方对接使用。
> 接口源码位于 [src/citrus_agent/api/v1/](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/api/v1)。

---

## 一、概览

### 1.1 基础信息

| 项目 | 说明 |
|------|------|
| 服务名称 | CitrusAgent（Orange-RAG） |
| 版本 | 0.1.0 |
| Base URL | `http://localhost:8000` |
| 接口前缀 | `/api/v1` |
| 默认端口 | 8000 |
| 接口风格 | RESTful + SSE 流式 |
| 数据格式 | JSON（`application/json`）/ `multipart/form-data`（文件上传） |
| 字符编码 | UTF-8 |
| 交互文档 | Swagger：`http://localhost:8000/docs` ；ReDoc：`http://localhost:8000/redoc` |

### 1.2 模块总览

| 模块 | 路由前缀 | 标签 | 源文件 |
|------|----------|------|--------|
| 认证 | `/api/v1/auth` | 认证 | [auth.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/api/v1/auth.py) |
| 对话问答 | `/api/v1/chat` | chat | [chat.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/api/v1/chat.py) |
| 知识库管理 | `/api/v1/knowledge` | 知识库管理 | [knowledge.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/api/v1/knowledge.py) |
| 果蔬档案管理 | `/api/v1/plants` | 果蔬档案管理 | [product.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/api/v1/product.py) |
| 工具调用 | `/api/v1/tools` | 工具调用 | [tool.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/api/v1/tool.py) |
| 管理后台 | `/api/v1/admin` | 管理后台 | [admin.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/api/v1/admin.py) |

> **注意（对话模块路径）**：[chat.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/api/v1/chat.py) 中路由前缀写为 `settings.api_v1_prefix + "/chat"`，而 [main.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/main.py) 又在外层统一加了 `settings.API_PREFIX`（`/api/v1`），导致对话接口实际访问路径为 `/api/v1/api/v1/chat/{general|agri|diagnose}`（双重前缀）。本文档按"标准预期路径" `/api/v1/chat/...` 描述，联调时如遇 404，请改用双重前缀路径或修复 chat.py 中的前缀定义。

### 1.3 统一响应格式

所有非流式接口统一使用 `ResponseBase` 包装；分页接口使用 `PaginatedResponse`。定义见 [common.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/common/common.py)。

**ResponseBase**

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 业务状态码，200 表示成功 |
| message | string | 状态信息 |
| data | any | 响应数据，失败时为 null |

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

**PaginatedResponse**

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 业务状态码 |
| message | string | 状态信息 |
| data | array | 当前页数据列表 |
| pagination | object | 分页元数据 |

**pagination**

| 字段 | 类型 | 说明 |
|------|------|------|
| total | int | 总记录数 |
| page | int | 当前页码 |
| page_size | int | 每页数量 |
| total_pages | int | 总页数 |

```json
{
  "code": 200,
  "message": "success",
  "data": [],
  "pagination": {
    "total": 100,
    "page": 1,
    "page_size": 20,
    "total_pages": 5
  }
}
```

### 1.4 业务状态码

| code | HTTP 状态 | 说明 |
|------|-----------|------|
| 200 | 200 | 成功 |
| 400 | 200 | 请求参数错误 / 业务校验失败（如旧密码错误、用户名已存在） |
| 401 | 200 | 未认证或认证失败（登录失败、token 无效） |
| 403 | 200 | 无权限执行此操作 |
| 404 | 200 | 资源不存在 |
| 500 | 200 | 服务器内部错误 |

> 说明：除工具执行接口抛出标准 HTTPException（404/500）外，其余接口的业务错误均通过 `code` 字段在 HTTP 200 响应体内返回，前端需依据 `code` 判断结果。

### 1.5 认证机制

- 认证方式：JWT Bearer Token
- 请求头：`Authorization: Bearer <access_token>`
- Token 有效期：默认 24 小时（`JWT_ACCESS_TOKEN_EXPIRE_MINUTES`）
- Token 载荷：`{ "sub": 用户ID, "username": 用户名, "role": 角色, "exp": 过期时间 }`
- 角色层级：admin(3) > user(2) > guest(1)

登录流程：

```
1. GET  /api/v1/auth/captcha       → 获取 captcha_id + 验证码图片(Base64)
2. POST /api/v1/auth/login         → 提交 用户名+密码+验证码 → 返回 access_token
3. 后续请求 Header: Authorization: Bearer <access_token>
```

### 1.6 通用错误响应

未携带或携带无效 Token 访问受保护接口时返回：

```json
{
  "detail": "未提供认证凭据"
}
```

HTTP 状态码 401，响应头包含 `WWW-Authenticate: Bearer`。

---

## 二、认证模块（/auth）

源文件：[auth.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/api/v1/auth.py)
Schema 定义：[db/auth.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/db/auth.py)

### 2.1 获取图形验证码

获取登录用的图形验证码，返回验证码 ID 与 Base64 图片。

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 路径 | `/api/v1/auth/captcha` |
| 认证 | 否 |
| 响应模型 | ResponseBase |

**响应 data 字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| captcha_id | string | 验证码 ID，登录时需原样传回 |
| captcha_image | string | 验证码图片 Base64 编码（PNG） |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "captcha_id": "a1b2c3d4e5f6...",
    "captcha_image": "iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

> 验证码有效期默认 300 秒（5 分钟），验证后立即失效（一次性）。

---

### 2.2 用户登录

校验验证码与用户名密码，签发 JWT Token。

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/auth/login` |
| 认证 | 否 |
| Content-Type | `application/json` |
| 响应模型 | ResponseBase |

**请求体（LoginRequest）**

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| username | string | 是 | 1-100 字符 | 用户名 |
| password | string | 是 | 1-128 字符 | 明文密码 |
| captcha_id | string | 是 | - | 验证码 ID |
| captcha_code | string | 是 | 1-10 字符 | 验证码（不区分大小写） |

**请求示例**

```json
{
  "username": "admin",
  "password": "admin123",
  "captcha_id": "a1b2c3d4e5f6...",
  "captcha_code": "AB3D"
}
```

**成功响应 data 字段（TokenResponse）**

| 字段 | 类型 | 说明 |
|------|------|------|
| access_token | string | JWT 访问令牌 |
| token_type | string | Token 类型，固定为 `bearer` |
| expires_in | int | Token 有效期（秒），默认 86400 |
| user_info | object | 用户信息 |

**user_info 字段（UserInfoResponse）**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 用户 ID |
| username | string | 用户名 |
| nickname | string\|null | 昵称 |
| role | string | 角色：admin / user / guest |
| is_active | bool | 是否启用 |

**成功响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 86400,
    "user_info": {
      "id": 1,
      "username": "admin",
      "nickname": "系统管理员",
      "role": "admin",
      "is_active": true
    }
  }
}
```

**失败响应**

| code | message | 触发条件 |
|------|---------|----------|
| 401 | 验证码错误或已过期 | captcha_id 不存在 / 已过期 / 验证码不匹配 |
| 401 | 用户名或密码错误 | 用户不存在 / 密码错误 / 用户被禁用 |

```json
{
  "code": 401,
  "message": "用户名或密码错误",
  "data": null
}
```

---

### 2.3 获取当前用户信息

获取当前登录用户的详细信息。

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 路径 | `/api/v1/auth/me` |
| 认证 | 是 |
| 响应模型 | ResponseBase |

**请求头**

```
Authorization: Bearer <access_token>
```

**响应 data 字段（UserInfoResponse）**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 用户 ID |
| username | string | 用户名 |
| nickname | string\|null | 昵称 |
| role | string | 角色 |
| is_active | bool | 是否启用 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "username": "admin",
    "nickname": "系统管理员",
    "role": "admin",
    "is_active": true
  }
}
```

---

### 2.4 修改密码

修改当前登录用户的密码，需先验证旧密码。

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/auth/change-password` |
| 认证 | 是 |
| Content-Type | `application/json` |
| 响应模型 | ResponseBase |

**请求体（ChangePasswordRequest）**

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| old_password | string | 是 | ≥1 字符 | 旧密码 |
| new_password | string | 是 | 6-128 字符 | 新密码 |

**请求示例**

```json
{
  "old_password": "admin123",
  "new_password": "newPass456"
}
```

**成功响应**

```json
{
  "code": 200,
  "message": "密码修改成功",
  "data": null
}
```

**失败响应**

| code | message | 触发条件 |
|------|---------|----------|
| 400 | 旧密码错误 | old_password 与数据库不匹配 |

---

### 2.5 创建用户（预留）

创建新用户，仅 admin 角色可调用。

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/auth/users` |
| 认证 | 是（需 admin 角色） |
| Content-Type | `application/json` |
| 响应模型 | ResponseBase |

**请求体（UserCreateRequest）**

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| username | string | 是 | 1-100 字符 | 用户名 |
| password | string | 是 | 6-128 字符 | 明文密码 |
| nickname | string\|null | 否 | - | 昵称 |
| role | string | 否 | 默认 `user` | 角色：admin / user / guest |

**请求示例**

```json
{
  "username": "zhangsan",
  "password": "zhang123456",
  "nickname": "张三",
  "role": "user"
}
```

**成功响应 data 字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 新用户 ID |
| username | string | 用户名 |
| role | string | 角色 |

**成功响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 2,
    "username": "zhangsan",
    "role": "user"
  }
}
```

**失败响应**

| code | message | 触发条件 |
|------|---------|----------|
| 403 | 无权限执行此操作 | 当前用户非 admin 角色 |
| 400 | 用户名已存在 | username 已被注册 |

---

## 三、对话问答模块（/chat）

源文件：[chat.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/api/v1/chat.py)

本模块提供三个独立的 SSE 流式问答入口，分别对应不同 AI 助手身份与 Prompt 模板。所有接口均返回 `text/event-stream` 流式响应。

### 3.1 通用问答

YAGO intellect 通用问答助手，面向农业科研与日常咨询。

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/chat/general` |
| 认证 | 否 |
| Content-Type | `application/json` |
| 响应类型 | SSE 流式（`text/event-stream`） |

### 3.2 农业知识库问答

YAGO intellect 农业知识 AI 助手，专注柑橘及农业知识库精准问答。

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/chat/agri` |
| 认证 | 否 |
| Content-Type | `application/json` |
| 响应类型 | SSE 流式 |

### 3.3 病虫害诊断

YAGO intellect 病虫害诊断助手，面向病虫害识别、诊断与防治建议。

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/chat/diagnose` |
| 认证 | 否 |
| Content-Type | `application/json` |
| 响应类型 | SSE 流式 |

### 3.4 三个接口通用说明

**请求体（ChatRequest）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| question | string | 是 | 用户问题，最小长度 1 |
| kb_id | int\|null | 否 | 手动指定知识库 ID；不为空时跳过意图判断直接检索该知识库 |

**请求示例**

```json
{
  "question": "砂糖橘溃疡病怎么防？",
  "kb_id": null
}
```

**处理流程**

```
用户提问
 ├─ kb_id 不为空 → 直接检索指定知识库
 └─ kb_id 为空   → 调用意图路由器(IntentRouter)判断
                   → 返回 { need_rag, kb_id, reasoning }
                   → need_rag=true 且 kb_id 有效 → 检索对应知识库
                   → 否则不检索，直接对话

有检索结果 → 使用 RAG Prompt（含知识片段）+ LLM 流式生成
无检索结果 → 使用 Direct Prompt（无知识片段）+ LLM 流式生成

SSE 流式输出
```

**SSE 响应格式**

流式输出由若干文本增量事件和一个结束事件组成：

1. 文本增量事件（可重复多次）

```
data: {"delta": "文本片段"}\n\n
```

2. 结束事件（仅一次，位于流末尾）

```
data: {"delta": "", "done": true, "from_knowledge_base": true, "kb_id": 3, "reasoning": "意图判断说明"}\n\n
```

**结束事件字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| delta | string | 固定为空字符串 |
| done | bool | 固定为 true，标识流结束 |
| from_knowledge_base | bool | 本次回答是否基于知识库检索 |
| reasoning | string | 意图判断的推理说明 |
| kb_id | int | 可选，实际检索的知识库 ID（仅检索时返回） |

**SSE 响应示例**

```
data: {"delta": "砂糖橘溃疡病"}

data: {"delta": "的防治应遵循"}

data: {"delta": "综合防治策略"}

data: {"delta": "", "done": true, "from_knowledge_base": true, "kb_id": 2, "reasoning": "检测到病虫害相关关键词，路由至农业知识库"}
```

> **输出格式约束**：回答使用 HTML 标签输出（`<p>` 段落、`<b>` 加粗、`<ul>/<li>` 列表），严禁输出 Markdown 语法。

---

## 四、知识库管理模块（/knowledge）

源文件：[knowledge.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/api/v1/knowledge.py)
Schema 定义：[db/knowledge.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/db/knowledge.py)

### 4.1 创建知识库

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/knowledge/bases` |
| 认证 | 否 |
| Content-Type | `multipart/form-data` |
| 响应模型 | ResponseBase |

**请求参数（Form 表单）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 知识库名称 |
| description | string\|null | 否 | 描述 |
| icon | string\|null | 否 | 图标标识 |

**响应 data 字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 知识库 ID |
| name | string | 名称 |
| description | string\|null | 描述 |
| icon | string\|null | 图标 |
| is_active | bool | 是否启用 |
| created_at | string\|null | 创建时间（ISO 8601） |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "柑橘种植知识库",
    "description": "柑橘栽培管理技术",
    "icon": "orange",
    "is_active": true,
    "created_at": "2026-06-18T10:00:00"
  }
}
```

---

### 4.2 获取知识库列表

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 路径 | `/api/v1/knowledge/bases` |
| 认证 | 否 |
| 响应模型 | PaginatedResponse |

**查询参数**

| 字段 | 类型 | 必填 | 默认 | 约束 | 说明 |
|------|------|------|------|------|------|
| page | int | 否 | 1 | ≥1 | 页码 |
| page_size | int | 否 | 20 | 1-100 | 每页数量 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "柑橘种植知识库",
      "description": "柑橘栽培管理技术",
      "icon": "orange",
      "is_active": true,
      "created_at": "2026-06-18T10:00:00"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "page_size": 20,
    "total_pages": 1
  }
}
```

---

### 4.3 删除知识库

删除知识库及其所有文档与向量数据。

| 项目 | 说明 |
|------|------|
| 方法 | `DELETE` |
| 路径 | `/api/v1/knowledge/bases/{kb_id}` |
| 认证 | 否 |
| 响应模型 | ResponseBase |

**路径参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| kb_id | int | 知识库 ID |

**成功响应**

```json
{
  "code": 200,
  "message": "知识库已删除",
  "data": null
}
```

**失败响应**

| code | message | 触发条件 |
|------|---------|----------|
| 404 | 知识库不存在 | kb_id 无效 |

---

### 4.4 上传文档到知识库

上传文档，自动解析、切片、向量化并写入 Qdrant。

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/knowledge/upload` |
| 认证 | 否 |
| Content-Type | `multipart/form-data` |
| 响应模型 | ResponseBase |

**请求参数（Form 表单）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | file | 是 | 上传的文件 |
| kb_id | int | 是 | 所属知识库 ID |
| title | string | 是 | 文档标题 |
| source_type | string | 否 | 来源类型，默认 `general`。可选：general / literature / policy / structured / external |
| description | string\|null | 否 | 文档描述 |
| tags | string | 否 | 标签，逗号分隔（如 `柑橘,施肥`） |

**支持的文件类型**

`.pdf`、`.docx`、`.xlsx`、`.csv`、`.md`、`.txt`

**响应 data 字段（KnowledgeDocumentResponse）**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 文档 ID |
| kb_id | int\|null | 所属知识库 ID |
| title | string | 文档标题 |
| source_type | string | 来源类型 |
| description | string\|null | 描述 |
| tags | array | 标签列表 |
| chunk_count | int | 切片数量 |
| file_name | string\|null | 原始文件名 |
| status | string | 状态：pending / processing / ready / failed |
| error_message | string\|null | 错误信息 |
| created_at | string | 创建时间 |
| updated_at | string\|null | 更新时间 |

**成功响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "doc_001",
    "kb_id": 1,
    "title": "砂糖橘溃疡病防治手册",
    "source_type": "literature",
    "description": "溃疡病综合防治技术",
    "tags": ["柑橘", "病害"],
    "chunk_count": 12,
    "file_name": "溃疡病防治.pdf",
    "status": "ready",
    "error_message": null,
    "created_at": "2026-06-18T10:00:00",
    "updated_at": "2026-06-18T10:01:30"
  }
}
```

**失败响应**

| code | message | 触发条件 |
|------|---------|----------|
| 400 | 不支持的文件类型: .xxx | 文件扩展名不在允许列表 |
| 400 | （校验错误信息） | 文档校验失败（如知识库不存在） |
| 500 | 文档上传失败: ... | 服务器内部错误 |

**请求示例（curl）**

```bash
curl -X POST http://localhost:8000/api/v1/knowledge/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/document.pdf" \
  -F "kb_id=1" \
  -F "title=砂糖橘溃疡病防治手册" \
  -F "source_type=literature" \
  -F "tags=柑橘,病害"
```

---

### 4.5 知识库语义检索

基于向量相似度搜索相关文档切片。

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/knowledge/search` |
| 认证 | 否 |
| Content-Type | `application/json` |
| 响应模型 | ResponseBase |

**请求体（KnowledgeSearchRequest）**

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| query | string | 是 | ≥1 字符 | 检索查询文本 |
| top_k | int | 否 | 1-20，默认 5 | 返回结果数量 |
| kb_id | int\|null | 否 | - | 限定知识库 ID，避免跨库串数据 |
| source_type | string\|null | 否 | - | 按来源类型过滤 |
| tags | array\|null | 否 | - | 按标签过滤 |

**请求示例**

```json
{
  "query": "溃疡病防治方法",
  "top_k": 5,
  "kb_id": 1
}
```

**响应 data 字段（KnowledgeSearchResult 数组）**

| 字段 | 类型 | 说明 |
|------|------|------|
| chunk_id | string | 切片 ID |
| content | string | 切片内容 |
| score | float | 相似度分数 |
| document_id | string | 所属文档 ID |
| document_title | string | 所属文档标题 |
| source_type | string | 来源类型 |
| metadata | object | 元数据 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "chunk_id": "1:doc_001:0:abc123",
      "content": "柑橘溃疡病由黄单胞菌引起...",
      "score": 0.89,
      "document_id": "doc_001",
      "document_title": "砂糖橘溃疡病防治手册",
      "source_type": "literature",
      "metadata": {}
    }
  ]
}
```

---

### 4.6 获取文档列表

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 路径 | `/api/v1/knowledge/documents` |
| 认证 | 否 |
| 响应模型 | PaginatedResponse |

**查询参数**

| 字段 | 类型 | 必填 | 默认 | 约束 | 说明 |
|------|------|------|------|------|------|
| kb_id | int\|null | 否 | - | - | 按知识库 ID 过滤 |
| source_type | string\|null | 否 | - | - | 按来源类型过滤 |
| page | int | 否 | 1 | ≥1 | 页码 |
| page_size | int | 否 | 20 | 1-100 | 每页数量 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "doc_001",
      "kb_id": 1,
      "title": "砂糖橘溃疡病防治手册",
      "source_type": "literature",
      "description": "溃疡病综合防治技术",
      "tags": ["柑橘", "病害"],
      "chunk_count": 12,
      "file_name": "溃疡病防治.pdf",
      "status": "ready",
      "error_message": null,
      "created_at": "2026-06-18T10:00:00",
      "updated_at": "2026-06-18T10:01:30"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "page_size": 20,
    "total_pages": 1
  }
}
```

---

### 4.7 获取文档详情

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 路径 | `/api/v1/knowledge/documents/{doc_id}` |
| 认证 | 否 |
| 响应模型 | ResponseBase |

**路径参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| doc_id | int | 文档 ID |

**失败响应**

| code | message | 触发条件 |
|------|---------|----------|
| 404 | 文档不存在 | doc_id 无效 |

---

### 4.8 更新文档信息

更新文档元数据（标题、描述、标签），不影响已入库的向量。

| 项目 | 说明 |
|------|------|
| 方法 | `PUT` |
| 路径 | `/api/v1/knowledge/documents/{doc_id}` |
| 认证 | 否 |
| Content-Type | `application/json` |
| 响应模型 | ResponseBase |

**路径参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| doc_id | int | 文档 ID |

**请求体（KnowledgeDocumentUpdate）**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string\|null | 否 | 文档标题 |
| description | string\|null | 否 | 文档描述 |
| tags | array\|null | 否 | 标签列表 |

**请求示例**

```json
{
  "title": "更新后的标题",
  "description": "更新后的描述",
  "tags": ["柑橘", "更新"]
}
```

**失败响应**

| code | message | 触发条件 |
|------|---------|----------|
| 404 | 文档不存在 | doc_id 无效 |

---

### 4.9 删除文档

删除文档及其所有切片（含向量数据与磁盘文件）。

| 项目 | 说明 |
|------|------|
| 方法 | `DELETE` |
| 路径 | `/api/v1/knowledge/documents/{doc_id}` |
| 认证 | 否 |
| 响应模型 | ResponseBase |

**路径参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| doc_id | int | 文档 ID |

**成功响应**

```json
{
  "code": 200,
  "message": "文档已删除",
  "data": null
}
```

**失败响应**

| code | message | 触发条件 |
|------|---------|----------|
| 404 | 文档不存在 | doc_id 无效 |

---

## 五、果蔬档案管理模块（/plants）

源文件：[product.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/api/v1/product.py)
Schema 定义：[db/product.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/db/product.py)

### 5.1 分类接口

#### 5.1.1 获取分类列表

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 路径 | `/api/v1/plants/categories` |
| 认证 | 否 |
| 响应模型 | ResponseBase |

**查询参数**

| 字段 | 类型 | 必填 | 默认 | 说明 |
|------|------|------|------|------|
| active_only | bool | 否 | false | 仅返回启用的分类 |

**响应 data 字段（ProductCategoryResponse 数组）**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 分类 ID |
| name | string | 分类名称 |
| icon | string\|null | 图标 URL |
| description | string\|null | 描述 |
| sort_order | int | 排序 |
| is_active | bool | 是否启用 |
| plant_count | int | 档案数量 |
| created_at | string\|null | 创建时间 |
| updated_at | string\|null | 更新时间 |

---

#### 5.1.2 创建分类

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/plants/categories` |
| 认证 | 否 |
| Content-Type | `application/json` |
| 响应模型 | ResponseBase |

**请求体（ProductCategoryCreate）**

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| name | string | 是 | 1-100 字符 | 分类名称 |
| icon | string\|null | 否 | - | 图标 URL |
| description | string\|null | 否 | ≤500 字符 | 描述 |
| sort_order | int | 否 | 默认 0 | 排序，越小越靠前 |
| is_active | bool | 否 | 默认 true | 是否启用 |

**请求示例**

```json
{
  "name": "柑橘类",
  "icon": "https://example.com/icon.png",
  "description": "柑橘属水果",
  "sort_order": 1,
  "is_active": true
}
```

**响应 data 字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 分类 ID |
| name | string | 分类名称 |

---

#### 5.1.3 更新分类

| 项目 | 说明 |
|------|------|
| 方法 | `PUT` |
| 路径 | `/api/v1/plants/categories/{cat_id}` |
| 认证 | 否 |
| Content-Type | `application/json` |
| 响应模型 | ResponseBase |

**路径参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| cat_id | int | 分类 ID |

**请求体（ProductCategoryUpdate）**

所有字段均为可选，传入字段才会更新。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| name | string\|null | 1-100 字符 | 分类名称 |
| icon | string\|null | - | 图标 URL |
| description | string\|null | ≤500 字符 | 描述 |
| sort_order | int\|null | - | 排序 |
| is_active | bool\|null | - | 是否启用 |

**失败响应**

| code | message | 触发条件 |
|------|---------|----------|
| 404 | 分类不存在 | cat_id 无效 |

---

#### 5.1.4 删除分类

删除分类，分类下档案将解除关联（不删除档案）。

| 项目 | 说明 |
|------|------|
| 方法 | `DELETE` |
| 路径 | `/api/v1/plants/categories/{cat_id}` |
| 认证 | 否 |
| 响应模型 | ResponseBase |

**路径参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| cat_id | int | 分类 ID |

**失败响应**

| code | message | 触发条件 |
|------|---------|----------|
| 404 | 分类不存在 | cat_id 无效 |

---

### 5.2 果蔬档案接口

#### 5.2.1 获取果蔬档案列表

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 路径 | `/api/v1/plants` |
| 认证 | 否 |
| 响应模型 | PaginatedResponse |

**查询参数**

| 字段 | 类型 | 必填 | 默认 | 约束 | 说明 |
|------|------|------|------|------|------|
| category_id | int\|null | 否 | - | - | 按分类 ID 过滤 |
| keyword | string\|null | 否 | - | - | 名称关键词 |
| active_only | bool | 否 | true | - | 仅返回启用档案（前端展示用） |
| page | int | 否 | 1 | ≥1 | 页码 |
| page_size | int | 否 | 20 | 1-100 | 每页数量 |

**响应 data 字段（PlantResponse 数组）**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 档案 ID |
| category_id | int\|null | 所属分类 ID |
| category_name | string\|null | 所属分类名称 |
| name | string | 名称 |
| scientific_name | string\|null | 学名 |
| cover_image | string\|null | 封面图 URL |
| images | array | 图片 URL 列表 |
| growth_location | string\|null | 生长地点 |
| growth_cycle | string\|null | 生长周期 |
| planting_season | string\|null | 种植季节 |
| harvest_season | string\|null | 采收季节 |
| suitable_temperature | string\|null | 适宜温度 |
| soil_requirement | string\|null | 土壤要求 |
| water_requirement | string\|null | 水分要求 |
| light_requirement | string\|null | 光照要求 |
| description | string\|null | 详情描述（支持 HTML） |
| attributes | object | 扩展属性 |
| tags | array | 标签列表 |
| is_active | bool | 是否启用 |
| sort_order | int | 排序 |
| created_at | string\|null | 创建时间 |
| updated_at | string\|null | 更新时间 |

---

#### 5.2.2 获取果蔬档案详情

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 路径 | `/api/v1/plants/{plant_id}` |
| 认证 | 否 |
| 响应模型 | ResponseBase |

**路径参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| plant_id | int | 档案 ID |

**失败响应**

| code | message | 触发条件 |
|------|---------|----------|
| 404 | 档案不存在 | plant_id 无效 |

---

#### 5.2.3 创建果蔬档案

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/plants` |
| 认证 | 否 |
| Content-Type | `application/json` |
| 响应模型 | ResponseBase |

**请求体（PlantCreate）**

| 字段 | 类型 | 必填 | 约束 | 说明 |
|------|------|------|------|------|
| category_id | int\|null | 否 | - | 所属分类 ID |
| name | string | 是 | 1-200 字符 | 名称 |
| scientific_name | string\|null | 否 | ≤200 字符 | 学名 |
| cover_image | string\|null | 否 | - | 封面图 URL |
| images | array\|null | 否 | - | 图片 URL 列表 |
| growth_location | string\|null | 否 | ≤500 字符 | 生长地点 |
| growth_cycle | string\|null | 否 | ≤200 字符 | 生长周期 |
| planting_season | string\|null | 否 | ≤200 字符 | 种植季节 |
| harvest_season | string\|null | 否 | ≤200 字符 | 采收季节 |
| suitable_temperature | string\|null | 否 | ≤200 字符 | 适宜温度 |
| soil_requirement | string\|null | 否 | ≤500 字符 | 土壤要求 |
| water_requirement | string\|null | 否 | ≤500 字符 | 水分要求 |
| light_requirement | string\|null | 否 | ≤500 字符 | 光照要求 |
| description | string\|null | 否 | - | 详情描述（支持 HTML） |
| attributes | object\|null | 否 | - | 扩展属性 |
| tags | array\|null | 否 | - | 标签列表 |
| is_active | bool | 否 | 默认 true | 是否启用 |
| sort_order | int | 否 | 默认 0 | 排序 |

**请求示例**

```json
{
  "category_id": 1,
  "name": "砂糖橘",
  "scientific_name": "Citrus reticulata",
  "growth_location": "广西、广东",
  "growth_cycle": "约3年挂果",
  "planting_season": "春季2-3月",
  "harvest_season": "冬季12月-次年1月",
  "suitable_temperature": "20-30℃",
  "description": "<p>砂糖橘是柑橘优良品种...</p>",
  "tags": ["柑橘", "冬季水果"],
  "is_active": true,
  "sort_order": 1
}
```

**响应 data 字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 档案 ID |
| name | string | 名称 |

---

#### 5.2.4 更新果蔬档案

| 项目 | 说明 |
|------|------|
| 方法 | `PUT` |
| 路径 | `/api/v1/plants/{plant_id}` |
| 认证 | 否 |
| Content-Type | `application/json` |
| 响应模型 | ResponseBase |

**路径参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| plant_id | int | 档案 ID |

**请求体（PlantUpdate）**

所有字段均为可选，与 PlantCreate 字段一致（类型均为 Optional）。传入字段才会更新。

**失败响应**

| code | message | 触发条件 |
|------|---------|----------|
| 404 | 档案不存在 | plant_id 无效 |

---

#### 5.2.5 删除果蔬档案

| 项目 | 说明 |
|------|------|
| 方法 | `DELETE` |
| 路径 | `/api/v1/plants/{plant_id}` |
| 认证 | 否 |
| 响应模型 | ResponseBase |

**路径参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| plant_id | int | 档案 ID |

**失败响应**

| code | message | 触发条件 |
|------|---------|----------|
| 404 | 档案不存在 | plant_id 无效 |

---

## 六、工具调用模块（/tools）

源文件：[tool.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/api/v1/tool.py)

### 6.1 获取可用工具列表

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 路径 | `/api/v1/tools/list` |
| 认证 | 否 |
| 响应模型 | ResponseBase |

**响应 data 字段（数组）**

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 工具名称 |
| description | string | 工具描述 |
| parameters | object | 参数 Schema（JSON Schema 格式） |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "name": "fertilizer_calculator",
      "description": "根据种植面积（亩）和作物类型，计算所需的复合肥用量。适用于柑橘、蔬菜等常见作物的施肥量估算。",
      "parameters": {
        "type": "object",
        "properties": {
          "area": {
            "type": "number",
            "description": "种植面积，单位：亩"
          },
          "crop_type": {
            "type": "string",
            "description": "作物类型，如：柑橘、番茄、辣椒等",
            "enum": ["柑橘", "番茄", "辣椒", "白菜", "黄瓜", "水稻"]
          },
          "fertilizer_type": {
            "type": "string",
            "description": "肥料类型，默认为复合肥",
            "enum": ["复合肥", "尿素", "钾肥", "磷肥"],
            "default": "复合肥"
          }
        },
        "required": ["area", "crop_type"]
      }
    }
  ]
}
```

---

### 6.2 执行工具

执行指定工具并返回结果。当前已注册工具：`fertilizer_calculator`（肥料计算器）。

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/tools/execute` |
| 认证 | 否 |
| 响应模型 | ResponseBase |

> **参数传递说明**：`tool_name` 与 `parameters` 为函数直接声明的普通参数（非 Pydantic Body 模型），FastAPI 将其解析为查询参数。调用时需通过 query string 传递。`parameters` 为 dict 类型，建议传 JSON 字符串。

**查询参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| tool_name | string | 是 | 工具名称 |
| parameters | string(dict) | 是 | 工具参数（JSON 字符串） |

**请求示例（curl）**

```bash
curl -X POST "http://localhost:8000/api/v1/tools/execute?tool_name=fertilizer_calculator&parameters=%7B%22area%22%3A10%2C%22crop_type%22%3A%22%E6%9F%91%E6%A9%98%22%7D"
```

其中 `parameters` 解码后为：

```json
{"area": 10, "crop_type": "柑橘"}
```

**fertilizer_calculator 参数说明**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| area | number | 是 | 种植面积，单位：亩 |
| crop_type | string | 是 | 作物类型，枚举：柑橘 / 番茄 / 辣椒 / 白菜 / 黄瓜 / 水稻 |
| fertilizer_type | string | 否 | 肥料类型，枚举：复合肥 / 尿素 / 钾肥 / 磷肥，默认复合肥 |

**成功响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "success": true,
    "result": {
      "crop_type": "柑橘",
      "area": 10,
      "area_unit": "亩",
      "fertilizer_type": "复合肥",
      "dosage_per_mu": "80-120 公斤/亩",
      "total_dosage": "800-1200 公斤",
      "total_min_kg": 800.0,
      "total_max_kg": 1200.0
    },
    "message": "10亩柑橘，建议复合肥用量为 800-1200 公斤（80-120 公斤/亩）"
  }
}
```

**失败响应**

| HTTP 状态 | detail | 触发条件 |
|-----------|--------|----------|
| 404 | 工具不存在: {tool_name} | tool_name 未注册 |
| 500 | 工具执行失败: ... | 执行异常 |

> 工具执行接口使用标准 HTTPException，错误以 `{"detail": "..."}` 格式返回，HTTP 状态码非 200。

---

## 七、管理后台模块（/admin）

源文件：[admin.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/api/v1/admin.py)

### 7.1 获取问答日志

分页获取问答日志，支持关键词搜索与纠错状态过滤。

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 路径 | `/api/v1/admin/logs` |
| 认证 | 否 |
| 响应模型 | PaginatedResponse |

**查询参数**

| 字段 | 类型 | 必填 | 默认 | 约束 | 说明 |
|------|------|------|------|------|------|
| page | int | 否 | 1 | ≥1 | 页码 |
| page_size | int | 否 | 20 | 1-100 | 每页数量 |
| keyword | string\|null | 否 | - | - | 关键词搜索（匹配问题内容） |
| is_corrected | bool\|null | 否 | - | - | 是否已纠错 |

**响应 data 字段（数组）**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 日志 ID |
| conversation_id | string | 会话 ID |
| question | string | 用户提问 |
| answer | string | 模型回答 |
| sources | array | 参考资料（JSON 数组） |
| tool_used | string\|null | 使用的工具名称 |
| is_corrected | bool | 是否已纠错 |
| correction | string\|null | 纠错内容 |
| created_at | string\|null | 创建时间（ISO 8601） |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "conversation_id": "conv_001",
      "question": "砂糖橘溃疡病怎么防？",
      "answer": "溃疡病防治应遵循综合防治策略...",
      "sources": [],
      "tool_used": null,
      "is_corrected": false,
      "correction": null,
      "created_at": "2026-06-18T10:00:00"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "page_size": 20,
    "total_pages": 1
  }
}
```

---

### 7.2 纠错问答记录

对坏案例进行人工纠错，写入纠错内容。

| 项目 | 说明 |
|------|------|
| 方法 | `POST` |
| 路径 | `/api/v1/admin/logs/{log_id}/correct` |
| 认证 | 否 |
| 响应模型 | ResponseBase |

> **参数传递说明**：`correction` 为函数直接声明的 `str` 参数，FastAPI 将其解析为查询参数，需通过 query string 传递。

**路径参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| log_id | int | 日志 ID |

**查询参数**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| correction | string | 是 | 纠错内容 |

**请求示例（curl）**

```bash
curl -X POST "http://localhost:8000/api/v1/admin/logs/1/correct?correction=正确的回答内容"
```

**成功响应**

```json
{
  "code": 200,
  "message": "纠错成功",
  "data": null
}
```

**失败响应**

| code | message | 触发条件 |
|------|---------|----------|
| 404 | 日志记录不存在 | log_id 无效 |

---

### 7.3 知识库统计信息

获取知识库与系统的统计信息，含 Qdrant 集合信息。

| 项目 | 说明 |
|------|------|
| 方法 | `GET` |
| 路径 | `/api/v1/admin/stats` |
| 认证 | 否 |
| 响应模型 | ResponseBase |

**响应 data 字段**

| 字段 | 类型 | 说明 |
|------|------|------|
| knowledge_bases | object | 知识库统计 |
| knowledge_bases.total | int | 知识库总数 |
| documents | object | 文档统计 |
| documents.total | int | 文档总数 |
| documents.by_status | object | 各状态文档数量（key 为状态，value 为数量） |
| chat_logs | object | 日志统计 |
| chat_logs.total | int | 日志总数 |
| chat_logs.corrected | int | 已纠错数量 |
| qdrant | object | Qdrant 集合信息（连接失败时为空对象） |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "knowledge_bases": {
      "total": 3
    },
    "documents": {
      "total": 25,
      "by_status": {
        "ready": 23,
        "failed": 2
      }
    },
    "chat_logs": {
      "total": 150,
      "corrected": 5
    },
    "qdrant": {
      "status": "green",
      "vectors_count": 300,
      "points_count": 300
    }
  }
}
```

**失败响应**

| code | message | 触发条件 |
|------|---------|----------|
| 500 | 获取统计信息失败: ... | 服务器内部错误 |

---

## 八、附录

### 8.1 健康检查接口（非 v1）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 服务根路径，返回基本信息 |
| GET | `/health` | 健康检查，返回 `{"status": "healthy"}` |

### 8.2 默认管理员账户

首次启动自动创建：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | admin |

> **安全提示**：请及时通过 `POST /api/v1/auth/change-password` 修改默认密码。

### 8.3 接口认证要求汇总

| 模块 | 接口 | 需认证 |
|------|------|--------|
| 认证 | GET /auth/captcha | 否 |
| 认证 | POST /auth/login | 否 |
| 认证 | GET /auth/me | 是 |
| 认证 | POST /auth/change-password | 是 |
| 认证 | POST /auth/users | 是（需 admin） |
| 对话 | POST /chat/* | 否 |
| 知识库 | 全部接口 | 否 |
| 果蔬档案 | 全部接口 | 否 |
| 工具 | 全部接口 | 否 |
| 管理后台 | 全部接口 | 否 |

> 当前版本中知识库、果蔬档案、工具、管理后台模块未在路由层强制认证，生产环境建议补充权限依赖（参考 [deps.py](file:///D:/lBR/广西大学项目组/广西橙子/citrusagent-backend-main/src/citrus_agent/api/deps.py) 中的 `get_current_user` 与 `require_role`）。

### 8.4 分页参数约定

全项目分页接口统一遵循以下约定：

| 参数 | 默认值 | 取值范围 | 说明 |
|------|--------|----------|------|
| page | 1 | ≥1 | 页码，从 1 开始 |
| page_size | 20 | 1-100 | 每页数量 |

分页响应中 `total_pages` 计算公式：`ceil(total / page_size)`。

### 8.5 时间格式

所有时间字段采用 ISO 8601 格式（如 `2026-06-18T10:00:00`），由后端 `datetime.isoformat()` 生成。