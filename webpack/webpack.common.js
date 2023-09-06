const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    index: './src/index.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '../', 'dist'),
    clean: true,
    globalObject: 'this',
    library: {
      name: 'index',
      type: 'umd',
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|ts)x?$/,
        use: ['babel-loader'],
        exclude: /node_modules/,
      },
      {
        test: /\.(scss|css)$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
    ],
  },
  plugins: [new ESLintPlugin(), new NodePolyfillPlugin(), new MiniCssExtractPlugin({ filename: 'extension.css' })],
  resolve: {
    extensions: ['.js'],
    fallback: {
      fs: false,
      tls: false,
      net: false,
      child_process: false,
      stream: require.resolve('readable-stream'),
    },
  },
};
