import { downloadOpenApi } from './orval.download'
import { Source, sources } from './orval.sources'

async function watcher(source: Source) {
  await downloadOpenApi(source)
  setTimeout(() => watcher(source), 1000)
}

for (const source of Object.values(sources)) {
  if (!source.watch) continue
  watcher(source)
}
