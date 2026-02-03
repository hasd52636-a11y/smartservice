# 🔑 API密钥配置指南

## 问题描述

当前系统出现以下错误：
- `/api/zhipu/embeddings` 返回 500 错误
- 知识库向量化失败
- AI功能无法正常使用

## 解决方案

### 方法1：使用调试工具（推荐）

1. 在浏览器中打开 `debug-api-setup.html`
2. 按照页面指引配置API密钥
3. 测试API连接是否正常

### 方法2：手动配置

#### 获取API密钥

1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册/登录账号
3. 在控制台创建API密钥
4. 复制密钥（格式：`xxxxxxxx.xxxxxxxxxxxxxxxx`）

#### 配置方式

**选项A：浏览器本地存储**
```javascript
// 在浏览器控制台执行
localStorage.setItem('zhipuApiKey', 'your_api_key_here');
```

**选项B：环境变量（服务器端）**
```bash
# Windows
set ZHIPU_API_KEY=your_api_key_here

# Linux/Mac
export ZHIPU_API_KEY=your_api_key_here
```

**选项C：.env文件**
```env
ZHIPU_API_KEY=your_api_key_here
```

### 验证配置

1. 刷新页面
2. 扫描二维码进入用户对话页面
3. 检查控制台是否还有API错误
4. 测试知识库问答功能

## 技术说明

### API密钥优先级

系统按以下顺序查找API密钥：
1. 环境变量 `ZHIPU_API_KEY`
2. 浏览器本地存储 `zhipuApiKey`
3. 请求头 `Authorization` (仅开发模式)

### 错误排查

**500错误常见原因：**
- API密钥未配置或格式错误
- 账户余额不足
- API权限不足
- 网络连接问题

**解决步骤：**
1. 检查密钥格式是否正确
2. 验证账户状态和余额
3. 测试网络连接
4. 查看服务器日志

## 安全提醒

- 不要在代码中硬编码API密钥
- 不要将密钥提交到版本控制系统
- 定期轮换API密钥
- 监控API使用量和费用

## 联系支持

如果问题仍然存在，请联系技术支持：
- 邮箱：support@example.com
- 电话：400-888-6666
- 在线客服：[技术支持页面]