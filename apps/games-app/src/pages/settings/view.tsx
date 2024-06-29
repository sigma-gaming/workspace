import { Avatar } from '@core/ui'
import { AccountProvider } from '@dbs/games-schema'
import { getUserFullName, getUserInitials } from '@games/model'
import {
  Anchor,
  Button,
  Card,
  Group,
  LoadingOverlay,
  Select,
  Skeleton,
  Space,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { Link } from 'atomic-router-react'
import { useUnit } from 'effector-react'
import { $$profile } from '../../entities/profile/index.ts'
import {
  ProviderInfoMap,
  TelegramButton,
  VkButton,
} from '../../entities/provider'
import { $$user } from '../../entities/user'
import { $$settingsPage } from './model.ts'

export const SettingsPageView = () => {
  return (
    <>
      <Profile />
      <Space h={36} />
      <SocialNetworks />
    </>
  )
}

const Profile = () => {
  const loaded = useUnit($$user.$loaded)
  const accounts = useUnit($$profile.$accounts)

  const name = useUnit($$settingsPage.profileFields.name.$value)
  const username = useUnit($$settingsPage.profileFields.username.$value)
  const provider = useUnit($$settingsPage.profileFields.provider.$value)
  const errors = useUnit($$settingsPage.profileForm.$errors)

  const updateUsername = useUnit($$settingsPage.profileFields.username.update)
  const updateProvider = useUnit($$settingsPage.profileFields.provider.update)
  const updateName = useUnit($$settingsPage.profileFields.name.update)
  const submit = useUnit($$settingsPage.profileForm.submit)

  const updatingProfile = useUnit($$settingsPage.$updatingProfile)

  return (
    <Card
      component="form"
      className="p-4 rounded-xl md:p-6 md:rounded-2xl"
      style={{ gap: 'var(--mantine-spacing-md)' }}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <LoadingOverlay visible={updatingProfile} />

      <Title order={3}>Профиль</Title>

      <Skeleton className="sm:w-fit" visible={!loaded}>
        <TextInput
          label="Никнейм"
          description="Используется для ссылки на профиль"
          placeholder="Введите никнейм"
          value={username}
          onChange={(event) => updateUsername(event.target.value)}
          error={errors.username[0]}
          spellCheck={false}
        />
      </Skeleton>

      <Skeleton className="sm:w-fit" visible={!loaded}>
        <Select
          label="Источник данных"
          description="Из какой социальной сети брать информацию для профиля"
          data={accounts.map((account) => ({
            label: ProviderInfoMap[account.provider].label,
            value: account.provider,
          }))}
          value={provider}
          onChange={(value) => updateProvider(value as AccountProvider | null)}
          allowDeselect={false}
          error={errors.provider[0]}
        />
      </Skeleton>

      <Skeleton className="sm:w-fit" visible={!loaded}>
        <TextInput
          label="Имя в профиле"
          description="Переопределить имя из социальной сети"
          placeholder="Введите имя"
          value={name}
          onChange={(event) => updateName(event.target.value)}
          error={errors.name[0]}
          spellCheck={false}
        />
      </Skeleton>

      <Skeleton className="sm:w-fit" visible={!loaded}>
        <Button
          type="submit"
          disabled={updatingProfile || !loaded}
          fullWidth={true}
        >
          Сохранить изменения
        </Button>
      </Skeleton>
    </Card>
  )
}

const SocialNetworks = () => {
  const loaded = useUnit($$profile.$loaded)
  const accounts = useUnit($$profile.$accounts)

  const vkAccount = accounts.find(
    (account) => account.provider === AccountProvider.VK,
  )

  const telegramAccount = accounts.find(
    (account) => account.provider === AccountProvider.Telegram,
  )

  const hasAllAccounts = Boolean(vkAccount && telegramAccount)

  return (
    <Card
      className="p-4 rounded-xl md:p-6 md:rounded-2xl"
      style={{ gap: 'var(--mantine-spacing-md)' }}
    >
      <Title order={3}>Социальные сети</Title>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {loaded
          ? accounts.map(
              ({
                provider,
                providerUsername,
                providerUserFirstName,
                providerUserLastName,
                providerUserImage,
              }) => {
                const fullName = getUserFullName(
                  providerUserFirstName,
                  providerUserLastName,
                )

                const initials = getUserInitials(fullName)

                const { label, profileUrl } = ProviderInfoMap[provider]

                const profileLink = providerUsername && (
                  <Anchor
                    component={Link}
                    to={profileUrl.replace('{{id}}', providerUsername)}
                    target="_blank"
                    underline="never"
                  >
                    @{providerUsername}
                  </Anchor>
                )

                return (
                  <Card
                    key={provider}
                    classNames={{
                      root: '!bg-[#25273E] rounded-xl',
                    }}
                  >
                    <div className="flex flex-row items-center gap-4">
                      {providerUserImage && (
                        <Avatar
                          src={providerUserImage}
                          fallback={initials}
                          alt={`Аватар ${label}`}
                          size={56}
                          bordered={true}
                        />
                      )}
                      <div className="flex flex-col gap-1">
                        <Title order={4}>{label}</Title>
                        <Text ff="Rubik, sans-serif" className="leading-[1.25]">
                          {fullName} {profileLink && <>({profileLink})</>}
                        </Text>
                      </div>
                    </div>
                  </Card>
                )
              },
            )
          : Array.from({ length: 2 }).map((_, index) => {
              return (
                // eslint-disable-next-line react/no-array-index-key
                <Skeleton key={index} className="rounded-xl justify-center">
                  <Card className="justify-center">
                    <Group>
                      <Skeleton circle height={56} width={56} />
                      <div className="flex flex-col gap-3">
                        <Skeleton width={100} height={20} />
                        <Skeleton width={200} height={16} />
                      </div>
                    </Group>
                  </Card>
                </Skeleton>
              )
            })}
      </div>

      {loaded && !hasAllAccounts && (
        <div className="flex flex-col sm:flex-row gap-4">
          {!vkAccount && (
            <VkButton size="sm" fullWidth={true}>
              Привязать VK ID
            </VkButton>
          )}
          {!telegramAccount && (
            <TelegramButton size="sm" fullWidth={true}>
              Привязать Telegram
            </TelegramButton>
          )}
        </div>
      )}
    </Card>
  )
}
