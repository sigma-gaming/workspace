import fs from 'fs'
import path from 'path'

const source = path.resolve(process.cwd(), '../../.env.development')
const target = path.resolve(process.cwd(), '.env.development')

fs.copyFileSync(source, target)
