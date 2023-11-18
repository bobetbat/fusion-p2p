import { DeepPartial, Immutable } from '../types'

export type AppEnv = 'development' | 'test' | 'stage' | 'production'

export type Config = {
  APP_ENV: AppEnv
  PORT: number
  PRIVATE_KEY: string
}

export type ImmutableConfig = Immutable<Config>

export type ConfigOverride = DeepPartial<Config>
