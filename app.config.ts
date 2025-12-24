import { ConfigContext, ExpoConfig } from "expo/config";

const ICONS = {
  iosLight: "./assets/icons/ios-light.png",
  iosDark: "./assets/icons/ios-dark.png",
  iosTinted: "./assets/icons/ios-tinted.png",

  adaptive: "./assets/icons/adaptive-icon.png",

  splashLight: "./assets/icons/splash-icon-light.png",
  splashDark: "./assets/icons/splash-icon-dark.png",
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  name: "Daily Opic",
  slug: "opic_mobile",
  version: "1.0.1",

  extra: {
    eas: {
      projectId: "750ea314-bec3-4af3-98d7-b92b7ac97282",
    },
  },
  orientation: "portrait",
  scheme: "opicmobile",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,

  /**
   * iOS App Icon (Light / Dark / Tinted)
   * iOS 18+ 에서 홈화면 스타일에 따라 자동 적용
   */
  ios: {
    config: {
      usesNonExemptEncryption: false,
    },
    supportsTablet: true,
    bundleIdentifier: "com.mark.opicmobile",
    buildNumber: "2",
    icon: {
      light: ICONS.iosLight,
      dark: ICONS.iosDark,
      tinted: ICONS.iosTinted,
    },
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        "사진을 선택해 프로필이나 학습 자료로 사용할 수 있도록 사진 라이브러리 접근 권한이 필요합니다.",
    },
  },

  /**
   * Android Adaptive Icon
   */
  android: {
    adaptiveIcon: {
      foregroundImage: ICONS.adaptive,
      backgroundColor: "#E6F4FE",
      monochromeImage: ICONS.iosTinted,
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.mark.opicmobile",
    versionCode: 2,
  },

  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },

  plugins: [
    "expo-router",

    /**
     * Splash Screen (Light / Dark)
     */
    [
      "expo-splash-screen",
      {
        image: ICONS.splashLight,
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          image: ICONS.splashDark,
          backgroundColor: "#000000",
        },
      },
    ],

    [
      "expo-speech-recognition",
      {
        microphonePermission:
          "영어 말하기 학습을 위해 사용자의 음성을 녹음합니다.",
        speechRecognitionPermission:
          "발음 평가 및 말하기 연습을 제공하기 위해 음성 인식을 사용합니다.",
        androidSpeechServicePackages: [
          "com.google.android.googlequicksearchbox",
        ],
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: false,
  },
});
