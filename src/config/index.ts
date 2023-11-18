import _ from 'lodash'
import { AppEnv, ConfigOverride, ImmutableConfig } from './types'
import getDefaultConfig from './default'
import getProductionConfigOverride from './production'
import getDevelopmentConfigOverride from './development'

let loadedConfig: ImmutableConfig | null = null

function getAppEnv(): AppEnv {
  const appEnv = process.env.APP_ENV
  if (
    appEnv !== 'development' &&
    appEnv !== 'production'
  ) {
    throw new Error(
      'APP_ENV must be set to development, production',
    )
  }
  return appEnv
}

async function getEnvConfigOverride(appEnv: AppEnv): Promise<ConfigOverride> {
  switch (appEnv) {
    case 'development':
      return getDevelopmentConfigOverride()
    case 'production':
      return getProductionConfigOverride()
    default:
      throw new Error(`Unexpected "${appEnv}" environment`)
  }
}

export async function loadConfig() {
  if (loadedConfig !== null) {
    return
  }
  const mergedConfig = _.merge(
    getDefaultConfig(),
  )
  loadedConfig = mergedConfig
}

export default function getConfig(): ImmutableConfig {
  if (loadedConfig === null) {
    throw new Error('loadConfig() needs to be called before getConfig()')
  }
  return loadedConfig
}
