import url from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const prisma = (file) => path.join(__dirname, '../prisma', file)
const root = (file) => path.join(__dirname, '../../..', file)

if (process.env.NODE_ENV !== 'production') {
  const cert = await fs.readFile(root('./ssl/local.crt'), 'utf-8')
  await fs.writeFile(prisma('db.crt'), cert)
} else {
  await fs.writeFile(prisma('db.crt'), process.env.POSTGRES_CERT)
}