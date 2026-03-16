# Lark CLI 功能清单

本文档详细列出了 Lark CLI (lark-cli) 目前支持的所有功能模块、命令及其使用场景，并标记了验证状态。

**状态说明**：
- ✅：验证通过
- 🚧：验证中/开发中
- 📝：计划中

## 目录

1. [认证管理 (Auth)](#1-认证管理-auth)
2. [用户信息 (User)](#2-用户信息-user)
3. [云空间文件 (Drive)](#3-云空间文件-drive)
4. [资源搜索 (Search)](#4-资源搜索-search)
5. [消息管理 (Message)](#5-消息管理-message)
6. [文档管理 (Doc)](#6-文档管理-doc)
7. [多维表格 (Base / Bitable)](#7-多维表格-base--bitable)
8. [电子表格 (Sheet)](#8-电子表格-sheet)
9. [日历与日程 (Calendar)](#9-日历与日程-calendar)
10. [任务管理 (Task)](#10-任务管理-task)
11. [通用选项](#11-通用选项)

---

### 1. 认证管理 (Auth)
用于配置和管理飞书 API 的访问权限。

| 命令 | 功能描述 | 使用场景 | 关键参数 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| `lark-cli auth login` | **配置应用凭证** | 初始化环境，设置 App ID 和 Secret，这是使用 CLI 的第一步。 | `--app-id`, `--app-secret` | ✅ |
| `lark-cli auth status` | **查看认证状态** | 检查当前配置的 App 信息是否有效，以及 User Token 是否已登录。 | 无 | ✅ |
| `lark-cli auth user` | **用户登录 (OAuth2)** | 获取 `user_access_token`，以便访问用户个人数据（如日历、私人文档）。支持交互式登录。 | 无（交互式）或 `--token` | ✅ |

### 2. 用户信息 (User)
获取当前登录用户的身份信息。

| 命令 | 功能描述 | 使用场景 | 关键参数 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| `lark-cli auth me` | **获取我的信息** | 查看当前 User Token 对应的用户详情（如 Open ID, User ID, 租户 Key 等）。默认优先读取缓存。 | `--force-refresh` (强制刷新) | ✅ |

### 3. 云空间文件 (Drive)
管理云盘文件和文件夹。

| 命令 | 功能描述 | 使用场景 | 关键参数 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| `lark-cli drive list` | **列出文件** | 查看指定文件夹下的所有文件列表。 | `--folder-token` (默认根目录) | 📝 |
| `lark-cli drive upload` | **上传文件** | 将本地文件上传到云空间的指定文件夹中。 | `--file-path`, `--parent-token` | 📝 |
| `lark-cli drive download` | **下载文件** | 将云空间中的文件下载到本地指定路径。 | `--file-token`, `--output-path` | 📝 |
| `lark-cli drive create-folder` | **创建文件夹** | 在云空间中新建一个文件夹。 | `--name`, `--parent-token` | 📝 |

### 4. 资源搜索 (Search)
全局搜索飞书资源。

| 命令 | 功能描述 | 使用场景 | 关键参数 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| `lark-cli search file` | **搜索文件** | 根据关键词查找云文档、表格或文件。 | `--query` | 📝 |

### 5. 消息管理 (Message)
发送和管理 IM 消息。

| 命令 | 功能描述 | 使用场景 | 关键参数 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| `lark-cli message send` | **发送消息** | 给用户或群组发送文本、富文本、卡片等消息。 | `--receive-id`, `--content`, `--msg-type` | 📝 |
| `lark-cli message list` | **获取消息列表** | 导出或查看某个群组/会话的历史消息记录。 | `--container-id` | 📝 |
| `lark-cli message reply` | **回复消息** | 针对特定消息 ID 进行回复。 | `--message-id`, `--content` | 📝 |

### 6. 文档管理 (Doc)
管理新版文档 (Docx)。

| 命令 | 功能描述 | 使用场景 | 关键参数 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| `lark-cli doc create` | **创建文档** | 新建一篇飞书文档。 | `--title`, `--folder-token` | 📝 |
| `lark-cli doc raw-content` | **获取文档内容** | 获取文档的纯文本内容，常用于 AI 分析或数据提取。 | `--document-id` | 📝 |

### 7. 多维表格 (Base / Bitable)
管理多维表格数据库。

| 命令 | 功能描述 | 使用场景 | 关键参数 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| `lark-cli base list` | **列出应用** | 查看文件夹下的多维表格应用列表。 | `--folder-token` | 📝 |
| `lark-cli base table list` | **列出数据表** | 查看某个多维表格应用内包含的所有数据表 (Table)。 | `--app-token` | 📝 |
| `lark-cli base record list` | **列出记录** | 查询表中的数据记录，支持 JSON 格式的过滤条件。 | `--app-token`, `--table-id`, `--filter` | 📝 |
| `lark-cli base record create` | **创建记录** | 向数据表中插入新行数据。 | `--fields` (JSON格式) | 📝 |

### 8. 电子表格 (Sheet)
管理传统电子表格。

| 命令 | 功能描述 | 使用场景 | 关键参数 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| `lark-cli sheet create` | **创建表格** | 新建一个电子表格文件。 | `--title`, `--folder-token` | 📝 |
| `lark-cli sheet meta` | **获取元数据** | 查看表格的标题、所有者、URL 等基本信息。 | `--spreadsheet-token` | 📝 |

### 9. 日历与日程 (Calendar)
管理个人日历和日程安排。

| 命令 | 功能描述 | 使用场景 | 关键参数 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| `lark-cli calendar list` | **列出日历** | 查看当前用户的所有日历。 | 无 | 📝 |
| `lark-cli calendar event-list` | **列出日程** | 查看特定时间段内的日程安排。 | `--calendar-id`, `--start-time`, `--end-time` | 📝 |
| `lark-cli calendar event-create` | **创建日程** | 安排会议或活动，支持邀请参与人。 | `--calendar-id`, `--summary`, `--attendees` | 📝 |
| `lark-cli calendar freebusy` | **查询忙闲** | 查询一组用户的忙闲状态，用于安排会议时间。 | `--user-ids`, `--start-time`, `--end-time` | 📝 |

### 10. 任务管理 (Task)
管理飞书任务清单。

| 命令 | 功能描述 | 使用场景 | 关键参数 | 状态 |
| :--- | :--- | :--- | :--- | :--- |
| `lark-cli task list` | **列出任务** | 查看待办任务列表（默认按截止时间排序）。 | `--task-completed` (显示已完成), `--start-time`, `--end-time` | ✅ |
| `lark-cli task create` | **创建任务** | 新建任务，支持设置截止时间和协作者。 | `--summary`, `--due`, `--collaborator-ids` | 📝 |
| `lark-cli task complete` | **完成任务** | 将指定 ID 的任务标记为完成状态。 | `--task-id` | 📝 |

### 11. 通用选项

所有命令均支持以下通用参数：

*   **`--json`**: 将所有命令的输出格式化为 JSON 字符串。这对于脚本解析、自动化流程或 AI Agent 读取数据非常有用。
*   **`--user-access-token <token>`**:
    *   大部分业务命令（除 Auth 外）都支持此选项。
    *   允许显式指定用户 Token 进行操作。
    *   若未指定该参数且已通过 `lark-cli auth user` 登录，CLI 会自动使用本地保存的 Token。
