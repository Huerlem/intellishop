module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // `@/…` resolves from the project root (mirrors tsconfig "paths"); also used by Jest.
      [
        'babel-plugin-module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
          },
        },
      ],
    ],
  };
};
