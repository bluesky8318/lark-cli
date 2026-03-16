# Lark CLI 增强计划

根据需求，我们将通过 Feishu API 和 `user_access_token` 支持扩展 CLI 能力。本计划详细说明了实现新命令和增强现有命令的步骤。

## 1. 创建新命令

### 1.1 Drive 命令 (`src/commands/drive.ts`)

实现新的 `drive` 命令以管理文件和文件夹。

* **`list`**：列出文件夹中的文件。

  * 选项：`--folder-token`，`--page-size`，`--page-token`，`--user-access-token`。

  * API：`client.drive.file.list`。

* **`upload`**：上传文件到指定文件夹。

  * 选项：`--file-path`（必填），`--parent-token`（必填），`--user-access-token`。

  * API：`client.drive.file.uploadAll`（或适用于小文件的等效方法）。

* **`download`**：下载文件。

  * 选项：`--file-token`（必填），`--output-path`（必填），`--user-access-token`。

  * API：`client.drive.file.download`。

* **`create-folder`**：创建新文件夹。

  * 选项：`--name`（必填），`--parent-token`（必填），`--user-access-token`。

  * API：`client.drive.folder.create`。

### 1.2 User 命令 (`src/commands/user.ts`)

实现 `user` 命令以检索用户信息。

* **`me`**：获取当前用户信息。

  * 选项：`--user-access-token`。

  * API：`client.authen.userInfo.get`（带 `user_access_token`）。

### 1.3 Search 命令 (`src/commands/search.ts`)

实现 `search` 命令以搜索资源。

* **`query`**：搜索资源（文件、消息等）。

  * 选项：`--query`（必填），`--page-size`，`--page-token`，`--user-access-token`。

  * API：`client.search.dataSource.item.list`（v2）或根据 SDK 可用性使用 `client.search.message.list`。

## 2. 增强现有命令

### 2.1 Sheet 命令 (`src/commands/sheet.ts`)

* 更新 `create` 命令以支持 `--user-access-token`。

* 更新 `meta` 命令以支持 `--user-access-token`。

### 2.2 Base (Bitable) 命令 (`src/commands/base.ts`)

* 更新 `list` 命令以支持 `--user-access-token`。

* 更新 `table list` 命令以支持 `--user-access-token`。

* 更新 `record list` 命令以支持 `--user-access-token`。

* 更新 `record create` 命令以支持 `--user-access-token`。

### 2.3 Message 命令 (`src/commands/message.ts`)

* 更新 `send` 命令以支持 `--user-access-token`。

* 更新 `list` 命令以支持 `--user-access-token`。

* 更新 `reply` 命令以支持 `--user-access-token`。

## 3. 注册新命令

* 更新 `src/index.ts` 以导入并注册 `drive`、`user` 和 `search` 命令。

## 4. 验证

* 确保所有新命令正确编译。

* 验证在提供时 `user-access-token` 是否正确传递给 SDK。

