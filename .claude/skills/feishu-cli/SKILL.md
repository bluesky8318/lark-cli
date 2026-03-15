---
name: feishu-cli
description: 飞书/Lark 的 CLI 工具，允许 Agent 发送消息、管理文档和多维表格。
---

# Feishu/Lark CLI 工具 (lark-cli)

这个 Skill 提供了通过命令行与飞书/Lark 进行交互的能力。你可以使用它来代表用户发送消息、读取文档、管理多维表格等。

## ⚠️ 前置要求

在调用任何命令之前，必须确保已通过环境变量或 `auth login` 配置了认证信息：
- `LARK_APP_ID`
- `LARK_APP_SECRET`

如果你遇到未认证的错误，请提示用户运行 `lark-cli auth login --app-id <id> --app-secret <secret>`。

所有的命令支持 `--json` 参数，以便你更好地解析返回的数据。

## 常用命令索引

### 1. 消息 (Message)
用于在飞书聊天中发送和读取消息。

- **发送消息**:
  ```bash
  lark-cli message send --receive-id <ID> --receive-id-type <open_id|chat_id|user_id> --content '{"text":"你好"}' --msg-type text --json
  ```
- **读取消息列表**:
  ```bash
  lark-cli message list --container-id <chat_id> --container-id-type chat --json
  ```
- **回复消息**:
  ```bash
  lark-cli message reply --message-id <msg_id> --content '{"text":"已收到"}' --msg-type text --json
  ```

### 2. 文档 (Docs)
用于创建和读取飞书文档。

- **创建文档**:
  ```bash
  lark-cli doc create --title "新文档标题" --folder-token "<可选目录Token>" --json
  ```
- **读取文档纯文本**:
  ```bash
  lark-cli doc raw-content --document-id <doc_id> --json
  ```

### 3. 多维表格 (Base/Bitable)
用于管理多维表格中的数据表和记录。

- **列出多维表格**:
  ```bash
  lark-cli base list --folder-token "<可选目录Token>" --json
  ```
- **列出数据表**:
  ```bash
  lark-cli base table list --app-token <app_token> --json
  ```
- **查询/筛选记录**:
  ```bash
  lark-cli base record list --app-token <app_token> --table-id <table_id> --filter '{"conjunction":"and","conditions":[{"field_name":"状态","operator":"is","value":["进行中"]}]}' --json
  ```
- **创建记录**:
  注意：`fields` 必须是合法的 JSON 字符串，且值的格式需严格匹配多维表格的列类型（例如日期是毫秒时间戳，人员是 `[{"id":"ou_xxx"}]`）。
  ```bash
  lark-cli base record create --app-token <app_token> --table-id <table_id> --fields '{"客户名称":"ByteDance","状态":"进行中"}' --json
  ```

### 4. 日历 (Calendar)
用于管理飞书日历及日程。

- **列出日历**:
  ```bash
  lark-cli calendar list --json
  ```
- **创建日程**:
  ```bash
  lark-cli calendar event-create --calendar-id <calendar_id> --summary "会议主题" --start-time <秒级时间戳> --end-time <秒级时间戳> --attendees "ou_xxx,ou_yyy" --json
  ```

### 5. 任务 (Tasks)
用于管理飞书任务。

- **创建任务**:
  ```bash
  lark-cli task create --summary "新任务标题" --due <毫秒级时间戳> --collaborator-ids "ou_xxx" --json
  ```
- **完成任务**:
  ```bash
  lark-cli task complete --task-id <task_id> --json
  ```

### 6. 电子表格 (Sheets)
用于创建和管理飞书电子表格。

- **创建电子表格**:
  ```bash
  lark-cli sheet create --title "新表格标题" --json
  ```

## 🚨 常见错误与解决

- **`[99991668] Invalid access token`**: 认证信息已过期或错误，请检查 `auth status`。
- **`[1254064] DatetimeFieldConvFail`**: 写入多维表格记录时，日期字段必须使用毫秒级时间戳（例如 `1772121600000`）。
- **`[1254015] Field types do not match`**: 写入多维表格记录时字段类型不匹配，请检查传入的 JSON 是否正确。人员类型必须是数组对象：`[{"id":"ou_xxx"}]`。

## Agent 操作建议

当用户要求你操作飞书时：
1. 优先使用 `--json` 参数运行命令，这能让你更方便地解析 API 响应。
2. 当需要复杂的 JSON 字符串作为参数时（如 `message send` 的 `--content` 或 `base record create` 的 `--fields`），请确保 JSON 转义正确，避免 Bash 解析错误。
