import { Button, ButtonProps, createPolymorphicComponent } from '@mantine/core'
import { RouteParams } from 'atomic-router'
import { Link, LinkProps } from 'atomic-router-react'
import { forwardRef } from 'react'

export type LinkButtonProps<T extends RouteParams = RouteParams> =
  LinkProps<T> & ButtonProps

export const LinkButton = createPolymorphicComponent<'a', LinkButtonProps>(
  forwardRef<HTMLAnchorElement, LinkButtonProps>(
    ({ children, onClick, ...rest }, ref) => (
      <Button
        ref={ref}
        component={Link}
        onClick={(event) => {
          if (rest.disabled) {
            event.preventDefault()
            return
          }

          onClick?.(event)
        }}
        {...rest}
      >
        {children}
      </Button>
    ),
  ),
)
