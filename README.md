更新：鉴于飞书已经推出官方cli工具（https://github.com/larksuite/cli），本项目方向调整为官方cli工具的扩展，基于官方cli工具，并提供一些官方工具短期没有支持的能力

# Lark/Feishu CLI 工具 (lark-cli)

基于 `@larksuiteoapi/node-sdk` 的核心能力封装的 CLI 工具。允许 CLI 环境（如各类 Agent 工具）通过命令行的方式调用飞书/Lark 的各项能力，包括：消息、文档、多维表格、日历、任务以及电子表格。

## 安装与运行

确保你的系统中已安装 Node.js (推荐 v18+)。

**本地开发与测试：**
```bash
npm install
npm run build
npm link
```
执行 `npm link` 后，你可以在全局直接使用 `lark-cli` 命令。

*(或者使用 `npm run dev -- <command> [options]` 在开发模式下运行)*

## 全局选项

- `--json`: 将所有命令的输出格式化为 JSON，这非常有利于脚本解析或 AI Agent 读取数据。
  - 示例：`lark-cli auth status --json`

---

## 详细使用指南

在使用以下功能前，请务必先完成 **1. 认证配置**。所有的命令如果执行失败，会返回非 0 退出码并在终端打印错误详情。

### 1. 认证 (Authentication)

Lark CLI 支持两种认证模式：
1. **App 认证**：配置 App ID 和 App Secret，适用于大多数管理操作。
2. **用户认证 (User Auth)**：通过 OAuth2 登录，以用户身份访问日历、任务、文档等个人数据。大部分命令都支持 `--user-access-token` 选项来显式指定用户 Token。

> **智能 Token 刷新**：当执行需要用户权限的命令时，如果 Token 已过期或无效，CLI 会自动弹出浏览器窗口引导重新授权，授权成功后自动重试并继续执行原命令，无需手动干预。

**配置 App 凭证：**
```bash
lark-cli auth login --app-id <App ID> --app-secret <App Secret>
```
或者通过环境变量配置：
```bash
LARK_APP_ID=your_app_id
LARK_APP_SECRET=your_app_secret
```

**用户登录 (OAuth2)：**
```bash
lark-cli auth user
```
执行后，CLI 会启动本地服务并生成授权链接。在浏览器中完成授权后，Token 将自动保存到本地配置。

**检查认证状态：**
验证当前是否已经配置了有效的认证信息，以及正在使用哪种凭证。
```bash
lark-cli auth status
```

---

### 2. 消息管理 (Message)

发送消息、列出聊天记录以及回复特定消息。

**2.1 发送消息**
```bash
lark-cli message send \
  --receive-id <接收者ID> \
  --receive-id-type <ID类型> \
  --content '<消息内容JSON>' \
  [--msg-type <消息类型>]
```
- `--receive-id`: 接收者的 ID。
- `--receive-id-type`: ID 类型，可选：`open_id`, `user_id`, `union_id`, `email`, `chat_id`。
- `--content`: 消息内容的 JSON 字符串（例如文本消息：`'{"text":"你好"}'`）。
- `--msg-type`: 消息类型，默认为 `text`。可选：`text`, `post`, `image`, `file`, `audio`, `media`, `sticker`, `interactive`, `share_chat`, `share_user`。

**2.2 列出聊天消息**
```bash
lark-cli message list --container-id <chat_id> [--page-size 20] [--page-token <token>] [--start-time <unix时间戳>] [--end-time <unix时间戳>]
```
- `--container-id-type`: 容器类型，默认为 `chat`。

**2.3 回复特定消息**
```bash
lark-cli message reply \
  --message-id <要回复的消息ID> \
  --content '<消息内容JSON>' \
  [--msg-type <消息类型>]
```

---

### 3. 文档管理 (Doc)

管理飞书文档（新版 Docx）。

**3.1 创建新文档**
```bash
lark-cli doc create [--title "<文档标题>"] [--folder-token <文件夹Token>]
```
不指定 `folder-token` 会默认创建在用户的云空间根目录。执行后返回 Document ID 和 Revision ID。

**3.2 获取文档纯文本内容**
```bash
lark-cli doc raw-content --document-id <文档ID>
```

---

### 4. 多维表格 (Base / Bitable)

管理飞书多维表格（层级：Base 应用 -> Table 数据表 -> Record 记录）。

**4.1 列出多维表格应用**
```bash
lark-cli base list [--folder-token <文件夹Token>]
```

**4.2 列出应用内的数据表 (Tables)**
```bash
lark-cli base table list --app-token <App Token>
```

