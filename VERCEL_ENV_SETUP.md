# 🚀 Vercel 环境变量配置指南

## 📋 必需的环境变量

### 方法1: Vercel Dashboard 配置 (推荐)

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 逐个添加以下变量：

| 变量名 | 值 | 环境 | 说明 |
|--------|----|----|------|
| `ZHIPU_API_KEY` | `your_api_key_here` | Production, Preview, Development | 智谱AI API密钥 |
| `API_KEY` | `your_api_key_here` | Production, Preview, Development | 备用API密钥 |
| `NODE_ENV` | `production` | Production | Node.js环境 |
| `VITE_APP_TITLE` | `SmartGuide AI` | All | 应用标题 |
| `VITE_APP_VERSION` | `1.0.0` | All | 应用版本 |
| `VITE_ZHIPU_BASE_URL` | `https://open.bigmodel.cn/api/paas/v4` | All | API基础URL |

### 方法2: Vercel CLI 配置

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 添加环境变量
vercel env add ZHIPU_API_KEY
vercel env add API_KEY
vercel env add NODE_ENV
vercel env add VITE_APP_TITLE
vercel env add VITE_APP_VERSION
vercel env add VITE_ZHIPU_BASE_URL
```

### 方法3: 批量导入

1. 使用 `.env.production` 文件内容
2. 在 Vercel Dashboard 中点击 **Import** 
3. 粘贴文件内容并选择环境

## 🔑 获取智谱AI API密钥

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 进入 [API密钥管理](https://open.bigmodel.cn/usercenter/proj-mgmt/apikeys)
4. 创建新的API密钥
5. 复制密钥 (格式: `xxxxxxxx.xxxxxxxxxxxxxxxx`)

## ⚙️ 配置验证

### 1. 部署后验证
```bash
# 重新部署以应用环境变量
vercel --prod
```

### 2. 检查环境变量
在 Vercel Dashboard → Functions → View Function Logs 中查看是否有API密钥相关错误。

### 3. 测试API功能
1. 访问部署的应用
2. 进入项目管理 → 客服回复设置
3. 测试API连接
4. 扫码测试用户对话功能

## 🔒 安全最佳实践

### ✅ 推荐做法
- 在 Vercel Dashboard 中设置环境变量
- 使用不同的API密钥用于不同环境
- 定期轮换API密钥
- 监控API使用量和费用

### ❌ 避免做法
- 不要在代码中硬编码API密钥
- 不要将包含真实密钥的 `.env` 文件提交到Git
- 不要在客户端代码中暴露服务端API密钥
- 不要在公开的文档或截图中显示API密钥

## 🐛 故障排除

### 常见问题

**1. API返回401错误**
- 检查 `ZHIPU_API_KEY` 是否正确设置
- 验证API密钥格式和有效性
- 确认账户余额充足

**2. 环境变量未生效**
- 重新部署应用: `vercel --prod`
- 检查变量名拼写是否正确
- 确认选择了正确的环境 (Production/Preview/Development)

**3. 本地开发环境问题**
- 创建 `.env.local` 文件
- 复制 `.env.example` 内容并填入真实值
- 重启开发服务器

### 调试工具

访问应用的 `/debug-api-setup.html` 页面进行API配置调试。

## 📞 技术支持

如果遇到问题：
1. 检查 Vercel 部署日志
2. 查看浏览器控制台错误
3. 使用调试工具测试API连接
4. 联系技术支持团队