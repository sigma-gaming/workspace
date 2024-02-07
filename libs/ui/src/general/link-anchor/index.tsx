import { Anchor, AnchorProps, createPolymorphicComponent } from '@mantine/core'
import { RouteParams } from 'atomic-router'
import { Link, LinkProps } from 'atomic-router-react'
import { forwardRef } from 'react'

export type LinkAnchorProps<T extends RouteParams = RouteParams> =
  LinkProps<T> & AnchorProps

export const LinkAnchor = createPolymorphicComponent<'a', LinkAnchorProps>(
  forwardRef<HTMLAnchorElement, LinkAnchorProps>(
    ({ children, onClick, ...rest }, ref) => (
      <Anchor ref={ref} component={Link} {...rest}>
        {children}
      </Anchor>
    ),
  ),
)
