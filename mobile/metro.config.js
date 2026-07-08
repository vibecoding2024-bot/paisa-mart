// metro.config.js
// NOTE TO AI: Do note change this file unless you are 110% sure you know what you are doing. It will likely break the app.

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");
const fs = require("fs");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Only configure shared folder if it exists (may not exist during Docker build)
const sharedFolder = path.resolve(__dirname, "../shared");
const sharedFolderExists = fs.existsSync(sharedFolder);
const mobileNodeModules = path.resolve(__dirname, "node_modules");
const rootNodeModules = path.resolve(__dirname, "../node_modules");
const packageRoot = (packageName) =>
  path.dirname(
    require.resolve(`${packageName}/package.json`, {
      paths: [mobileNodeModules, __dirname, rootNodeModules],
    })
  );
const reactPath = packageRoot("react");
const reactDomPath = packageRoot("react-dom");
const reactNativePath = packageRoot("react-native");
const reactNativeWebPath = packageRoot("react-native-web");
const expoPath = packageRoot("expo");
const schedulerPath = path.dirname(
  require.resolve("scheduler/package.json", {
    paths: [reactDomPath, mobileNodeModules, __dirname, rootNodeModules],
  })
);

// DEBUG: Log metro.config.js version and shared folder status at startup
console.log("[Metro Config] Version: 2025-02-03-v3-fix-dynamic-imports (source: workspace-mobile)");
console.log(`[Metro Config] Shared folder: ${sharedFolder}`);
console.log(`[Metro Config] Shared folder exists: ${sharedFolderExists}`);

if (sharedFolderExists) {
  config.watchFolders = [sharedFolder];
}

// Disable Watchman for file watching.
config.resolver.useWatchman = false;

// Configure asset and source extensions.
const { assetExts, sourceExts } = config.resolver;

