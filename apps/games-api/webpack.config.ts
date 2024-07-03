import path from 'path'
import { sentryWebpackPlugin } from '@sentry/webpack-plugin'
import { loadConfig } from 'tsconfig-paths'
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin'
import webpack from 'webpack'
import nodeExternals from 'webpack-node-externals'

const tsconfigPath = path.resolve(__dirname, './tsconfig.json')
const loadedTsconfig = loadConfig(tsconfigPath)

if (loadedTsconfig.resultType !== 'success') {
  throw new Error('Failed to load tsconfig')
}

const internalModules = Object.keys(loadedTsconfig.paths)

const config: webpack.Configuration = {
  mode: 'none',
  devtool: process.env.NODE_ENV === 'development' ? 'eval' : 'source-map',
  entry: './src/main.ts',
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  plugins: [
    process.env.NODE_ENV === 'production' &&
      sentryWebpackPlugin({
        org: 'sigma-games',
        project: 'games-api',
        authToken: process.env.SENTRY_AUTH_TOKEN,
      }),
  ],
  externals: [
    nodeExternals({
      allowlist: (path) => {
        return internalModules.some((module) => path.startsWith(module))
      },
    }),
  ],
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
      {
        test: /\.node$/,
        loader: 'node-loader',
      },
    ],
  },
}

// eslint-disable-next-line import/no-default-export
export default config
