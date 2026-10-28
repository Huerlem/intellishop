// Default Expo Metro configuration (SDK 58). V1 customisations (extra extensions and
// node_modules paths) were redundant with the defaults and have been removed.
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
