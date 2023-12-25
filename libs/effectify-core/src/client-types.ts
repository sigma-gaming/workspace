import {
  RouteInstance,
  RouteParams,
  RouteParamsAndQuery,
  RouteQuery,
} from 'atomic-router'
import { Event, Store } from 'effector'
import { Request, Response } from 'express'
import { ReactElement } from 'react'

export interface CacheSettings<TParams extends RouteParams = RouteParams> {
  key?:
    | string
    | Store<string>
    | ((options: { url: string; params: TParams; query: RouteQuery }) => string)
  ttl?: number
}

export interface ViewSettings {
  render: () => ReactElement
}

export interface MetaSettings {
  head?: () => ReactElement
  body?: () => ReactElement
}

export interface Page<TParams extends RouteParams = RouteParams> {
  route: RouteInstance<TParams>
  view: () => ReactElement
  meta?: MetaSettings
  cache?: CacheSettings<TParams>
}

export interface PageEvents<TParams extends RouteParams = RouteParams> {
  opened: Event<RouteParamsAndQuery<TParams>>
  closed: Event<void>
}

export interface Context {
  req?: Request
  res?: Response
}
