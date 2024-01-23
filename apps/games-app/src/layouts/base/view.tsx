import { rem, Title } from '@mantine/core'
import { IconCategory2, IconDice3 } from '@tabler/icons-react'
import { Link } from 'atomic-router-react'
import { memo, PropsWithChildren, SVGProps } from 'react'
import { routes } from '../../routing'
import { LinkButton } from '../../shared/ui/general/link-button'
import { MiniProfile } from './mini-profile.tsx'
import css from './styles.module.css'

export const BaseLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="flex flex-col px-4 pb-8">
      <Header />
      <div className="flex flex-col md:flex-row gap-8">
        <Left />
        <main className="grow">{children}</main>
      </div>
    </div>
  )
}

const Left = memo(() => {
  return (
    <aside className="hidden md:flex w-64 flex-col gap-4">
      <LinkButton
        to={routes.home}
        size="lg"
        color="#4a115e"
        leftSection={
          <IconCategory2 style={{ width: rem(24), height: rem(24) }} />
        }
        activeClassName={css.leftLinkActive}
      >
        Главная
      </LinkButton>
      <LinkButton
        to={routes.dicesGame}
        size="lg"
        color="#4a115e"
        leftSection={<IconDice3 style={{ width: rem(24), height: rem(24) }} />}
        activeClassName={css.leftLinkActive}
      >
        Dices
      </LinkButton>
    </aside>
  )
})

const Header = memo(() => {
  console.log('render header')

  return (
    <header className="flex gap-6 items-center justify-between py-6 md:py-8">
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