**4.3 查询数据表记录 (Records)**
```bash
lark-cli base record list \
  --app-token <App Token> \
  --table-id <Table ID> \
  [--page-size <每页数量>] \
  [--page-token <游标>] \
  [--filter '<过滤条件的JSON字符串>']
```

**4.4 创建新记录**
```bash
lark-cli base record create \
  --app-token <App Token> \
  --table-id <Table ID> \
  --fields '<字段数据的JSON字符串>'
```
示例：`--fields '{"Name":"Alice","Age":25}'`

---

### 5. 日历与事件 (Calendar)

管理日历、创建日程、查询空闲状态。

**5.1 列出当前用户的日历**
```bash
lark-cli calendar list [--page-size 20] [--page-token <token>]
```

**5.2 列出日历下的日程事件**
```bash
lark-cli calendar event-list \
  --calendar-id <日历ID> \
  [--start-time <起始Unix时间戳>] \
  [--end-time <结束Unix时间戳>]
```

**5.3 创建日程事件**
```bash
lark-cli calendar event-create \
  --calendar-id <日历ID> \
  --summary "<日程标题>" \
  --start-time <起始Unix时间戳> \
  --end-time <结束Unix时间戳> \
  [--description "<日程详细描述>"] \
  [--attendees "<参与者User ID, 以逗号分隔>"]
```

**5.4 查询空闲/忙碌状态 (Freebusy)**
```bash
lark-cli calendar freebusy \
  --start-time <起始ISO时间字符串> \
  --end-time <结束ISO时间字符串> \
  --user-ids <用户ID列表,逗号分隔>
```
*注：此命令的时间参数必须是 ISO 8601 格式，例如 `2024-01-01T10:00:00Z`。*

---

### 6. 任务管理 (Task)

管理飞书任务。

**6.1 列出任务**
```bash
lark-cli task list \
  [--start-time <创建起始Unix时间戳>] \
  [--end-time <创建结束Unix时间戳>] \
  [--task-completed <true|false>] \
  [--page-size 20] [--page-token <token>]
```
- 默认列出未完成的任务，并按截止时间正序排列（无截止时间或 1970 年的排在最后）。
- 使用 `--task-completed true` 可查看已完成任务。

**6.2 创建任务**
```bash
lark-cli task create \
  --summary "<任务标题>" \
  [--description "<任务描述>"] \
  [--due <截止时间Unix时间戳或ISO字符串>] \
  [--collaborator-ids "<协作者ID列表, 逗号分隔>"]
```

**6.3 完成任务**
```bash
lark-cli task complete --task-id <任务ID>
```

---

### 7. 电子表格 (Sheet)

管理飞书普通电子表格（不同于多维表格）。

**7.1 创建电子表格**
```bash
lark-cli sheet create [--title "<表格标题>"] [--folder-token <文件夹Token>]
```

**7.2 获取电子表格元数据**
```bash
lark-cli sheet meta --spreadsheet-token <电子表格Token>
```

---

### 8. 云空间文件 (Drive)

管理云空间文件和文件夹。

**8.1 列出文件**
```bash
lark-cli drive list [--folder-token <文件夹Token>]
```
默认列出根目录文件。

**8.2 上传文件**
```bash
lark-cli drive upload \
  --file-path <本地文件路径> \
  --parent-token <目标文件夹Token>
```

**8.3 下载文件**
```bash
lark-cli drive download \
  --file-token <文件Token> \
  --output-path <保存路径>
```

**8.4 创建文件夹**
```bash
lark-cli drive create-folder \
  --name <文件夹名称> \
  --parent-token <父文件夹Token>
```

---

### 9. 用户信息 (User)

**9.1 获取当前用户信息**
```bash
lark-cli auth me [--force-refresh]
```
- 查看当前登录用户的详细信息（如 User ID, Tenant Key 等）。
- 默认优先从本地缓存读取。使用 `--force-refresh` 参数可强制从服务器获取最新信息。
- 如果 Token 过期，会自动触发重新认证。

---

### 10. 搜索 (Search)

**10.1 搜索云空间文件**
```bash
lark-cli search file --query "<搜索关键词>"
```

---

## 集成到 Agent

本项目可以无缝集成到 Claude Code 等工具中。
只需复制本项目的 `.claude/skills/feishu-cli/SKILL.md` 到你的项目对应的 `.claude/skills/feishu-cli/` 目录下，并确保全局安装了 `lark-cli`。

## License

ISC