config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Configure resolver with SVG support, shared folder resolution, and web platform mocking
config.resolver = {
  ...config.resolver,
  assetExts: assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...sourceExts, "svg"],
  useWatchman: false,
  disableHierarchicalLookup: true,
  extraNodeModules: {
    ...config.resolver.extraNodeModules,
    react: reactPath,
    "react-dom": reactDomPath,
    "react-native": reactNativePath,
    "react-native-web": reactNativeWebPath,
    "expo": expoPath,
    "scheduler": schedulerPath,
    "@babel/runtime": path.join(rootNodeModules, "@babel/runtime"),
    "whatwg-fetch": path.join(rootNodeModules, "whatwg-fetch"),
    "invariant": path.join(rootNodeModules, "invariant"),
    "nullthrows": path.join(rootNodeModules, "nullthrows"),
    "memoize-one": path.join(rootNodeModules, "memoize-one"),
    "promise": path.join(rootNodeModules, "promise"),
    "regenerator-runtime": path.join(rootNodeModules, "regenerator-runtime"),
    "base64-js": path.join(rootNodeModules, "base64-js"),
    "abort-controller": path.join(rootNodeModules, "abort-controller"),
    "flow-enums-runtime": path.join(rootNodeModules, "flow-enums-runtime"),
    "stacktrace-parser": path.join(rootNodeModules, "stacktrace-parser"),
  },
  nodeModulesPaths: [
    mobileNodeModules,
    rootNodeModules,
  ],
  // Only add shared folder resolution if it exists
  // NOTE: unstable_enablePackageExports moved inside conditional - it breaks dynamic imports
  // like `await import("expo-image")` when enabled globally
  ...(sharedFolderExists && {
    unstable_enablePackageExports: true,
    extraNodeModules: {
      ...config.resolver.extraNodeModules,
      react: reactPath,
      "react-dom": reactDomPath,
      "react-native": reactNativePath,
      "react-native-web": reactNativeWebPath,
      "expo": expoPath,
      "scheduler": schedulerPath,
      "@babel/runtime": path.join(rootNodeModules, "@babel/runtime"),
      "whatwg-fetch": path.join(rootNodeModules, "whatwg-fetch"),
      "invariant": path.join(rootNodeModules, "invariant"),
      "nullthrows": path.join(rootNodeModules, "nullthrows"),
      "memoize-one": path.join(rootNodeModules, "memoize-one"),
      "promise": path.join(rootNodeModules, "promise"),
      "regenerator-runtime": path.join(rootNodeModules, "regenerator-runtime"),
      "base64-js": path.join(rootNodeModules, "base64-js"),
      "abort-controller": path.join(rootNodeModules, "abort-controller"),
      "flow-enums-runtime": path.join(rootNodeModules, "flow-enums-runtime"),
      "stacktrace-parser": path.join(rootNodeModules, "stacktrace-parser"),
      "@/shared": sharedFolder,
    },
    nodeModulesPaths: [
      mobileNodeModules,
      rootNodeModules,
    ],
  }),
  resolveRequest: (context, moduleName, platform) => {
    const pinnedPackages = {
      "react-dom": reactDomPath,
      "react-native-web": reactNativeWebPath,
      scheduler: schedulerPath,
    };

    for (const [packageName, packagePath] of Object.entries(pinnedPackages)) {
      if (moduleName === packageName || moduleName.startsWith(`${packageName}/`)) {
        const subpath = moduleName === packageName ? "" : moduleName.slice(packageName.length + 1);
        return context.resolveRequest(context, path.join(packagePath, subpath), platform);
      }
    }

    // Handle @/shared/* imports explicitly
    // This is needed because:
    // 1. extraNodeModules alone doesn't handle subpath resolution
    // 2. Babel alias would transform to relative path which fails for nested files
    if (sharedFolderExists && moduleName.startsWith("@/shared/")) {
      const subpath = moduleName.slice("@/shared/".length);
      const resolvedPath = path.join(sharedFolder, subpath);
      console.log(`[Metro Resolve] @/shared alias: ${moduleName} -> ${resolvedPath}`);
      return context.resolveRequest(context, resolvedPath, platform);
    }

    // Also handle exact @/shared import (without subpath)
    if (sharedFolderExists && moduleName === "@/shared") {
      console.log(`[Metro Resolve] @/shared exact: ${moduleName} -> ${sharedFolder}`);
      return context.resolveRequest(context, sharedFolder, platform);
    }

    // Handle relative ../shared/* imports (fallback for unmigrated legacy code)
    // These imports are incorrect (resolve to wrong location) but we redirect them
    // to the actual shared folder for backwards compatibility
    // IMPORTANT: Only apply to user code, NOT node_modules (e.g., better-auth has its own internal shared/)
    if (sharedFolderExists && !context.originModulePath?.includes("node_modules")) {
      const relativeSharedMatch = moduleName.match(/^(?:\.\.\/)+shared\/(.+)$/);
      if (relativeSharedMatch) {
        const subpath = relativeSharedMatch[1];
        const resolvedPath = path.join(sharedFolder, subpath);
        console.log(`[Metro Resolve] RELATIVE SHARED: ${moduleName} -> ${resolvedPath}`);
        return context.resolveRequest(context, resolvedPath, platform);
      }
    }

    // Fix better-auth ESM resolution: Metro resolves to .cjs but package only ships .mjs
    // Intercept .cjs paths and redirect to .mjs
    if (moduleName.includes("better-auth") && moduleName.endsWith(".cjs")) {
      const mjsPath = moduleName.replace(/\.cjs$/, ".mjs");
      return context.resolveRequest(context, mjsPath, platform);
    }

    // Fix @better-auth/expo incorrectly importing metro-config (dev-time only)
    // This import shouldn't exist in client code - mock it
    if (moduleName.includes("@expo/metro-config") || moduleName.includes("async-require")) {
      return { type: "empty" };
    }

    // Mock native-only modules on web
    if (platform === "web") {
      const nativeOnlyModules = [
        "react-native-pager-view",
        "reanimated-tab-view",
        "@bottom-tabs/react-navigation",
      ];

      if (nativeOnlyModules.some((mod) => moduleName.includes(mod))) {
        return {
          type: "empty",
        };
      }
    }

    // Fallback to default resolution
    return context.resolveRequest(context, moduleName, platform);
  },
};

// Integrate NativeWind with the Metro configuration.
module.exports = withNativeWind(config, { input: "./global.css" });
