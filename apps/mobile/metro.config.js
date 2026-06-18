const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

// Monorepo root
const monorepoRoot = path.resolve(__dirname, "../..");

const config = getDefaultConfig(__dirname);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Resolve modules from both the app and monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

module.exports = withNativeWind(config, {
  input: "./global.css"
});
