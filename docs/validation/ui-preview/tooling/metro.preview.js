// Scratch-only Metro config for react-native-web previews (never committed).
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const root = path.resolve(__dirname, '..');
const config = getDefaultConfig(root);
const swap = [
  [/node_modules\/firebase\/firestore\//, 'firestore-shim.ts'],
  [/node_modules\/firebase\/functions\//, 'functions-shim.ts'],
  [/\/firebase\/config\.js$/, 'config-shim.ts'],
  [/\/hooks\/useAuth\.js$/, 'auth-shim.ts'],
  [/node_modules\/expo-router\/build\/index\.js$/, 'router-shim.tsx'],
];
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const r = context.resolveRequest(context, moduleName, platform);
  if (r.type === 'sourceFile') {
    for (const [re, file] of swap) if (re.test(r.filePath) && !context.originModulePath.includes('.preview')) return { type: 'sourceFile', filePath: path.join(__dirname, file) };
  }
  return r;
};
module.exports = config;
