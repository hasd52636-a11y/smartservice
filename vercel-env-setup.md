# Vercel环境变量设置指南

## 通过Vercel CLI设置环境变量

### 1. 安装Vercel CLI
```bash
npm i -g vercel
```

### 2. 登录Vercel
```bash
vercel login
```

### 3. 链接项目
```bash
vercel link
```

### 4. 设置环境变量
```bash
# 设置智谱API密钥
vercel env add ZHIPU_API_KEY production
# 输入值: a75d46768b0f45dc90a5969077ffc8d9.dT0t2tku3hZGfYkk

vercel env add API_KEY production
# 输入值: a75d46768b0f45dc90a5969077ffc8d9.dT0t2tku3hZGfYkk

vercel env add REACT_APP_ENV production
# 输入值: production

vercel env add VITE_APP_TITLE production
# 输入值: SmartGuide AI

vercel env add VITE_APP_VERSION production
# 输入值: 1.0.0
```

### 5. 查看环境变量
```bash
vercel env ls
```

### 6. 重新部署
```bash
vercel --prod
```

## 重要说明

1. **API密钥安全**: 环境变量在Vercel中是加密存储的，比直接写在代码中安全
2. **环境选择**: 确保为Production、Preview、Development都设置了必要的变量
3. **重新部署**: 设置环境变量后需要重新部署才能生效
4. **变量前缀**: 
   - `VITE_` 前缀的变量会被打包到前端代码中
   - 无前缀的变量只在服务端可用（API函数）

## 验证环境变量

部署完成后，可以通过以下方式验证：
1. 访问 `/admin/diagnostics` 页面检查API密钥状态
2. 查看浏览器控制台是否有API相关错误
3. 测试用户对话功能是否正常工作