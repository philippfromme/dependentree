module.exports = function (config) {
  config.set({
    browsers: ["ChromeHeadless"],
    files: ["test/**/*.js"],
    frameworks: ["mocha", "sinon-chai"],
    preprocessors: {
      "test/**/*.js": ["webpack"],
    },
    webpack: {
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: /node_modules/,
            use: ["babel-loader"],
          },
        ],
      },
    },
  });
};
