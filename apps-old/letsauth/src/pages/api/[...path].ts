import { APIRoute } from 'astro'
import { api } from '../../api/api'

export const prerender = false
export const ALL: APIRoute = ({ request }) => api.fetch(request)
