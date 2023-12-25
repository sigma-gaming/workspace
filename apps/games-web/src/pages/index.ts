import { createRoutesView } from 'atomic-router-react'
import { HomePage } from './home'
import { TestPage } from './test'

export const pages = [HomePage, TestPage]

export const PageViews = createRoutesView({
  routes: pages.map((page) => ({
    route: page.route,
    view: page.view,
  })),
})
