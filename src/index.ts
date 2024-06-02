import * as dotenv from 'dotenv'
import { expand } from 'dotenv-expand'

expand(dotenv.config())

// eslint-disable-next-line no-console
console.log('Hello world!', process.env.NODE_ENV, process.env.OPENAI_API_KEY)
