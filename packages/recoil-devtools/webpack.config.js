/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * Recoil DevTools browser extension.
 *
 * @emails oncall+recoil
 * @format
 */
'use strict';

const webpack = require('webpack');
const path = require('path');
const fileSystem = require('fs-extra');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const env = require('./utils/env');

// load the secrets
var alias = {
  'react-dom': '@hot-loader/react-dom',
};

var buildFolder = 'recoil_devtools_ext';

var secretsPath = path.join(__dirname, 'secrets.' + env.NODE_ENV + '.js');

var fileExtensions = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'eot',
  'otf',
  'svg',
  'ttf',
  'woff',
  'woff2',
];

if (fileSystem.existsSync(secretsPath)) {
  alias['secrets'] = secretsPath;
}

var options = {
  mode: env.NODE_ENV || 'development',
  entry: {
    popup: path.join(__dirname, 'src', 'pages', 'Popup', 'PopupScript.js'),
    devtools: path.join(
      __dirname,
      'src',
      'pages',
      'Devtools',
      'DevtoolsScript.js',
    ),
    background: path.join(
      __dirname,
      'src',
      'pages',
      'Background',
      'Background.js',
    ),
    contentScript: path.join(
      __dirname,
      'src',
      'pages',
      'Content',
      'ContentScript.js',
    ),
    pageScript: path.join(__dirname, 'src', 'pages', 'Page', 'PageScript.js'),
  },
  chromeExtensionBoilerplate: {
    notHotReload: ['contentScript'],
  },
  output: {
    path: path.resolve(__dirname, buildFolder),
    filename: '[name].bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
      },
      {
        test: new RegExp('.(' + fileExtensions.join('|') + ')$'),
        loader: 'file-loader?name=[name].[ext]',
        exclude: /node_modules/,
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: alias,
    extensions: fileExtensions
      .map(extension => '.' + extension)
      .concat(['.jsx', '.js', '.css']),
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new webpack.DefinePlugin({
      __DEV__: env.NODE_ENV !== 'production',
    }),
    // clean the build folder
    new CleanWebpackPlugin({
      verbose: true,
      cleanStaleWebpackAssets: false,
    }),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, 'src', 'assets', 'img', 'icon-34.png'),
        to: path.join(__dirname, buildFolder),
      },
    ]),
    new CopyWebpackPlugin([
      {
        from: path.join(__dirname, 'src', 'assets', 'img', 'icon-128.png'),
        to: path.join(__dirname, buildFolder),
      },
    ]),
    new CopyWebpackPlugin(
      [
        {
          from: 'src/manifest.json',
          to: path.join(__dirname, buildFolder),
          force: true,
          transform: function (content, path) {
            // generates the manifest file using the package.json informations
            return Buffer.from(
              JSON.stringify({
                description: process.env.npm_package_description,
                version: process.env.npm_package_version,
                ...JSON.parse(content.toString()),
              }),
            );
          },
        },
      ],
      {
        logLevel: 'info',
        copyUnmodified: true,
      },
    ),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'Popup', 'index.html'),
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'Popup', 'Devpanel.html'),
      filename: 'devpanel.html',
      chunks: ['popup'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'pages', 'Devtools', 'index.html'),
      filename: 'devtools.html',
      chunks: ['devtools'],
    }),
    new HtmlWebpackPlugin({
      template: path.join(
        __dirname,
        'src',
        'pages',
        'Background',
        'index.html',
      ),
      filename: 'background.html',
      chunks: ['background'],
    }),
    new WriteFilePlugin(),
  ],
};

if (env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-eval-source-map';
}

module.exports = options;
