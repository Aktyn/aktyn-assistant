import fs from 'fs'
import path from 'path'

import { once } from '@aktyn-assistant/common'
import { pino, type BaseLogger, type LogFn, type LoggerOptions } from 'pino'
import { multistream, type Streams } from 'pino-multi-stream'

import { getDataDirectory } from './external-data'

const logsDirectory = path.join(getDataDirectory(), 'logs')
const MONTH = 1000 * 60 * 60 * 24 * 30

export const initLogger = once(
  (
    fileSuffix?: string,
    {
      disableStdout,
      ...options
    }: Partial<LoggerOptions & { disableStdout?: boolean }> = {},
  ) => {
    if (!fs.existsSync(logsDirectory)) {
      fs.mkdirSync(logsDirectory, { recursive: true })
    }

    const dateKey = new Date()
      .toLocaleDateString('en-GB')
      .split('/')
      .reverse()
      .join('-')

    const logFileName = path.join(
      logsDirectory,
      `${['aktyn', 'assistant', dateKey, fileSuffix].filter(Boolean).join('-')}.log`,
    )

    const fileDestination = pino.destination({
      dest: logFileName,
      sync: false,
      append: true,
      mkdir: true,
    })

    const streams: Array<Streams[number] | null> = [
      !disableStdout ? { stream: process.stdout, level: 'info' } : null,
      { stream: fileDestination, level: 'debug' },
    ]

    const logger = pino(
      {
        safe: true,
        timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
        level: 'info',
        messageKey: 'message',
        errorKey: 'error',
        base: null,
        ...options,
      },
      multistream(streams.filter((stream) => stream !== null)),
    )

    try {
      cleanupOldLogs()
    } catch (error) {
      logger.error(error, 'Error while cleaning up old logs')
    }

    return logger
  },
)

function cleanupOldLogs(time = MONTH) {
  const logFiles = fs.readdirSync(logsDirectory)
  const now = Date.now()
  for (const logFile of logFiles) {
    const logFilePath = path.join(logsDirectory, logFile)
    const stat = fs.statSync(logFilePath)
    if (now - stat.mtime.getTime() > time) {
      fs.unlinkSync(logFilePath)
    }
  }
}

type LogFunctionName = {
  [key in keyof BaseLogger]: BaseLogger[key] extends LogFn ? key : never
}[keyof BaseLogger]

const logFunctions: LogFunctionName[] = [
  'debug',
  'info',
  'fatal',
  'error',
  'warn',
  'trace',
  'silent',
]

export const logger = Object.fromEntries(
  logFunctions.map((functionName) => [
    functionName,
    (...args: Parameters<LogFn>) => initLogger()[functionName](...args),
  ]),
) as Record<LogFunctionName, LogFn>
