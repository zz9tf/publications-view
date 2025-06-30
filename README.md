# Paper View - 论文浏览器 📚

一个现代化的论文浏览和管理界面，灵感来自学术研究平台。

## 功能特点 ✨

- 🔍 **智能搜索** - 快速搜索论文标题、作者和内容
- 📋 **分类筛选** - 按类型、作者、发表时间等筛选论文
- 📖 **详细信息** - 查看论文摘要、关键词、引用次数等详细信息
- 🎯 **响应式设计** - 适配桌面和移动设备
- ⚡ **可收缩面板** - 灵活的界面布局，可隐藏左右侧边栏

## 技术栈 🛠️

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **状态管理**: React Hooks

## 快速开始 🚀

### 安装依赖

\`\`\`bash
npm install
\`\`\`

### 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

然后打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

\`\`\`bash
npm run build
npm start
\`\`\`

## 项目结构 📁

\`\`\`
src/
├── app/
│ ├── components/ # 组件目录
│ │ ├── Header.tsx # 顶部导航栏
│ │ ├── PaperSidebar.tsx # 左侧论文列表
│ │ └── PaperDetailPanel.tsx # 右侧详情面板
│ ├── types/ # 类型定义
│ │ └── Paper.ts # 论文数据类型
│ ├── globals.css # 全局样式
│ ├── layout.tsx # 根布局
│ └── page.tsx # 主页面
\`\`\`

## 使用说明 📖

1. **浏览论文**: 在左侧面板浏览论文列表
2. **筛选内容**: 使用下拉菜单按类型、作者、时间筛选
3. **查看详情**: 点击论文标题查看详细信息
4. **搜索功能**: 使用顶部搜索框快速查找论文
5. **收缩面板**: 点击侧边栏的箭头按钮收缩/展开面板

## 开发特性 🔧

- ✅ TypeScript 类型安全
- ✅ ESLint 代码规范
- ✅ 响应式设计
- ✅ 现代化的 UI/UX
- ✅ 组件化架构
- ✅ JSDoc 文档注释

## 浏览器兼容性 🌐

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 许可证 📄

MIT License

## 贡献指南 🤝

欢迎提交 Issue 和 Pull Request！

---

> 此项目遵循简洁设计原则，专注于提供优秀的用户体验。
