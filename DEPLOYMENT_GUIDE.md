# SmartGuide AI 部署指南

## 🚀 Vercel 部署步骤

### 1. 准备工作
- 确保代码已推送到 GitHub 仓库
- 获取智谱AI API密钥

### 2. Vercel 部署
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入 GitHub 仓库
4. 配置项目设置：
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 3. 环境变量配置
在 Vercel 项目设置中添加以下环境变量：

```bash
# 必需的环境变量
ZHIPU_API_KEY=your_zhipu_api_key_here

# 可选的环境变量
VITE_APP_TITLE=SmartGuide AI
VITE_APP_VERSION=1.0.0
VITE_ZHIPU_BASE_URL=https://open.bigmodel.cn/api/paas/v4
```

### 4. 域名配置（可选）
- 在 Vercel 项目设置中添加自定义域名
- 配置 DNS 记录指向 Vercel

### 5. 部署完成
- 点击 "Deploy" 开始部署
- 等待部署完成，获取访问链接

## 🔧 本地开发

### 环境要求
- Node.js 24.x
- npm 或 yarn

### 开发步骤
```bash
# 1. 克隆仓库
git clone <your-repo-url>
cd smartguide-ai

# 2. 安装依赖
npm install

# 3. 配置环境变量（可选，用于本地测试）
# 创建 .env 文件并添加 ZHIPU_API_KEY

# 4. 启动开发服务器
npm run dev

# 5. 构建生产版本
npm run build

# 6. 预览生产版本
npm run preview
```

## 📋 部署检查清单

### 部署前检查
- [ ] 代码已推送到 GitHub
- [ ] 已获取智谱AI API密钥
- [ ] 已删除所有测试文件和敏感信息
- [ ] 构建测试通过 (`npm run build`)

### 部署后检查
- [ ] 网站可以正常访问
- [ ] 管理后台功能正常 (`/admin`)
- [ ] API密钥配置正确
- [ ] 系统诊断通过 (`/admin/diagnostics`)
- [ ] 二维码生成和扫码功能正常
- [ ] AI对话功能正常

## 🐛 常见问题

### 1. 构建失败
**问题**: `npm run build` 失败
**解决**: 
- 检查 TypeScript 错误
- 确保所有依赖已安装
- 检查 Node.js 版本是否为 24.x

### 2. API密钥错误
**问题**: AI功能无法使用
**解决**:
- 检查 Vercel 环境变量配置
- 确认 API 密钥格式正确
- 访问 `/admin/diagnostics` 检查连接状态

### 3. 二维码无效
**问题**: 扫码后无法访问
**解决**:
- 确认项目状态为"已发布"
- 检查链接生成是否正常
- 清除浏览器缓存重试

### 4. 域名访问问题
**问题**: 自定义域名无法访问
**解决**:
- 检查 DNS 配置
- 确认 SSL 证书状态
- 等待 DNS 传播（最多24小时）

## 🔒 安全建议

### 生产环境安全
- 不要在代码中硬编码 API 密钥
- 使用 Vercel 环境变量管理敏感信息
- 定期更新依赖包
- 监控 API 使用情况

### 访问控制
- 管理后台建议设置访问密码
- 定期备份项目数据
- 监控异常访问

## 📊 性能优化

### 生产环境优化
- 启用 Vercel 的 Edge Functions
- 配置适当的缓存策略
- 使用 CDN 加速静态资源
- 监控 Core Web Vitals

### 成本控制
- 监控 API 调用次数
- 设置合理的使用限制
- 定期清理无用数据

---

部署完成后，您的智能客服系统就可以为用户提供服务了！