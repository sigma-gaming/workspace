import { resolve } from 'path'
import { loadConfig } from 'tsconfig-paths'
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin'
import { Configuration } from 'webpack'
import nodeExternals from 'webpack-node-externals'

const tsconfigPath = resolve(__dirname, './tsconfig.json')
const loadedTsconfig = loadConfig(tsconfigPath)

if (loadedTsconfig.resultType !== 'success') {
  throw new Error('Failed to load tsconfig')
}

const internalModules = Object.keys(loadedTsconfig.paths)

const config: Configuration = {
  mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
  devtool: process.env.NODE_ENV === 'development' ? 'eval' : 'source-map',
  entry: './src/main.ts',
  target: 'node20',
  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  externals: [
    nodeExternals({
      allowlist: (path) => {
        return internalModules.some((module) => path.startsWith(module))
      },
    }),
  ],
  externalsPresets: { node: true },
  ignoreWarnings: [/^(?!CriticalDependenciesWarning$)/],
  optimization: { nodeEnv: false },
  resolve: {
    extensions: ['.ts', '.js'],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: tsconfigPath,
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
              configFile: tsconfigPath,
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

// eslint-disable-next-line import-x/no-default-export
export default config
