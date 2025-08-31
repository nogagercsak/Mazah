module.exports = {
  expo: {
    name: "mazah",
    slug: "mazah",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mazahapp.mazah",
      jsEngine: "hermes",
      buildNumber: "16",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          NSAllowsLocalNetworking: true
        },
        UIBackgroundModes: [],
        UIViewControllerBasedStatusBarAppearance: false,
        CFBundleDisplayName: "mazah"
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.mazahapp.mazah"
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            deploymentTarget: "15.1",
            newArchEnabled: false,
            hermesEnabled: true
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    }
  }
};
