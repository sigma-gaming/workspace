import { Avatar, AvatarProps, createPolymorphicComponent } from '@mantine/core'
import { forwardRef } from 'react'

export const AvatarBordered = createPolymorphicComponent<'div', AvatarProps>(
  forwardRef<HTMLDivElement, AvatarProps>(({ children, ...rest }, ref) => {
    return (
      <Avatar
        ref={ref}
        {...rest}
        classNames={{
          image: 'rounded-full border border-2 p-[2px] border-sigma-600',
          ...rest.classNames,
        }}
      >
        {children}
      </Avatar>
    )
  }),
)
