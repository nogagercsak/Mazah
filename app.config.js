module.exports = {
  expo: {
    name: "Mazah",
    slug: "mazah",
    scheme: "mazah",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "light",
    privacy: "public",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mazahapp.mazah",
      jsEngine: "hermes",
      buildNumber: "17",
      config: {
        usesNonExemptEncryption: false
      },
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          NSAllowsLocalNetworking: true,
          NSExceptionDomains: {
            "supabase.co": {
              NSExceptionAllowsInsecureHTTPLoads: false,
              NSExceptionMinimumTLSVersion: "TLSv1.2",
              NSExceptionRequiresForwardSecrecy: false
            },
            "maps.google.com": {
              NSExceptionAllowsInsecureHTTPLoads: false,
              NSExceptionMinimumTLSVersion: "TLSv1.2",
              NSExceptionRequiresForwardSecrecy: false
            }
          }
        },
        UIBackgroundModes: ["fetch", "processing"],
        UIViewControllerBasedStatusBarAppearance: false,
        CFBundleDisplayName: "Mazah",
        NSCameraUsageDescription: "Mazah needs camera access to identify ingredients from photos for recipe recommendations.",
        NSPhotoLibraryUsageDescription: "Mazah needs photo library access to select ingredient photos for recognition.",
        // Restrict content to appropriate age rating
        NSContentRatingPolicy: {
          "WebContent": 0, // No unrestricted web content
          "SocialNetworking": 0, // No social networking
          "UserGeneratedContent": 0 // No user generated content
        }
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.mazahapp.mazah",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
      ]
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      "expo-notifications",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            deploymentTarget: "15.1",
            newArchEnabled: false,
            hermesEnabled: true,
	    dwarfAndDsym: true
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    }
  }
};
