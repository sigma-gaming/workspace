import { RouteInstance, RouteParams } from 'atomic-router'
import { ComponentType, PropsWithChildren, ReactNode } from 'react'

export type RouteLayout = (props: PropsWithChildren) => ReactNode

export type RouteRecord<Props = object, Params extends RouteParams = object> = {
  route: RouteInstance<Params> | RouteInstance<Params>[]
  layout?: RouteLayout
  view: ComponentType<Props>
}
