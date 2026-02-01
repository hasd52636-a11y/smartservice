# 🚀 Vercel 部署指南

## 📋 **部署流程**

### 1. **GitHub 配置**
```bash
# 代码已推送到 GitHub
git push origin main
```

### 2. **Vercel 部署设置**

#### 🔗 **连接 GitHub**
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择 GitHub 仓库：`hasd52636-a11y/smartservice`
4. 点击 "Import"

#### ⚙️ **项目配置**
```
Framework Preset: Vite
Build Command: npm run vercel-build
Output Directory: dist
Install Command: npm install
```

#### 🔐 **环境变量设置**
在 Vercel 项目设置中添加：
```
ZHIPU_API_KEY=your_zhipu_api_key_here
NODE_ENV=production
```

### 3. **部署后验证**

#### ✅ **功能检查清单**
- [ ] 主页加载正常
- [ ] 项目创建功能
- [ ] API密钥配置界面
- [ ] 智谱AI API连接测试
- [ ] QR码生成和扫描
- [ ] 智能路由功能

## 🔧 **部署配置文件**

### `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/api/zhipu/(.*)",
      "dest": "/api/zhipu/[...endpoint].js"
    },
    {
      "src": "/api/ocr",
      "dest": "/api/ocr.js"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

## 🚨 **重要注意事项**

### 1. **API 路由变化**
- **本地开发**: 使用后端服务器 (localhost:3002)
- **Vercel部署**: 使用 Serverless Functions

### 2. **环境差异**
| 环境 | API路由 | 后端服务 |
|------|---------|----------|
| 本地 | Vite代理 → Express后端 | Node.js服务器 |
| Vercel | 直接调用 | Serverless Functions |

### 3. **功能影响分析**

#### ✅ **正常功能**
- 智谱AI API调用（通过Serverless Functions）
- 前端所有功能（React应用）
- 智能路由和模型选择
- QR码生成和扫描
- 用户界面和交互

#### ⚠️ **需要注意**
- **文件上传**: Vercel有文件大小限制（4.5MB）
- **函数超时**: 最大60秒执行时间
- **并发限制**: 根据Vercel套餐限制

#### 🔄 **自动适配**
系统会自动检测环境：
```typescript
// 自动适配部署环境
const API_BASE = process.env.NODE_ENV === 'production' 
  ? '/api'  // Vercel Serverless
  : '/api'; // 本地代理
```

## 🎯 **部署后测试**

### 1. **基础功能测试**
```bash
# 访问部署的应用
https://your-app.vercel.app

# 测试API端点
https://your-app.vercel.app/api/zhipu/chat/completions
```

### 2. **智能路由测试**
- 文本对话 → 自动选择 GLM-4.7
- 图片上传 → 自动选择 GLM-4.6V
- 语音功能 → 自动选择 GLM-4-Voice

## 🔄 **持续部署**

### 自动部署触发
```bash
# 每次推送到main分支都会自动部署
git add .
git commit -m "更新功能"
git push origin main
# Vercel 自动检测并部署
```

### 部署状态监控
- Vercel Dashboard 查看部署状态
- 实时日志和错误监控
- 性能分析和优化建议

## 🎉 **部署完成**

部署成功后，您将获得：
- 🌐 **生产环境URL**: `https://your-app.vercel.app`
- 📱 **移动端适配**: 响应式设计
- ⚡ **全球CDN**: Vercel边缘网络加速
- 🔒 **HTTPS**: 自动SSL证书
- 🚀 **智能路由**: 自动模型选择功能