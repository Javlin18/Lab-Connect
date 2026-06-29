const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Monorepo root
const monorepoRoot = path.resolve(__dirname, "../..");
const mobileNodeModules = path.resolve(__dirname, "node_modules");

const config = getDefaultConfig(__dirname);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Resolve modules from both the app and monorepo root
config.resolver.nodeModulesPaths = [
  mobileNodeModules,
  path.resolve(monorepoRoot, "node_modules"),
];

// Force ALL react and react-native modules to resolve from the mobile app's node_modules
// This prevents the dual-React issue where web uses React 18 and mobile uses React 19.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "react" ||
    moduleName.startsWith("react/") ||
    moduleName === "react-native" ||
    moduleName.startsWith("react-native/")
  ) {
    return context.resolveRequest(
      {
        ...context,
        originModulePath: path.resolve(__dirname, "package.json"),
      },
      moduleName,
      platform
    );
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, {
  input: "./global.css"
});
