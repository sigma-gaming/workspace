import { Card, rem, Text, Title } from '@mantine/core'
import { IconCategory2, IconDice3 } from '@tabler/icons-react'
import { RouteInstance, RouteParams } from 'atomic-router'
import { Link } from 'atomic-router-react'
import { memo, PropsWithChildren, ReactNode, SVGProps } from 'react'
import { routes } from '../../routing/index.ts'
import { MiniProfile } from './mini-profile.tsx'

export const BaseLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex flex-col pb-8">
      <Header />
      <div className="flex flex-col md:flex-row gap-4">
        <Left />
        <main className="grow px-4">{children}</main>
      </div>
    </div>
  )
}

const MenuLink = ({
  to,
  icon,
  children,
}: PropsWithChildren<{
  to: RouteInstance<RouteParams>
  icon: ReactNode
}>) => {
  return (
    <Link
      to={to}
      className="px-4 md:px-10 py-2 md:py-3 inline-flex gap-4 text-center items-center"
      activeClassName="bg-sigma-100"
    >
      {icon}
      <Text className="text-md md:text-lg" fw={600}>
        {children}
      </Text>
    </Link>
  )
}

const Left = memo(() => {
  return (
    <Card className="md:w-64 mx-4 md:mx-0 px-0 py-2 md:py-4 h-fit md:rounded-l-none">
      <MenuLink
        to={routes.home}
        icon={<IconCategory2 style={{ width: rem(24), height: rem(24) }} />}
      >
        Главная
      </MenuLink>
      <MenuLink
        to={routes.dicesGame}
        icon={<IconDice3 style={{ width: rem(24), height: rem(24) }} />}
      >
        Dices
      </MenuLink>
    </Card>
  )
})

const Header = memo(() => {
  return (
    <header className="flex gap-6 items-center justify-between px-4 py-6 md:py-8">
      <div className="md:w-64 md:px-5 flex gap-[10px] items-center">
        <Link
          to={routes.home}
          className="md:w-full md:px-4 flex items-center justify-between"
        >
          <Logo />
          <Title className="hidden md:block" order={1} size={40}>
            Sigma
          </Title>
        </Link>
      </div>
      <MiniProfile />
    </header>
  )
})

const Logo = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <circle cx="7" cy="8" r="4.5" stroke="#FA00FF" strokeWidth="3" />
      <path
        d="M13.5 3.5L7.5 3.5H7.02494C4.33453 3.5 2.23229 5.82295 2.5 8.5V8.5"
        stroke="url(#paint0_linear_4_4)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient
          id="paint0_linear_4_4"
          x1="7"
          y1="3.5"
          x2="2.5"
          y2="8.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9B00E4" />
          <stop offset="1" stopColor="#9B00E4" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}
