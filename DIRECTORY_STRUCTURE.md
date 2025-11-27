# 项目目录结构规范

## 🎯 目标

统一本地和生产环境的目录结构，避免路径混乱和缓存问题。

## 📁 标准化目录结构

```
vue3DataPlatform/
├── 📄 配置文件（项目根目录）
│   ├── package.json                  # NPM 项目配置
│   ├── package-lock.json
│   ├── tsconfig.json                 # TypeScript 配置
│   ├── vite.config.ts                # Vite 构建配置
│   ├── ecosystem.config.js            # PM2 进程配置（重要！）
│   ├── tailwind.config.js             # Tailwind CSS 配置
│   ├── postcss.config.js              # PostCSS 配置
│   ├── commitlint.config.js           # Git commit lint 配置
│   ├── lint-staged.config.js          # lint-staged 配置
│   ├── .eslintrc.js                   # ESLint 配置
│   ├── .prettierrc.js                 # Prettier 配置
│   ├── stylelint.config.js            # Stylelint 配置
│   ├── index.html                     # HTML 入口
│   ├── tsconfig.json
│   ├── koaapp.js                      # ❌ 应该删除（已弃用）
│   ├── init_crawler_config.js         # 爬虫初始化脚本
│   ├── pc-game2.js                    # ❌ 应该删除（测试脚本）
│   ├── ps5-game2.js                   # ❌ 应该删除（测试脚本）
│   ├── troubleshoot.sh                # 故障排查脚本
│   ├── deploy.sh                      # 部署脚本
│   ├── deploy_spider.sh               # 爬虫部署脚本
│   ├── deploy_spider_nodejs.sh        # Node.js 爬虫部署脚本
│   ├── server-setup.sh                # 服务器设置脚本
│   │
│   ├── README.md                      # 项目文档
│   ├── QUICKSTART.md                  # 快速启动指南
│   ├── STANDARD.md                    # 编码规范
│   ├── DOCS_INDEX.md                  # 文档索引
│   │
│   ├── LICENSE
│   ├── .gitignore
│   │
│   └── 📁 其他配置目录
│       └── .vscode/                   # VSCode 配置
│       └── .husky/                    # Git hooks
│       └── .git/                      # Git 版本库
│
├── 📁 src/                            # 前端源代码（Vue 3 + TypeScript）
│   ├── main.ts                        # 项目入口
│   ├── App.vue
│   ├── env.d.ts
│   ├── loopDebugger.js                # ❌ 应该移到 utils/
│   ├── 📁 api/                        # API 模块
│   │   ├── index.ts
│   │   ├── 📁 book/
│   │   ├── 📁 config/
│   │   ├── 📁 crawlerStats/
│   │   ├── 📁 dataScreen/
│   │   ├── 📁 helper/
│   │   ├── 📁 interface/
│   │   └── 📁 modules/
│   ├── 📁 assets/                     # 静态资源
│   ├── 📁 components/                 # Vue 组件
│   ├── 📁 config/                     # 前端配置
│   ├── 📁 directives/                 # Vue 指令
│   ├── 📁 enums/                      # 枚举类型
│   ├── 📁 hooks/                      # Vue Composition API hooks
│   ├── 📁 language/                   # i18n 国际化
│   ├── 📁 layout/                     # 布局组件
│   ├── 📁 routers/                    # 路由配置
│   ├── 📁 store/                      # Pinia 状态管理
│   ├── 📁 styles/                     # 全局样式
│   ├── 📁 typings/                    # TypeScript 类型定义
│   └── 📁 utils/                      # 工具函数
│
├── 📁 server/                         # 后端源代码（Koa2 + Node.js）
│   ├── 📄 配置文件（已弃用，应在根目录）
│   │   ├── ❌ commitlint.config.js
│   │   ├── ❌ ecosystem.config.js
│   │   ├── ❌ lint-staged.config.js
│   │   ├── ❌ postcss.config.js
│   │   ├── ❌ stylelint.config.js
│   │   ├── ❌ tsconfig.json
│   │   ├── ❌ package.json
│   │   └── ❌ package-lock.json
│   │
│   ├── koaapp.js                      # ❌ 不应该在这里（应该在根目录）
│   ├── koaapp-production.js           # ✅ 新：生产环境特定版本
│   ├── config.js                      # 后端配置
│   ├── db.js                          # 数据库连接
│   │
│   ├── 📁 routes/                     # API 路由
│   │   ├── index.js                   # 主路由（所有 API）
│   │   └── bookApi.js                 # 图书 API（独立路由）
│   │
│   ├── 📁 utils/                      # 工具函数
│   │   ├── common.js                  # 通用工具和菜单配置
│   │   ├── biqugeSpider.js            # 笔趣阁爬虫
│   │   ├── gameSpider.js              # 游戏数据爬虫
│   │   ├── hotTopicsSpider.js         # 热门话题爬虫 ✅
│   │   ├── kanshuhouSpider.js         # 看书猴爬虫
│   │   ├── novelDataManager.js        # 小说数据管理
│   │   ├── novelFetcher.js            # 小说获取器
│   │   ├── cronScheduler.js           # ✅ 定时任务调度器（热门话题）
│   │   ├── scheduler-node.js          # Node.js 调度器
│   │   └── common.js                  # 通用函数
│   │
│   ├── 📁 config/                     # 配置文件
│   │   └── crawlerConfig.js           # ✅ 爬虫配置
│   │
│   ├── 📁 crawler/                    # 爬虫相关
│   │   └── 📁 （爬虫脚本）
│   │
│   ├── 📁 sql/                        # SQL 脚本
│   │   ├── crawler_config_schema.sql
│   │   ├── hot_topics_schema.sql      # ✅ 热门话题表
│   │   ├── create_crawler_config.js
│   │   ├── game_info_migration.sql
│   │   └── init_crawler_config.sh
│   │
│   ├── 📁 nginx/                      # Nginx 配置
│   │   └── nginx.conf
│   │
│   ├── scheduleCrawler.js             # ✅ 定时爬虫入口（PM2 进程）
│   └── koaapp.js                      # ❌ 旧位置（应删除）
│
├── 📁 spider-service/                 # 爬虫微服务（独立项目）
│   ├── package.json
│   ├── package-lock.json
│   ├── app.js                         # 爬虫服务入口
│   ├── README.md
│   └── 📁 utils/
│       ├── cronScheduler.js
│       ├── db.js
│       └── hotTopicsSpider.js
│
├── 📁 types/                          # 全局 TypeScript 类型
│
├── 📁 public/                         # 构建后的静态文件
│   ├── 📁 crawler/                    # 爬虫脚本副本
│   │   └── ps5-game.js
│   └── 📁 css/
│
├── 📁 bin/                            # 可执行脚本
│   └── www
│
├── 📁 dist/                           # Vite 构建输出
│
└── 📁 logs/                           # 应用日志目录
```

