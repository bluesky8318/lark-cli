# 架构设计 (Architecture Design)

本文档记录了 Lark CLI 的技术架构、核心组件职责及关键设计决策。

## 1. 系统架构概览

Lark CLI 采用分层架构设计，自上而下分为：

-   **CLI Interface Layer**: 基于 `commander` 处理命令行参数解析与分发。
-   **Command Layer**: 具体的业务逻辑实现（如 Auth, Message, Doc 等），负责参数校验与结果格式化。
-   **Service/Utils Layer**: 封装通用的飞书 SDK 调用、鉴权逻辑、配置管理及 HTTP 请求。
-   **Infrastructure Layer**: 飞书开放平台 (OpenAPI) 及本地文件系统。

## 2. 核心组件

### 2.1 入口与路由 (`src/index.ts`)
-   **职责**: 程序的唯一入口，负责初始化 CLI 程序，加载环境变量，注册所有子命令。
-   **依赖**: `commander`, `dotenv`.

### 2.2 命令模块 (`src/commands/`)
每个模块对应飞书的一个业务领域，遵循 `registerXxxCommand` 的统一模式。

| 模块 | 职责 | 关键功能 |
| :--- | :--- | :--- |
| **Auth** | 认证管理 | Login, Status, User (OAuth2), Me |
| **Message** | 消息服务 | Send (Text/Post/Image), List, Reply |
| **Doc** | 文档管理 | Create, Raw Content (纯文本提取) |
| **Base** | 多维表格 | List Apps/Tables, Record CRUD |
| **Calendar** | 日历日程 | List, Event CRUD, Freebusy |
| **Task** | 任务管理 | List, Create, Complete |
| **Drive** | 云空间 | List, Upload, Download, Folder |
| **Sheet** | 电子表格 | Create, Meta |
| **Search** | 搜索服务 | Search Files |

### 2.3 核心工具库 (`src/utils/`)

#### Client (`src/utils/client.ts`)
-   **职责**: 维护 `lark.Client` 单例。
-   **核心机制 (`withAuthRetry`)**:
    -   封装所有 API 调用。
    -   拦截 `99991672` (Token Expired) 等错误码。
    -   自动触发 Token 刷新逻辑并重试请求，对上层业务透明。

#### Config (`src/utils/config.ts`)
-   **职责**: 管理本地配置文件的读写。
-   **策略**: 优先级策略 `Environment Variables` > `Local Config (.lark-cli/config.json)` > `Global Config (~/.lark-cli/config.json)`。

#### Auth (`src/utils/auth.ts`)
-   **职责**: 处理复杂的 OAuth2 交互。
-   **实现**: 启动本地 Express 服务器 (`localhost:3000`) 监听飞书的回调，自动获取并保存 `user_access_token`。

## 3. 关键设计决策 (Key Design Decisions)

### 3.1 混合鉴权模式
-   **决策**: 同时支持 **App Access Token** (机器身份) 和 **User Access Token** (用户身份)。
-   **理由**: 
    -   自动化脚本通常使用 App Token。
    -   日历、私人文档等操作强制要求 User Token。
-   **实现**: `withAuthRetry` 中根据 API 要求及当前上下文自动降级或切换 Token。

### 3.2 结构化输出
-   **决策**: 强制支持 `--json` 参数。
-   **理由**: Lark CLI 的主要用户是 AI Agent 和自动化脚本，JSON 是最通用的机器可读格式。
-   **规范**: 所有命令在 `--json` 模式下必须输出合法的 JSON 字符串，且包含 `code`, `msg`, `data` 标准字段。

### 3.3 交互式与非交互式并存
-   **决策**: 敏感操作（如 Login）优先交互式，但也支持参数传入。
-   **理由**: 兼顾人类用户的易用性和 CI/CD 环境的自动化需求。

## 4. 数据流 (Data Flow)

1.  **Input**: 用户/Agent 输入命令 `lark-cli <command> [options]`。
2.  **Parse**: `commander` 解析参数，校验必填项。
3.  **Config**: 读取 `config.json` 或环境变量，获取 `App ID/Secret`。
4.  **Auth Check**: 
    -   若需要 User Token，检查本地缓存。
    -   若 Token 过期，`withAuthRetry` 自动刷新。
5.  **Request**: 调用 `@larksuiteoapi/node-sdk` 发起 HTTP 请求。
6.  **Response**: 
    -   成功: 格式化输出 (Text/Table/JSON)。
    -   失败: 捕获异常，输出标准错误码并 `exit(1)`。
