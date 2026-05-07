# 雅思听力词汇练习项目 (IELTS Vocabulary Practice)

本项目是一个功能完备、轻量优雅的**纯前端**雅思听力单词听写工具。  
项目经历了从传统的单文件脚本向现代前端工程化（Vite + TypeScript）的重构，并接入了 GitHub Actions 自动化持续集成。

## ✨ 核心特性

- **纯前端零服务端**：所有正确率、做题进度、错题本数据均保存在浏览器 `localStorage`，保障隐私，零服务器依赖，点开即用。
- **现代化体验与构建**：采用 Vite + TypeScript 构建，享受毫秒级热更新，代码类型严谨。
- **DevOps 全自动化部署 (CI/CD)**：通过 GitHub Actions 实现自动化运维。你只需要在本地修改 `1.txt` 添加生词然后 `push`，云端引擎会自动跑 Python 处理数据并在 GitHub Pages 部署发布。
- **一键云漫游 (备份与恢复)**：考虑到纯前端存在清缓存掉进度的痛点，界面内置了完整状态的一键导出成 JSON 并可以随时导入恢复。
- **沉浸式听写**：配备便捷的错词库查缺补漏、Markdown导出与音频精细变速控制。

## 📂 项目结构

- **`1.txt`**: 题库核心原文文本。维护者只需在这个文件里按照原有格式追加新词汇。
- **`parse_words.py`**: Python 数据处理引擎。运行后自动读取 `1.txt` 并清洗成结构化的 `public/data.json` 供前端请求解析。
- **`/src/`**: 前端业务代码目录，包含 `main.ts` (DOM 主逻辑)、`state.ts` (状态与缓存中心)、`audioPlayer.ts` (音频模块库) 以及 `types.ts`。
- **`/public/`**: 静态资产文件，包含运行时数据源 `data.json`，以及 `/mp3/` 题库音频库。
- **`.github/workflows/deploy.yml`**: GitHub Actions 脚本，使得仓库拥有每次提交都能自动解析题库并自动部署网页的能力。

## 🚀 本地开发指南

### 环境依赖
- Node.js (推荐 v18+) 获取前端模块工具。
- Python 3+ 环境（用于本地调试词库解析）。

### 开始运行
1. **安装前端依赖**：
   ```bash
   npm install
   ```
2. **提取并生成词库**：
   如果你改动了 `1.txt` 想在本地查看效果：
   ```bash
   python parse_words.py
   ```
3. **启动开发服务器**：
   ```bash
   npm run dev
   ```
   随后在浏览器访问控制台弹出的 `http://localhost:5173`。

### 生产环境打包
```bash
npm run build
```
打包后生成的代码将被输出到 `dist/` 文件夹，您可以把它推送到任何一个例如 Vercel 或者 Netlify 的静态网站托管服务上。

## ⚙️ 词书 `1.txt` 规范要求
`parse_words.py` 对于复制自 Excel 等渠道的内容有优秀的容错处理，主要需要遵循：
- **章节标头**（必不可少）：符合 `Chapter{N} Test Paper {Suffix}`，如 `Chapter3 Test Paper 1`。
- **单词项文本**：使用制表符 `Tab` 区隔：`序号 \t 中外文释义 \t 英文单词`（例如：`1 \t  能力 \t ability`）。
