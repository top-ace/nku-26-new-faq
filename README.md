# 南开新生问答 · New Student FAQ

把 **2026 南开大学新生群** 里被反复问到的问题，整理成一个 **可搜索、手机友好、纯静态** 的 FAQ 网站。无后端、无数据库、无追踪脚本，可直接部署到 GitHub Pages。

> **免责声明：** 本页面根据新生群交流整理，群聊回答不代表学校官方结论，具体安排请以学校最新官方通知为准。

---

## 这是什么

- 数据来源：一份用 [QCE（QQ Chat Exporter）](https://github.com/shuakami/qq-chat-exporter) 导出的群聊 JSON（约 4538 条消息，时间范围 2026-07-19 至 2026-07-22）。
- 从中提取新生高频、实用的问题，合并语义相同的问法，汇总同一问题下的多条有效回答。
- 每条回答都标注了 **匿名来源、回答日期、可信度徽章**；互相冲突、可能过时、以及经过官方核验的信息都会明确标出。

## 功能

- 即时本地搜索（问题 / 答案 / 关键词 / 分类），高亮命中词
- 分类筛选、结果计数、清除按钮、空结果友好提示
- FAQ 折叠卡片，同一问题下多条回答并列
- 可信度徽章、冲突警告、可能过时提示、官方核验区块
- 每个 FAQ 可通过 URL 锚点（`#faq-id`）直接定位、复制链接
- 响应式（手机 / 平板 / 桌面）、键盘可操作、清晰焦点、浅色/深色模式

## 目录结构

```
new-student-faq/
├─ index.html          # 主页面（GitHub Pages 用，便于长期维护）
├─ styles.css
├─ app.js
├─ data/
│  └─ faq.json         # 已脱敏的公开 FAQ 数据（唯一允许提交的 JSON）
├─ dist/
│  └─ index.html       # 单文件离线版：CSS/JS/数据全部内嵌，断网可直接打开
├─ review/
│  └─ faq-review.html  # 私有审核页（含真实昵称，已 gitignore，勿公开）
├─ private/
│  └─ source-audit.csv # 私有来源审核表（含真实昵称/原文，已 gitignore，勿公开）
├─ .gitignore
├─ README.md
├─ PRIVACY.md
├─ CONTENT-NOTICE.md
└─ LICENSE
```

## 本地运行

因为主页面通过 `fetch` 读取 `data/faq.json`，浏览器的本地文件安全策略会拦截 `file://` 下的 fetch，所以主版本要用一个本地静态服务器打开：

```bash
cd new-student-faq
python3 -m http.server 8000
# 浏览器访问 http://localhost:8000
```

如果只是想快速看效果、或离线分享，**直接双击 `dist/index.html`** 即可——它是单文件版，数据已内嵌，断网也能打开。

## 如何修改 / 新增 FAQ

所有公开内容都在 **`data/faq.json`** 里，结构清晰、可手动编辑。每个 FAQ 字段：

| 字段 | 说明 |
| --- | --- |
| `id` | 唯一 ID，同时是 URL 锚点（改动会使旧链接失效） |
| `q` | 标准化问题（作为标题） |
| `cat` | 分类 key（见文件顶部 `categories`） |
| `kw` | 搜索别名 / 关键词数组 |
| `answers[]` | 回答数组，每条含 `text` / `src`(匿名来源) / `date` / `verify`(可信度) / `para`(是否整理表述) / `applies`(适用范围，可选) |
| `conflict` | 是否存在冲突回答（true 时显示冲突警告） |
| `outdated` | 是否可能过时 |
| `note` | 补充说明（可选） |
| `official` | 官方核验区块（可选，含 `title`/`text`/`src`/`url`/`date`） |

`verify` 可信度取值：`官方已核验` / `多人回答一致` / `单一经验回答` / `存在冲突` / `可能已经过时` / `无法确认`。

改完 `data/faq.json` 后，若要同步更新单文件版，重新生成 `dist/index.html`（把 `styles.css`、`data/faq.json`、`app.js` 分别内联进 `index.html` 即可；数据以 `window.__FAQ_DATA__` 注入）。

## 部署到 GitHub Pages

1. 新建一个 GitHub 仓库，把 `new-student-faq/` 里的文件推上去（`.gitignore` 会自动排除 `private/`、`review/faq-review.html` 和原始 JSON）。
2. 仓库 **Settings → Pages** → Source 选 **Deploy from a branch** → 选 `main` 分支、`/ (root)` 目录 → Save。
3. 等一两分钟，访问 `https://<你的用户名>.github.io/<仓库名>/` 即可。
4. 页面内所有资源都用相对路径（`styles.css` / `app.js` / `data/faq.json`），在 Pages 的子路径下也能正常加载。

> 提交前请再确认：`private/` 目录、`review/faq-review.html`、原始 QQ 导出 JSON **都没有被提交**（详见 [PRIVACY.md](PRIVACY.md)）。

## 隐私与内容说明

- 隐私处理原则见 [PRIVACY.md](PRIVACY.md)。
- 关于许可证与群聊原始内容版权的说明见 [CONTENT-NOTICE.md](CONTENT-NOTICE.md)。

## 许可证

项目**代码**采用 [MIT License](LICENSE)。注意：MIT 仅覆盖本项目的代码，**不**代表对群聊原始内容拥有版权或公开授权，详见 [CONTENT-NOTICE.md](CONTENT-NOTICE.md)。
