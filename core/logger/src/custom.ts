type Level = 'error' | 'warn' | 'info' | 'debug'

type Log = {
  level: Level
  message: string
}

type Target = (log: Log) => void

type LoggerOptions = {
  name?: string
  level?: Level
  target?: Target
}

const LEVEL_WEIGHTS: Record<Level, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}

function generateLog(level: Level, args: any[]): Log {
  let message = ''

  for (const arg of args) {
    message += `${arg} `
  }

  return { level, message }
}

function mergeNames(name: string | undefined, childName: string) {
  if (!name) return childName
  return `${name} > ${childName}`
}

export const targets = {
  consoleJson: (log) => {
    console.log(log)
  },
  consolePretty: (log) => {
    console[log.level](`[${log.level}] ${log.message}`)
  },
} satisfies Record<string, Target>

function createLogger(options: LoggerOptions) {
  const { name, level = 'info', target = targets.consolePretty } = options

  return {
    error: (...args: any[]) => {
      if (LEVEL_WEIGHTS[level] < LEVEL_WEIGHTS.error) return
      const log = generateLog('error', args)
      target(log)
    },
    warn: (...args: any[]) => {
      if (LEVEL_WEIGHTS[level] < LEVEL_WEIGHTS.warn) return
      const log = generateLog('warn', args)
      target(log)
    },
    info: (...args: any[]) => {
      if (LEVEL_WEIGHTS[level] < LEVEL_WEIGHTS.info) return
      const log = generateLog('info', args)
      target(log)
    },
    debug: (...args: any[]) => {
      if (LEVEL_WEIGHTS[level] < LEVEL_WEIGHTS.debug) return
      const log = generateLog('debug', args)
      target(log)
    },
    child: (childName: string, options: Omit<LoggerOptions, 'name'>) => {
      return createLogger({
        level,
        target,
        ...options,
        name: mergeNames(name, childName),
      })
    },
  }
}

export const customLogger = createLogger({ level: 'info' })
