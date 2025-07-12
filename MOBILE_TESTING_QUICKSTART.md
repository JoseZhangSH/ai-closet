# 移动测试快速入门指南

## 🚀 立即开始测试

### 方式 1: 即时测试 (推荐新手)
```bash
# 启动开发服务器
npm start

# 用手机扫描二维码或下载 Expo Go 应用
# Android: https://play.google.com/store/apps/details?id=host.exp.exponent
# iOS: https://apps.apple.com/app/expo-go/id982107779
```

### 方式 2: 专业构建 (推荐生产)
```bash
# 运行配置脚本
./scripts/setup-mobile-testing.sh

# 构建 Android 测试版
eas build --platform android --profile development

# 构建 iOS 测试版 (需要 Apple 开发者账号)
eas build --platform ios --profile development
```

## 📱 获取测试应用

### EAS 构建完成后:
1. 在终端中运行 `eas build:list` 查看构建状态
2. 构建完成后会显示下载链接
3. 将链接分享给测试团队
4. 测试人员可以直接下载安装

## 🔧 环境配置

### 必需的环境变量 (创建 `.env` 文件):
```bash
EXPO_PUBLIC_OPENAI_KEY=your_openai_key
EXPO_PUBLIC_FAL_KEY=your_fal_key
EXPO_PUBLIC_KWAI_ACCESS_KEY=your_kwai_access_key
EXPO_PUBLIC_KWAI_SECRET_KEY=your_kwai_secret_key
```

### GitHub Actions 自动化 (可选):
在 GitHub 仓库设置中添加 Secrets:
- `EXPO_TOKEN`: EAS 访问令牌
- 以及上述所有 API 密钥

## 📊 测试方案对比

| 方案 | 设置时间 | 功能完整性 | 分发方式 | 适用场景 |
|------|----------|------------|----------|----------|
| Expo Go | 1分钟 | 基础功能 | QR码/链接 | 快速UI测试 |
| EAS Development | 10分钟 | 完整功能 | 下载链接 | 完整功能测试 |
| 自动化CI/CD | 30分钟 | 完整功能 | 自动分发 | 团队协作 |

## 🎯 常用命令

```bash
# 查看构建状态
eas build:list

# 查看构建详情
eas build:view [build-id]

# 注册 iOS 测试设备
eas device:create

# 管理 API 密钥
eas secret:create --scope project --name API_KEY --value your_value

# 启动本地开发
npm start
```

## 🔍 故障排除

### 常见问题:
1. **构建失败**: 检查 API 密钥是否正确设置
2. **iOS 安装失败**: 确保设备已注册到开发者账号
3. **Android 无法安装**: 启用"允许安装未知来源应用"

### 获取帮助:
- 查看详细文档: `mobile-testing-research.md`
- 检查 EAS 构建日志: `eas build:view [build-id]`
- Expo 官方文档: https://docs.expo.dev/

## 🎉 开始测试!

运行 `./scripts/setup-mobile-testing.sh` 开始配置，然后选择适合您的测试方案!