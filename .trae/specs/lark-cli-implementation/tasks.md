# 任务列表

- [ ] 任务 1: 项目初始化
    - [ ] 初始化 Node.js 项目 (package.json, tsconfig.json)。
    - [ ] 安装依赖 (`commander`, `@larksuiteoapi/node-sdk`, `dotenv`, `fs-extra`)。
    - [ ] 使用 `commander` 搭建基本的 CLI 结构。

- [ ] 任务 2: 认证与配置
    - [ ] 实现配置管理 (读写 `~/.lark-cli/config.json`)。
    - [ ] 实现 `auth login` 命令以设置 App ID/Secret。
    - [ ] 实现 Lark Client 初始化逻辑 (从环境变量或配置加载)。

- [ ] 任务 3: 消息模块
    - [ ] 实现 `message send` (文本, 富文本)。
    - [ ] 实现 `message list` (历史记录)。
    - [ ] 实现 `message reply`。

- [ ] 任务 4: 文档模块
    - [ ] 实现 `doc create`。
    - [ ] 实现 `doc get` (内容)。

- [ ] 任务 5: 多维表格模块
    - [ ] 实现 `base list` (应用列表)。
    - [ ] 实现 `base table list` (数据表列表)。
    - [ ] 实现 `base record list` (记录列表)。
    - [ ] 实现 `base record create` (创建记录)。

- [ ] 任务 6: Skill 定义
    - [ ] 创建 `LARK_SKILL.md`，包含给 Claude Code 的指令。
    - [ ] 通过模拟 Agent 交互 (手动运行命令) 验证 Skill。

- [ ] 任务 7: 文档与完善
    - [ ] 更新 README.md 使用指南。
    - [ ] 确保所有命令都有 `--help` 描述。
