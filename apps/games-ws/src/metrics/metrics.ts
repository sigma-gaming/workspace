import { Counter, Gauge } from 'prom-client'
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

export const connectedTotalCounter = new Counter({
  name: 'games_ws_connected_total',
  help: 'Number of times users connected to the server',
  labelNames: ['user_type'],
})

export const disconnectedTotalCounter = new Counter({
  name: 'games_ws_disconnected_total',
  help: 'Number of times users disconnected from the server',
  labelNames: ['user_type'],
})

export const eventsReceivedTotalCounter = new Counter({
  name: 'games_ws_events_received_total',
  help: 'Number of events received by the server',
  labelNames: ['user_type'],
})

export const eventsSentTotalCounter = new Counter({
  name: 'games_ws_events_sent_total',
  help: 'Number of events sent by the server',
  labelNames: ['user_type', 'emit_scope'],
})

export const errorsTotalCounter = new Counter({
  name: 'games_ws_errors_total',
  help: 'Number of errors',
  labelNames: ['user_type'],
})

registry.registerMetric(onlineUsersGauge)
registry.registerMetric(connectionsGauge)
registry.registerMetric(connectedTotalCounter)
registry.registerMetric(disconnectedTotalCounter)
registry.registerMetric(eventsReceivedTotalCounter)
registry.registerMetric(eventsSentTotalCounter)
registry.registerMetric(errorsTotalCounter)
