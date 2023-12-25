import { Writable } from 'node:stream'
import { ReactElement } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { TemplateParts } from './server-types'

interface StreamOptions {
  appElement: ReactElement
  writable: Writable
  templateParts: TemplateParts
  content: Record<string, () => string | Promise<string>>
}

export async function streamReact({
  appElement,
  writable,
  templateParts,
  content,
}: StreamOptions) {
  const { slots, before, after } = templateParts

  for (const part of before) {
    const isSlot = slots.includes(part)

    if (!isSlot) {
      writable.write(part)
      continue
    }

    writable.write(await content[part]())
  }

  const stream = new Writable({
    write(chunk, _encoding, cb) {
      writable.write(chunk, cb)
    },
    final: async () => {
      for (const part of after) {
        const isSlot = slots.includes(part)

        if (!isSlot) {
          writable.write(part)
          continue
        }

        writable.write(await content[part]())
      }

      writable.end()
    },
  })

  const { pipe } = renderToPipeableStream(appElement, {
    onAllReady() {
      pipe(stream)
    },
  })
}
