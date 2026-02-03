#!/bin/bash

# ===========================================
# Vercel 环境变量快速配置脚本
# ===========================================

echo "🚀 Vercel 环境变量配置助手"
echo "=================================="

# 检查是否安装了 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI 未安装"
    echo "请先安装: npm i -g vercel"
    exit 1
fi

echo "✅ Vercel CLI 已安装"

# 提示用户输入API密钥
echo ""
echo "请输入您的智谱AI API密钥:"
echo "获取地址: https://open.bigmodel.cn/usercenter/proj-mgmt/apikeys"
read -p "API密钥: " api_key

if [ -z "$api_key" ]; then
    echo "❌ API密钥不能为空"
    exit 1
fi

echo ""
echo "🔧 开始配置环境变量..."

# 设置环境变量
echo "设置 ZHIPU_API_KEY..."
echo "$api_key" | vercel env add ZHIPU_API_KEY production

echo "设置 API_KEY..."
echo "$api_key" | vercel env add API_KEY production

echo "设置 NODE_ENV..."
echo "production" | vercel env add NODE_ENV production

echo "设置 VITE_APP_TITLE..."
echo "SmartGuide AI" | vercel env add VITE_APP_TITLE production

echo "设置 VITE_APP_VERSION..."
echo "1.0.0" | vercel env add VITE_APP_VERSION production

echo "设置 VITE_ZHIPU_BASE_URL..."
echo "https://open.bigmodel.cn/api/paas/v4" | vercel env add VITE_ZHIPU_BASE_URL production

echo ""
echo "✅ 环境变量配置完成!"
echo ""
echo "📋 下一步:"
echo "1. 运行 'vercel --prod' 重新部署"
echo "2. 测试API功能是否正常"
echo "3. 检查应用是否正常运行"
echo ""
echo "🔍 调试工具: 访问 /debug-api-setup.html"