import { RouteInstance, RouteParams } from 'atomic-router'
import { ComponentType, ReactNode } from 'react'

export type RouteLayout = (props: { children: ReactNode }) => ReactNode

export interface RouteRecord<
  Props = object,
  Params extends RouteParams = object,
> {
  title?: string
  route: RouteInstance<Params> | RouteInstance<Params>[]
  layout?: RouteLayout
  view: ComponentType<Props>
}
