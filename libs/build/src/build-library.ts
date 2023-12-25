import path from 'node:path'
import { ExternalOption, InputPluginOption, rollup } from 'rollup'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

const DEFAULT_EXTERNAL = (id: string) => !/^[./]/.test(id)

interface SingleOptions {
  type: 'single'
  input: string
  outputDir: string
  outputBaseName?: string
  external?: ExternalOption
  extraPlugins?: InputPluginOption[]
  formats?: Array<'es' | 'cjs'>
  declarations?: boolean
}

interface MultiOptions {
  type: 'multi'
  input: Record<string, string>
  outputDir: string
  external?: ExternalOption
  extraPlugins?: InputPluginOption[]
}

type Options = SingleOptions | MultiOptions

export async function buildLibrary(options: Options) {
  if (options.type === 'single') {
    await buildSingle(options)
  } else {
    await buildMulti(options)
  }
}

async function buildSingle({
  input,
  outputDir,
  outputBaseName = 'index',
  external = DEFAULT_EXTERNAL,
  extraPlugins = [],
  formats = ['es', 'cjs'],
  declarations = true,
}: SingleOptions) {
  const bundle = await rollup({
    input,
    external,
    plugins: [esbuild(), ...extraPlugins],
  })

  if (formats.includes('es')) {
    await bundle.write({
      file: path.join(outputDir, `${outputBaseName}.mjs`),
      format: 'es',
    })
  }

  if (formats.includes('cjs')) {
    await bundle.write({
      file: path.join(outputDir, `${outputBaseName}.js`),
      format: 'cjs',
    })
  }

  const types = await rollup({
    input,
    external,
    plugins: [dts()],
  })

  if (declarations) {
    if (formats.includes('es')) {
      await types.write({
        file: path.join(outputDir, `${outputBaseName}.d.ts`),
        format: 'es',
      })
    }

    if (formats.includes('cjs')) {
      await types.write({
        file: path.join(outputDir, `${outputBaseName}.d.mts`),
        format: 'es',
      })
    }
  }
}

async function buildMulti({
  input,
  outputDir,
  external = DEFAULT_EXTERNAL,
  extraPlugins = [],
}: MultiOptions) {
  const bundle = await rollup({
    input,
    external,
    plugins: [esbuild(), ...extraPlugins],
  })

  await bundle.write({
    dir: outputDir,
    format: 'es',
    minifyInternalExports: false,
    entryFileNames: '[name].mjs',
  })

  await bundle.write({
    dir: outputDir,
    format: 'cjs',
    entryFileNames: '[name].js',
  })

  const types = await rollup({
    input,
    external,
    plugins: [dts()],
  })

  await types.write({
    dir: outputDir,
    format: 'es',
    minifyInternalExports: false,
    entryFileNames: '[name].d.ts',
  })

  await types.write({
    dir: outputDir,
    format: 'es',
    minifyInternalExports: false,
    entryFileNames: '[name].d.mts',
  })
}
