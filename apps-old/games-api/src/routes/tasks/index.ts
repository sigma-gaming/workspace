import { createRouter } from '../../app/router'
import { tasksGlobalRouter } from './global'

export const tasksRouter = createRouter().route('/global', tasksGlobalRouter)
