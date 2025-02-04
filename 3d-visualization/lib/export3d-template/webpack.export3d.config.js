const path = require('path');
const _ = require('lodash');

const ROOT_PATH = path.resolve(__dirname);
const TMP_OUTPUT_PATH = ROOT_PATH + '/out';
const TARGET_PATH = `public/js/lib/force-graph`
const developerMode = process.argv.indexOf('--env.develop') >= 0;

const defaultConfig = {
  ALLOW_PERFORMANCE_MONITOR: false,
  DEVELOPMENT_MODE_TEST_DATA: developerMode,
}
const config = Object.assign(defaultConfig, require('dotenv').config({path: ROOT_PATH + '/.env'}).parsed);
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const ShellPlugin = require('webpack-shell-plugin-next');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin');

const babelConfig = require('../common/babel.config.json'); // looks strange but this was the only way to force babel to take all options

babelConfig.minified = !developerMode;
babelConfig.compact = !developerMode;
babelConfig.retainLines = developerMode;

module.exports = {
  cache: true,
  mode: developerMode ? 'development' : 'production',
  context: ROOT_PATH,
  resolve: {
    alias: {
      'common': ROOT_PATH + '/../common',
    }
  },
  entry: {
    tmpl: './index.js'
  },
  output: {
    path: TMP_OUTPUT_PATH,
    filename: '[name].js',
    libraryTarget: 'assign',
    library: '[name]',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [{
          loader: 'babel-loader',
          options: babelConfig
        }]
      },
      {
        test: /\.(service|logic|helpers)\.js$/,
        use: [{
          loader: ROOT_PATH + '/../common/adp-loader/adp-loader.js'
        }]
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      },
      {
        test: /\.less$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'less-loader']
      },
      {
        test: /\.(jpg|png|ttf|eot|svg|otf|woff|woff2)/,
        use: {loader: 'base64-inline-loader', options: {name: '[name].[ext]'}}
      },
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/style.css',
    }),
    new HtmlWebpackPlugin({
      template: './index.html',
      inlineSource: '.(js|css|png)$'
    }),
    new HtmlWebpackInlineSourcePlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      _: 'lodash',
      dayjs: 'dayjs'
    }),
    new webpack.DefinePlugin(_.mapValues(config, x => JSON.stringify(x))),
    new ShellPlugin({
      onBuildEnd: {scripts: [`cp ${TMP_OUTPUT_PATH}/index.html ${TARGET_PATH}/export-template.html`]}
    })
  ],
  optimization: {
    minimizer: developerMode ? [] : [new TerserPlugin({}), new OptimizeCSSAssetsPlugin({})],
    minimize: !developerMode
  }
};
