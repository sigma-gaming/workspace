import { Writable } from 'node:stream'

export function collectStream(writable: Writable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []

    const originalWrite = writable.write
    const originalEnd = writable.end

    writable.write = function (...args) {
      chunks.push(Buffer.from(args[0]))

      return originalWrite.apply(
        writable,
        args as Parameters<typeof originalWrite>,
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    writable.end = function (...args: any[]) {
      if (args[0]) chunks.push(Buffer.from(args[0]))
      resolve(Buffer.concat(chunks).toString('utf-8'))
      return originalEnd.apply(writable, args as Parameters<typeof originalEnd>)
    }

    writable.on('error', reject)
  })
}
