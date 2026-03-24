const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.watchFolders = (config.watchFolders || []).filter(
  (folder) => !folder.includes(".local/state/workflow-logs")
);

config.resolver = config.resolver || {};
config.resolver.blockList = [
  /\.local\/state\/workflow-logs\/.*/,
  ...(config.resolver.blockList ? [config.resolver.blockList].flat() : []),
];

module.exports = config;
