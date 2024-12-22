import { Gauge } from 'prom-client'
import { registry } from './registry'

export const onlineUsersGauge = new Gauge({
  name: 'games_ws_online_users',
  help: 'Number of online users',
  labelNames: ['user_type'],
})

export const connectionsGauge = new Gauge({
  name: 'games_ws_connections',
  help: 'Number of connections',
  labelNames: ['user_type'],
})

registry.registerMetric(onlineUsersGauge)
registry.registerMetric(connectionsGauge)
