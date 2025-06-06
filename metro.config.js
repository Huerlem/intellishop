// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs', 'mjs');
config.resolver.assetExts.push('db', 'txt', 'png', 'jpg');

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  ...config.resolver.nodeModulesPaths,
];

module.exports = config;
