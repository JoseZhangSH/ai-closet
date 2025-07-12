export default ({ config }) => {
  const env = process.env.APP_ENV || 'development';
  
  return {
    ...config,
    name: env === 'production' ? 'AI Closet' : `AI Closet (${env})`,
    slug: 'ai-closet',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: env === 'production' ? 'com.aicloset.app' : `com.aicloset.app.${env}`,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: env === 'production' ? 'com.aicloset.app' : `com.aicloset.app.${env}`,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: ['expo-font'],
    extra: {
      env,
      // 可以根据环境设置不同的 API 端点
      apiBaseUrl: env === 'production' 
        ? 'https://api.ai-closet.com' 
        : 'https://api-staging.ai-closet.com',
    },
  };
};