# 研发测试链路研究：手机端直接运行最新代码的解决方案

## 项目概述
AI Closet 是一个基于 React Native 和 Expo 的跨平台移动应用，集成了 AI 功能（衣物分类、背景移除、虚拟试穿）。当前项目使用 Expo SDK 53，支持 iOS 和 Android。

## 1. 即时测试方案（无需构建）

### 1.1 Expo Development Build + Expo Go
**适用场景**：快速开发测试，适合 UI 调整和基本功能验证

**实现步骤**：
```bash
# 启动开发服务器
npm start

# 或针对特定平台
npm run android  # 仅 Android
npm run ios      # 仅 iOS
```

**优势**：
- 零配置，立即可用
- 支持热重载和快速刷新
- 通过 QR 码或链接快速分享给测试人员

**局限性**：
- 无法测试需要 native 代码的功能
- 依赖 Expo Go 应用
- 不适合生产环境测试

### 1.2 Expo Development Build
**适用场景**：测试包含 native 依赖的完整功能

**实现步骤**：
```bash
# 安装 Expo CLI
npm install -g @expo/cli

# 创建开发构建
expo install expo-dev-client
expo run:android  # 或 expo run:ios
```

**优势**：
- 支持所有 native 功能
- 可以测试自定义 native 模块
- 保持开发体验（热重载等）

## 2. 自动化测试分发方案

### 2.1 Expo Application Services (EAS)
**推荐方案**：基于云的构建和分发服务

**配置步骤**：

1. **安装和配置 EAS**
```bash
npm install -g eas-cli
eas login
eas build:configure
```

2. **创建 EAS 配置文件** (`eas.json`)
```json
{
  "cli": {
    "version": ">= 5.2.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    }
  },
  "submit": {
    "production": {}
  }
}
```

3. **构建和分发**
```bash
# 构建开发版本
eas build --platform android --profile development

# 构建预览版本
eas build --platform android --profile preview

# 构建 iOS 版本
eas build --platform ios --profile development
```

**优势**：
- 云端构建，无需本地环境配置
- 支持内部分发链接
- 自动化程度高
- 支持多个构建配置

### 2.2 GitHub Actions + EAS 自动化流水线
**高级方案**：基于 Git 提交自动触发构建

**配置文件** (`.github/workflows/mobile-testing.yml`)
```yaml
name: Mobile Testing Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Setup EAS
      uses: expo/expo-github-action@v8
      with:
        expo-version: latest
        eas-version: latest
        token: ${{ secrets.EXPO_TOKEN }}
        
    - name: Build development app
      run: eas build --platform android --profile development --non-interactive
      
    - name: Send notification
      run: |
        # 发送构建完成通知到团队 Slack/微信等
        echo "Build completed, download link: [EAS_BUILD_URL]"
```

**环境变量配置**：
```bash
# 在 GitHub Secrets 中添加
EXPO_TOKEN=your_expo_token
EXPO_PUBLIC_OPENAI_KEY=your_openai_key
EXPO_PUBLIC_FAL_KEY=your_fal_key
EXPO_PUBLIC_KWAI_ACCESS_KEY=your_kwai_access_key
EXPO_PUBLIC_KWAI_SECRET_KEY=your_kwai_secret_key
```

## 3. 测试设备管理方案

### 3.1 设备注册和证书管理
**iOS 设备**：
```bash
# 注册测试设备
eas device:create

# 查看已注册设备
eas device:list
```

**Android 设备**：
- 无需特殊注册
- 支持任何 Android 设备安装

### 3.2 分发渠道

**内部分发**：
- EAS 内部分发链接
- 支持密码保护
- 自动过期机制

**示例分发流程**：
```bash
# 构建完成后获取分发链接
eas build:list

# 分享链接给测试团队
# 链接格式：https://expo.dev/accounts/[username]/projects/[project]/builds/[build-id]
```

## 4. 测试环境配置

### 4.1 多环境配置
**创建环境配置文件**：