## 🔧 问题分析

### 本地 ✅ vs 生产 ❌ 对比

| 文件/配置              | 本地位置   | 生产位置   | 标准位置 | 状态   |
| ---------------------- | ---------- | ---------- | -------- | ------ |
| `ecosystem.config.js`  | 根目录 ✅  | server/ ❌ | 根目录   | 需修复 |
| `koaapp.js`            | 根目录 ✅  | server/ ❌ | 根目录   | 需删除 |
| `package.json`         | 根目录 ✅  | server/ ❌ | 根目录   | 需删除 |
| `tsconfig.json`        | 根目录 ✅  | server/ ❌ | 根目录   | 需删除 |
| `commitlint.config.js` | 根目录 ✅  | server/ ❌ | 根目录   | 需删除 |
| `koaapp-production.js` | server/ ✅ | server/ ✅ | server/  | ✅     |

## 🚀 规范化行动计划

### 第 1 步：清理本地项目

1. ❌ 删除 `./koaapp.js`（已弃用，用 koaapp-production.js 替代）
2. ❌ 删除 `./pc-game2.js` 和 `./ps5-game2.js`（测试脚本）
3. ⚙️ 移动 `./src/loopDebugger.js` → `./src/utils/loopDebugger.js`

### 第 2 步：清理生产服务器

1. 删除 `/home/dataPlatform/server/commitlint.config.js`
2. 删除 `/home/dataPlatform/server/ecosystem.config.js`
3. 删除 `/home/dataPlatform/server/lint-staged.config.js`
4. 删除 `/home/dataPlatform/server/postcss.config.js`
5. 删除 `/home/dataPlatform/server/stylelint.config.js`
6. 删除 `/home/dataPlatform/server/tsconfig.json`
7. 删除 `/home/dataPlatform/server/package.json` 和 `package-lock.json`
8. 删除 `/home/dataPlatform/server/koaapp.js`（只保留 koaapp-production.js）
9. 重新同步根目录的配置文件

### 第 3 步：更新启动脚本

- 修改 `ecosystem.config.js` 中的路径为：
  ```javascript
  script: "/home/dataPlatform/server/koaapp-production.js";
  ```

## 📋 规范命名约定

### 配置文件位置

- **项目根目录**：所有项目级别的配置
- **server/** ：只放置 Node.js 后端源代码和服务器特定的脚本

### 文件命名

- **生产专用文件**：使用 `-production` 后缀，如 `koaapp-production.js`
- **通用文件**：不需要后缀

### 路由引用

- 从 `server/koaapp-production.js` 中引用：`require("./routes")`
- 从 `server/scheduleCrawler.js` 中引用：`require("./utils/cronScheduler")`

## ✅ 验证清单

部署后验证：

- [ ] PM2 进程正常启动
- [ ] 所有 API 端点正常工作
- [ ] 热门话题定时任务正常执行
- [ ] 日志输出正常（无路径错误）
- [ ] 数据库连接正常
