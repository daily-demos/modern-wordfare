const path = require("path");
const nodeExternals = require("webpack-node-externals");
const dotenv = require("dotenv-webpack");
// const webpack = require("webpack");

/* require("dotenv").config({
  path: path.join(__dirname, ".env"),
}); */

const server = {
  entry: "./src/server/index.ts",
  target: "node",
  externals: [nodeExternals()],
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new dotenv({
      systemvars: true,
    }),
    /*  new webpack.DefinePlugin({
      "process.env": JSON.stringify(process.env),
    }), */
  ],
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist", "server"),
  },
};

const client = {
  entry: "./src/client/index.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif|ico)$/,
        loader: "file-loader",
        options: {
          outputPath: "assets",
          name: "[name].[ext]",
        },
      },
      {
        test: /\.(css|html)$/,
        loader: "file-loader",
        options: {
          name: "[name].[ext]",
        },
      },
    ],
  },
  devtool: "source-map",
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist", "client"),
  },
};

module.exports = [server, client];
