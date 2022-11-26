const path = require("path");

const { DefinePlugin, ProvidePlugin } = require("webpack");

const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: path.resolve(__dirname, "./src/index.js"),
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      {
        test: /\.s[ac]ss$/i,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "app.js",
  },
  plugins: [
    new DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    }),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
    new ProvidePlugin({
      process: require.resolve("process/browser"),
    }),
  ],
  devtool: "eval-source-map",
  devServer: {
    hot: false,
    liveReload: false,
  },
  resolve: {
    fallback: {
      os: require.resolve("os"),
      path: require.resolve("path-browserify"),
      process: require.resolve("process/browser"),
      url: require.resolve("url"),
    },
  },
};
