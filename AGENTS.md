# AGENTS.md

AI Agent 在此项目中工作的指导文件。

## 语言要求

- **必须使用中文** 编写所有文档、注释、提交信息以及与用户的交流内容。

## 项目概览

Lark CLI 是一个模块化的 CLI 工具，用于与飞书/Lark 开放平台 API 交互，专为 AI Agent 和自动化场景设计。

## 快速开始

```bash
npm install          # 安装依赖
npm run build        # 构建
npm link             # 全局安装
npm run dev -- <cmd> # 开发模式
```

## 文档架构（Agent 记忆）

项目文档采用面向 Agent 的结构设计，作为 Agent 的外部长期记忆。

```
docs/
├── architecture.md   # 架构决策 - 技术架构层面的关键设计、选型、取舍记录
├── decisions/        # 决策记录 (ADR) - Agent 的"长期规划记忆"
│   ├── 0000-requirements.md  # 需求规格说明书
│   └── ...                   # 具体的架构决策与设计权衡
└── runbooks/         # 操作手册 (Runbooks) - Agent 的"程序性记忆"
    ├── 0001-user-guide.md    # 用户指南与常用命令速查
    └── 0002-feature-list.md  # 完整功能清单与状态
```

## Agent 阅读指南

- **规划阶段 (Plan Mode)**: 优先读取 `docs/decisions/`，理解项目目标、需求约束及历史决策，避免重复造轮子或违背设计原则。
- **执行阶段 (Agent Mode)**: 遇到具体操作不确定时，读取 `docs/runbooks/`，获取经过验证的命令范例和操作流程。


## 系统架构概览

```
src/
├── index.ts          # 入口点，注册所有命令
├── commands/         # CLI 命令实现
│   ├── auth.ts       # 认证：login, status, user, me
│   ├── message.ts    # 消息：send, list, reply
│   ├── doc.ts        # 文档：create, raw-content
│   ├── base.ts       # 多维表格：list, table, record
│   ├── calendar.ts   # 日历：list, event-list, event-create, freebusy
│   ├── task.ts       # 任务：list, create, complete
│   ├── sheet.ts      # 电子表格：create, meta
│   ├── drive.ts      # 云空间：list, upload, download, create-folder
│   └── search.ts     # 搜索：file
└── utils/
    ├── client.ts     # Lark SDK 客户端单例 + withAuthRetry
    ├── config.ts     # 配置管理 (优先级: 本地 .lark-cli/ > ~/.lark-cli/)
    └── auth.ts       # OAuth2 认证流程 + Token 自动刷新
```



## 核心模式

### 命令注册
每个命令模块导出 `registerXxxCommand(program: Command)` 函数，在 `index.ts` 中统一注册。使用 Commander.js 的子命令模式。

### 认证机制
- **App 认证**：通过 `auth login` 或环境变量 (`LARK_APP_ID`, `LARK_APP_SECRET`) 配置
- **用户认证**：通过 OAuth2 流程获取 `userAccessToken`，支持自动刷新
- **withAuthRetry**：封装 API 调用，自动处理 Token 过期并重试

### 配置优先级
1. 环境变量 (`LARK_APP_ID`, `LARK_APP_SECRET`)
2. 本地配置 (`./.lark-cli/config.json`)
3. 全局配置 (`~/.lark-cli/config.json`)

## 代码风格

- TypeScript (ESM)
- Async/Await
- 使用 `@larksuiteoapi/node-sdk` 进行 API 交互
- 错误处理：`res.code !== 0` 时输出错误并 `process.exit(1)`
- JSON 输出：通过全局 `--json` 选项控制

## 验证命令

```bash
lark-cli auth status   # 检查认证状态
lark-cli auth me       # 获取用户信息
lark-cli task list     # 列出任务
```
