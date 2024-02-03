import path from 'path'
import { PinoWebpackPlugin } from 'pino-webpack-plugin'
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin'
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'

const config: webpack.Configuration = {
  mode: 'none',
  devtool: process.env.NODE_ENV === 'development' ? 'eval' : false,
  entry: './src/bootstrap.ts',
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  plugins: [new PinoWebpackPlugin({ transports: ['pino-pretty'] })],
  externals: [nodeExternals()],
  externalsPresets: { node: true },
  ignoreWarnings: [/^(?!CriticalDependenciesWarning$)/],
  optimization: {
    nodeEnv: false,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: path.resolve(__dirname, './tsconfig.json'),
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, './tsconfig.json'),
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
}

// eslint-disable-next-line import/no-default-export
export default config
