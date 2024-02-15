import { Avatar, AvatarProps, createPolymorphicComponent } from '@mantine/core'
import { forwardRef } from 'react'

export const AvatarBordered = createPolymorphicComponent<'div', AvatarProps>(
  forwardRef<HTMLDivElement, AvatarProps>(({ children, ...rest }, ref) => {
    return (
      <Avatar
        {...rest}
        ref={ref}
        classNames={{
          image: 'rounded-full border-2 p-[2px] border-sigma-600',
        }}
      >
        {children}
      </Avatar>
    )
  }),
)
