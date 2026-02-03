# Vercel环境变量配置指南

## 方法1：Vercel Dashboard（推荐）

1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. 点击 **Settings** 标签
4. 选择 **Environment Variables**
5. 点击 **Add New**
6. 填写：
   - Name: `ZHIPU_API_KEY`
   - Value: `你的智谱AI密钥`
   - Environment: 选择所有环境（Production, Preview, Development）
7. 点击 **Save**

## 方法2：Vercel CLI

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录
vercel login

# 设置环境变量
vercel env add ZHIPU_API_KEY

# 输入密钥值，选择环境
```

## 方法3：通过vercel.json配置

```json
{
  "env": {
    "ZHIPU_API_KEY": "@zhipu-api-key"
  }
}
```

然后在Vercel Dashboard中添加名为 `zhipu-api-key` 的secret。

## 重新部署

设置完环境变量后，需要重新部署：

```bash
vercel --prod
```

或者在Dashboard中点击 **Redeploy**。