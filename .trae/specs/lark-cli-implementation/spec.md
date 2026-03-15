# Lark CLI 封装方案

## 为什么 (Why)
用户希望让 Claude Code、OpenCode 等 CLI Agent 工具能够使用飞书/Lark 的能力（消息、文档、多维表格、日历等）。我们需要将 `openclaw-lark` 的能力封装成一个独立的 CLI 工具，并提供 Skill 定义，以便这些 Agent 调用。

## 变更内容 (What Changes)
- 初始化一个新的 Node.js 项目 `lark-cli`。
- 使用 `commander` 和 `@larksuiteoapi/node-sdk` 实现 CLI 工具。
- 实现与 `openclaw-lark` 能力对齐的子命令：
    - `message`: 发送、读取、回复消息。
    - `doc`: 创建、读取文档。
    - `base`: 列表、创建记录。
    - `calendar`: 日历事件列表、创建事件。
    - `auth`: 配置认证信息。
- 创建适用于 Claude Code 集成的 "Skill Definition" 文件 (Markdown/JSON)，说明如何使用这些命令。

## 影响 (Impact)
- **新项目**: 独立的 `lark-cli` 工具。
- **集成**: 使任何基于 CLI 的 Agent 都能控制飞书。

## 新增需求 (ADDED Requirements)
### 需求: CLI 基础
系统应提供 `lark-cli` 可执行文件。
- 支持 `--help` 列出所有命令。
- 支持通过 `--json` 参数输出 JSON 格式，便于机器解析。

### 需求: 认证 (Authentication)
系统应支持以下认证方式：
- 环境变量: `LARK_APP_ID`, `LARK_APP_SECRET`。
- 配置文件: `~/.lark-cli/config.json`。

### 需求: 消息模块 (Messenger)
- `message send`: 向用户/群组发送文本或富文本消息。
- `message list`: 获取会话中的消息列表。

### 需求: 文档模块 (Docs)
- `doc create`: 创建新文档。
- `doc content`: 获取文档内容。

### 需求: 多维表格模块 (Base)
- `base list`: 列出多维表格应用。
- `base record list`: 列出数据表中的记录。
- `base record create`: 创建一条记录。

### 需求: Skill 集成
- 提供 `LARK_SKILL.md` 或同等文件，指导 Claude Code 如何调用 `lark-cli` 来满足用户请求。

## 修改需求 (MODIFIED Requirements)
无

## 移除需求 (REMOVED Requirements)
无
