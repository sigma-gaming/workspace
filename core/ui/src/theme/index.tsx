import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Card,
  Checkbox,
  createTheme,
  CSSVariablesResolver,
  Input,
  InputError,
  InputWrapper,
  LoadingOverlay,
  MantineProvider,
  Menu,
  Modal,
  MultiSelect,
  Notification,
  NumberInput,
  Pill,
  Popover,
  SegmentedControl,
  Select,
  Skeleton,
  Slider,
  Switch,
  Tabs,
  Title,
} from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { PropsWithChildren } from 'react'
import { colors } from '../colors'
import { fontSizes } from '../font-sizes'
import { createFlipOptions } from '../lib/popover'
import actionIconClassNames from './action-icon.module.css'
import badgeClassNames from './badge.module.css'
import buttonClassNames from './button.module.css'
import cardClassNames from './card.module.css'
import checkboxClassNames from './checkbox.module.css'
import inputClassNames from './input.module.css'
import inputWrapperClassNames from './input-wrapper.module.css'
import loadingOverlayClassNames from './loading-overlay.module.css'
import menuClassNames from './menu.module.css'
import modalClassNames from './modal.module.css'
import multiSelectClassNames from './multi-select.module.css'
import notificationClassNames from './notification.module.css'
import notificationsClassNames from './notifications.module.css'
import numberInputClassNames from './number-input.module.css'
import pillClassNames from './pill.module.css'
import popoverClassNames from './popover.module.css'
import segmentedControlClassNames from './segmented-control.module.css'
import selectClassNames from './select.module.css'
import skeletonClassNames from './skeleton.module.css'
import sliderClassNames from './slider.module.css'
import switchClassNames from './switch.module.css'
import tabsClassNames from './tabs.module.css'
import titleClassNames from './title.module.css'

export const theme = createTheme({
  primaryColor: 'primary',
  primaryShade: 7,
  defaultRadius: 'md',
  colors,
  fontFamily: 'Rubik, sans-serif',
  fontSizes: fontSizes.reduce(
    (acc, fontSize) => {
      acc[fontSize.name] = `${fontSize.size}px`
      return acc
    },
    {} as Record<string, string>,
  ),
  components: {
    Anchor: Anchor.extend({
      defaultProps: {
        c: 'primary.3',
      },
    }),
    Notification: Notification.extend({
      classNames: notificationClassNames,
    }),
    Notifications: Notifications.extend({
      classNames: notificationsClassNames,
      defaultProps: { zIndex: 290 },
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
    InputError: InputError.extend({
      defaultProps: { display: 'none' },
    }),
    Card: Card.extend({
      classNames: cardClassNames,
    }),
    Modal: Modal.extend({
      classNames: modalClassNames,
      defaultProps: {
        zIndex: 500,
      },
    }),
    ModalCloseButton: Modal.CloseButton.extend({
      defaultProps: {
        size: 'lg',
      },
    }),
    Menu: Menu.extend({
      classNames: menuClassNames,
      defaultProps: {
        menuItemTabIndex: 0,
      },
    }),
    Popover: Popover.extend({
      classNames: popoverClassNames,
      defaultProps: {
        middlewares: {
          flip: createFlipOptions(),
        },
      },
    }),
    Skeleton: Skeleton.extend({
      classNames: skeletonClassNames,
    }),
    LoadingOverlay: LoadingOverlay.extend({
      classNames: loadingOverlayClassNames,
      defaultProps: { zIndex: 150 },
    }),
    Pill: Pill.extend({
      classNames: pillClassNames,
    }),
    MultiSelect: MultiSelect.extend({
      classNames: multiSelectClassNames,
    }),
    NumberInput: NumberInput.extend({
      classNames: numberInputClassNames,
    }),
    Select: Select.extend({
      classNames: selectClassNames,
    }),
    Switch: Switch.extend({
      classNames: switchClassNames,
    }),
    Tabs: Tabs.extend({
      classNames: tabsClassNames,
    }),
    ActionIcon: ActionIcon.extend({
      classNames: actionIconClassNames,
    }),
    SegmentedControl: SegmentedControl.extend({
      classNames: segmentedControlClassNames,
    }),
    Checkbox: Checkbox.extend({
      classNames: checkboxClassNames,
      defaultProps: { radius: 'sm' },
    }),
    Badge: Badge.extend({
      classNames: badgeClassNames,
    }),
    Slider: Slider.extend({
      classNames: sliderClassNames,
    }),
  },
})

const resolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {},
  dark: {
    '--mantine-color-borders': '#2e304d',
    '--mantine-color-text': '#C0C1D9',
    '--mantine-color-body': '#191623',
    '--mantine-color-overlay': 'rgb(37 39 60 / 80%)',
    '--mantine-color-error': '#fd473a',
    '--mantine-color-dimmed': '#9494a5',
    '--mantine-color-placeholder': 'rgb(125 126 155 / 70%)',
    '--mantine-color-input-bg': '#25273E',
    '--mantine-color-input-border-focus': 'var(--mantine-primary-color-filled)',
    '--mantine-color-input-border-error': 'var(--mantine-color-error)',
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