`app.config.js`
```javascript
export default ({ config }) => {
  const env = process.env.APP_ENV || 'development';
  
  return {
    ...config,
    name: env === 'production' ? 'AI Closet' : `AI Closet (${env})`,
    slug: 'ai-closet',
    extra: {
      env,
      apiBaseUrl: env === 'production' 
        ? 'https://api.ai-closet.com' 
        : 'https://api-staging.ai-closet.com',
    },
  };
};
```

### 4.2 特性开关
```typescript
// src/config/featureFlags.ts
export const featureFlags = {
  enableVirtualTryOn: process.env.EXPO_PUBLIC_ENABLE_VTON === 'true',
  enableBackgroundRemoval: process.env.EXPO_PUBLIC_ENABLE_BG_REMOVAL === 'true',
  enableAIAnalytics: process.env.EXPO_PUBLIC_ENABLE_AI_ANALYTICS === 'true',
};
```

## 5. 测试反馈收集

### 5.1 集成测试反馈工具
**推荐工具**：
- **Bugsnag** - 错误追踪
- **Sentry** - 性能监控
- **TestFlight** (iOS) - 内测分发
- **Firebase App Distribution** - 跨平台内测

**示例集成**：
```bash
# 安装 Sentry
npm install @sentry/react-native

# 配置 Sentry
expo install expo-application expo-constants expo-device
```

### 5.2 用户反馈收集
```typescript
// src/components/FeedbackButton.tsx
import { Alert } from 'react-native';

const collectFeedback = () => {
  Alert.prompt(
    '测试反馈',
    '请描述您遇到的问题或建议',
    [
      { text: '取消', style: 'cancel' },
      { 
        text: '提交', 
        onPress: (feedback) => {
          // 发送反馈到后端或第三方服务
          sendFeedback(feedback);
        }
      }
    ]
  );
};
```

## 6. 推荐实施方案

### 阶段一：快速启动（1-2 天）
1. 配置 EAS 构建环境
2. 创建开发和预览构建配置
3. 手动触发构建，获取分发链接

### 阶段二：自动化流水线（3-5 天）
1. 设置 GitHub Actions 工作流
2. 配置自动构建触发器
3. 集成通知系统（Slack/微信/邮件）

### 阶段三：完善测试体系（1-2 周）
1. 集成错误追踪和性能监控
2. 建立测试设备管理流程
3. 创建测试反馈收集机制

## 7. 成本考虑

### EAS 服务定价
- **免费套餐**：每月 30 次构建
- **生产套餐**：$99/月，无限构建
- **企业套餐**：$999/月，包含优先支持

### 替代方案
- **GitHub Actions** 自托管 runners
- **Fastlane** + **Firebase App Distribution**
- **Bitrise** 或 **CircleCI** 等 CI/CD 服务

## 8. 安全考虑

### API 密钥管理
```bash
# 使用 EAS Secrets 管理敏感信息
eas secret:create --scope project --name OPENAI_API_KEY --value your_api_key
eas secret:create --scope project --name FAL_API_KEY --value your_fal_key
```

### 构建签名
```bash
# 为 Android 生成签名密钥
eas credentials:configure --platform android
```

## 9. 监控和分析

### 构建状态监控
```bash
# 监控构建状态
eas build:list --status=in-progress

# 获取构建日志
eas build:view [build-id]
```

### 使用数据分析
- 集成 Google Analytics 或 Firebase Analytics
- 追踪关键用户行为
- 监控 AI 功能使用情况

## 结论

对于 AI Closet 项目，推荐采用 **EAS + GitHub Actions** 的组合方案：

1. **短期**：直接使用 EAS 手动构建，快速获得测试能力
2. **长期**：建立自动化流水线，实现 push-to-test 的开发体验
3. **扩展**：集成监控和反馈系统，建立完整的测试生态

这种方案既能满足快速测试的需求，又为后续的持续集成和部署打下基础。