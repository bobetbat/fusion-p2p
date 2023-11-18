import { ConfigOverride } from './types'

export default async function getDevelopmentConfigOverride(): Promise<ConfigOverride> {
  return {
    APP_ENV: 'development',
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3002,
    PRIVATE_KEY: ''
  }
}
