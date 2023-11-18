import { Config } from './types'
require('dotenv').config()

export default function getDefaultConfig(): Config {
  return {
    APP_ENV: 'development',
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3002,
    PRIVATE_KEY: ''
  }
}
