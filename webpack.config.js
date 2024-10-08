const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// const isProduction = process.env.NODE_ENV == 'production';

module.exports = {
  entry: './src/index.js',
  mode: process.env.NODE_ENV || 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  devServer: {
    open: true,
    host: 'localhost',
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.html',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset',
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader', 'postcss-loader'] },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader', 'postcss-loader'],
      },
    ],
  },
};

// module.exports = () => {
//     if (isProduction) {
//         config.mode = 'production';
//     } else {
//         config.mode = 'development';
//     }
//     return config;
// };
