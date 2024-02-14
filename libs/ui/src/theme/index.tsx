import {
  Anchor,
  Button,
  Card,
  createTheme,
  CSSVariablesResolver,
  Input,
  InputWrapper,
  LoadingOverlay,
  MantineProvider,
  Menu,
  Modal,
  Pill,
  Popover,
  Skeleton,
  Title,
} from '@mantine/core'
import { PropsWithChildren } from 'react'
import buttonClassNames from './button.module.css'
import cardClassNames from './card.module.css'
import inputClassNames from './input.module.css'
import inputWrapperClassNames from './input-wrapper.module.css'
import loadingOverlayClassNames from './loading-overlay.module.css'
import menuClassNames from './menu.module.css'
import modalClassNames from './modal.module.css'
import pillClassNames from './pill.module.css'
import popoverClassNames from './popover.module.css'
import skeletonClassNames from './skeleton.module.css'
import titleClassNames from './title.module.css'

export const theme = createTheme({
  primaryColor: 'primary',
  primaryShade: 7,
  fontFamily: 'DM Sans, sans-serif',
  defaultRadius: 'md',
  colors: {
    primary: [
      '#fbe9ff',
      '#f1cfff',
      '#df9cff',
      '#ce65fe',
      '#be38fd',
      '#b41cfd',
      '#b00dfe',
      '#9a00e3',
      '#8900cb',
      '#7700b2',
    ],
  },
  components: {
    Anchor: Anchor.extend({
      defaultProps: {
        c: 'primary.3',
      },
    }),
    Title: Title.extend({
      classNames: titleClassNames,
    }),
    Button: Button.extend({
      classNames: buttonClassNames,
    }),
    Input: Input.extend({
      classNames: inputClassNames,
    }),
    InputWrapper: InputWrapper.extend({
      classNames: inputWrapperClassNames,
    }),
    Card: Card.extend({
      classNames: cardClassNames,
    }),
    Modal: Modal.extend({
      classNames: modalClassNames,
    }),
    ModalCloseButton: Modal.CloseButton.extend({
      defaultProps: {
        size: 'lg',
      },
    }),
    Menu: Menu.extend({
      classNames: menuClassNames,
    }),
    Popover: Popover.extend({
      classNames: popoverClassNames,
    }),
    Skeleton: Skeleton.extend({
      classNames: skeletonClassNames,
    }),
    LoadingOverlay: LoadingOverlay.extend({
      classNames: loadingOverlayClassNames,
    }),
    Pill: Pill.extend({
      classNames: pillClassNames,
    }),
  },
})

const resolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {},
  dark: {
    '--mantine-color-borders': '#562281',
    '--mantine-color-text': '#ededed',
    '--mantine-color-bg': '#381452',
    '--mantine-overlay-bg': 'rgb(78 37 104 / 80%)',
    '--mantine-color-error': '#fd473a',
    '--mantine-color-dimmed': '#a2a2a2',
  },
})

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  return (
    <MantineProvider
      theme={theme}
      defaultColorScheme="dark"
      cssVariablesResolver={resolver}
    >
      {children}
    </MantineProvider>
  )
}
