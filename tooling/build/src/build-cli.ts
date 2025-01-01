import { ExternalOption, InputPluginOption, rollup } from 'rollup'
import esbuild from 'rollup-plugin-esbuild'

type Options = {
  input: string
  output: string
  external?: ExternalOption
  extraPlugins?: InputPluginOption[]
}

export async function buildCLI({
  input,
  output,
  external = (id: string) => !/^[./]/.test(id),
  extraPlugins = [],
}: Options) {
  const bundle = await rollup({
    input,
    external,
    plugins: [esbuild(), ...extraPlugins],
  })

  await bundle.write({
    file: output,
    format: 'es',
    banner: '#!/usr/bin/env node',
  })
}
