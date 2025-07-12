#!/bin/bash

# AI Closet Mobile Testing Setup Script
# 用于快速配置移动测试环境

set -e

echo "🚀 开始配置 AI Closet 移动测试环境..."

# 检查是否安装了 npm
if ! command -v npm &> /dev/null; then
    echo "❌ 请先安装 Node.js 和 npm"
    exit 1
fi

# 检查是否已经安装了 EAS CLI
if ! command -v eas &> /dev/null; then
    echo "📦 安装 EAS CLI..."
    npm install -g @expo/cli eas-cli
else
    echo "✅ EAS CLI 已安装"
fi

# 检查是否已经登录 EAS
if ! eas whoami &> /dev/null; then
    echo "🔑 请登录 EAS 账户："
    eas login
else
    echo "✅ 已登录 EAS 账户: $(eas whoami)"
fi

# 安装项目依赖
echo "📦 安装项目依赖..."
npm install

# 配置 EAS 构建
echo "⚙️ 配置 EAS 构建环境..."
if [ ! -f "eas.json" ]; then
    eas build:configure
else
    echo "✅ EAS 配置文件已存在"
fi

# 检查环境变量
echo "🔍 检查环境变量配置..."
if [ -z "$EXPO_PUBLIC_OPENAI_KEY" ]; then
    echo "⚠️ 警告: EXPO_PUBLIC_OPENAI_KEY 未设置"
fi

if [ -z "$EXPO_PUBLIC_FAL_KEY" ]; then
    echo "⚠️ 警告: EXPO_PUBLIC_FAL_KEY 未设置"
fi

if [ -z "$EXPO_PUBLIC_KWAI_ACCESS_KEY" ]; then
    echo "⚠️ 警告: EXPO_PUBLIC_KWAI_ACCESS_KEY 未设置"
fi

if [ -z "$EXPO_PUBLIC_KWAI_SECRET_KEY" ]; then
    echo "⚠️ 警告: EXPO_PUBLIC_KWAI_SECRET_KEY 未设置"
fi

echo ""
echo "✅ 移动测试环境配置完成！"
echo ""
echo "🔥 快速开始："
echo "1. 即时测试: npm start"
echo "2. 构建 Android: eas build --platform android --profile development"
echo "3. 构建 iOS: eas build --platform ios --profile development"
echo ""
echo "📖 详细文档: 请查看 mobile-testing-research.md"
echo ""
echo "🎯 下一步："
echo "- 配置 GitHub Secrets (如果使用 CI/CD)"
echo "- 注册测试设备 (iOS): eas device:create"
echo "- 配置 API 密钥: eas secret:create"