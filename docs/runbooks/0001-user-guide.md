# Lark CLI 使用手册 (User Guide)

本手册详细介绍了 Lark CLI 的安装、配置及核心功能模块的使用方法。Lark CLI 旨在帮助开发者、运维人员及 AI Agent 快速调用飞书开放平台能力。

## 1. 快速开始

### 1.1 安装

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 全局链接 (使得 lark-cli 命令全局可用)
npm link
```

### 1.2 验证安装

```bash
lark-cli --version
```

## 2. 配置与认证 (Auth)

在使用任何功能前，必须先配置飞书应用的凭证。

### 2.1 应用配置 (App Credentials)

您可以通过以下两种方式配置 `App ID` 和 `App Secret`：

1.  **交互式登录 (推荐)**：
    ```bash
    lark-cli auth login
    # 按提示输入 App ID 和 App Secret
    ```
    配置将保存在 `~/.lark-cli/config.json`。

2.  **环境变量**：
    ```bash
    export LARK_APP_ID="cli_..."
    export LARK_APP_SECRET="your_secret"
    ```

### 2.2 用户授权 (User Authentication)

部分接口（如消息、日历、云文档）需要用户身份 (User Access Token)。

```bash
# 启动本地服务进行 OAuth2 授权
lark-cli auth user

# 查看当前用户信息
lark-cli auth me

# 查看认证状态
lark-cli auth status
```

> **注意**: 请确保飞书开发者后台的“重定向 URL”已配置为 `http://localhost:3000/callback`。

## 3. 核心功能模块

### 3.1 消息 (Message)

用于发送消息、查看历史记录及回复。

-   **发送文本消息**：
    ```bash
    lark-cli message send --to "ou_..." --text "Hello from CLI"
    ```
-   **发送富文本/图片**：
    ```bash
    lark-cli message send --to "ou_..." --type post --content '{"zh_cn": {...}}'
    ```
-   **查看群聊历史**：
    ```bash
    lark-cli message list --chat-id "oc_..."
    ```

### 3.2 多维表格 (Base)

用于管理多维表格数据。

-   **列出应用**：
    ```bash
    lark-cli base list
    ```
-   **列出数据表**：
    ```bash
    lark-cli base table list --app-token "bas..."
    ```
-   **查询记录**：
    ```bash
    lark-cli base record list --app-token "bas..." --table-id "tbl..."
    ```
-   **创建记录**：
    ```bash
    lark-cli base record create --app-token "bas..." --table-id "tbl..." --fields '{"名称": "测试任务", "状态": "进行中"}'
    ```

### 3.3 文档 (Doc)

用于文档管理。

-   **创建文档**：
    ```bash
    lark-cli doc create --folder-token "fld..." --title "新文档"
    ```
-   **获取纯文本内容**：
    ```bash
    lark-cli doc raw-content --doc-token "doc..."
    ```

### 3.4 日历 (Calendar)

-   **列出日历**：
    ```bash
    lark-cli calendar list
    ```
-   **列出日程**：
    ```bash
    lark-cli calendar event-list --calendar-id "primary"
    ```
-   **创建日程**：
    ```bash
    lark-cli calendar event-create --summary "周会" --start "2023-10-01T10:00:00" --end "2023-10-01T11:00:00"
    ```

### 3.5 云空间 (Drive)

-   **列出文件**：
    ```bash
    lark-cli drive list --folder-token "fld..."
    ```
-   **上传文件**：
    ```bash
    lark-cli drive upload --folder-token "fld..." --file-path "./README.md"
    ```
-   **下载文件**：
    ```bash
    lark-cli drive download --file-token "box..." --output "./downloaded_file"
    ```

### 3.6 任务 (Task)

-   **列出任务**：
    ```bash
    lark-cli task list
    ```
-   **完成任务**：
    ```bash
    lark-cli task complete --task-id "t-..."
    ```

## 4. 高级用法

### 4.1 JSON 输出

所有命令均支持 `--json` 选项，输出结构化的 JSON 数据，便于脚本解析或 AI Agent 调用。

```bash
lark-cli auth me --json
# 输出: {"code":0, "data": {"name": "Leon", ...}}
```

### 4.2 调试模式 (Planned)

未来版本将支持 `--verbose` 选项，输出详细的 HTTP 请求与响应日志，用于排查问题。

## 5. 常见问题 (FAQ)

**Q: 为什么提示 "user access token is missing"?**
A: 请执行 `lark-cli auth user` 进行登录授权。

**Q: `base record create` 报错 "No permission"?**
A: 请检查飞书应用是否已开启“多维表格”相关权限，且当前用户对该表格有编辑权限。
