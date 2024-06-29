import { ApiType } from '@apis/control-api'
import { hc } from 'hono/client'
import { env } from '../../env'

export const controlApi = hc<ApiType>(env.controlApi.url)
