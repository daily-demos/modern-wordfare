const path = require("path");
const nodeExternals = require("webpack-node-externals");
const Dotenv = require("dotenv-webpack");

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
    new Dotenv({
      systemvars: true,
    }),
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
        test: /\.(png|svg|jpg|jpeg|gif|ico|wav|ogg)$/,
        loader: "file-loader",
        options: {
          name: (f) => {
            let dirName = path.relative(
              path.join(__dirname, "src", "assets"),
              path.dirname(f)
            );
            return `${dirName}/[name].[ext]`;
          },
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
