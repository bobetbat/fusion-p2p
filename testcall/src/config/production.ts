import { ConfigOverride } from './types'

export default async function getProductionConfigOverride(): Promise<ConfigOverride> {
  return {
    APP_ENV: 'production',
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3002,
    PRIVATE_KEY: ''
  }
}
