import { AccountProvider, getFullName } from '@libs/games-model'
import {
  Anchor,
  Avatar,
  Button,
  Card,
  Group,
  Input,
  LoadingOverlay,
  Select,
  SimpleGrid,
  Skeleton,
  Space,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { Link } from 'atomic-router-react'
import { useUnit } from 'effector-react'
import {
  ProviderInfoMap,
  TelegramButton,
  VkButton,
} from '../../entities/provider'
import { $$user } from '../../entities/user'
import { BaseLayout } from '../../layouts/base'
import { $$settingsPage } from './model.ts'

export const SettingsPageView = () => {
  return (
    <BaseLayout>
      <Title>Настройки</Title>
      <Space h="xl" />
      <Profile />
      <Space h="xl" />
      <SocialNetworks />
    </BaseLayout>
  )
}

const Profile = () => {
  const loaded = useUnit($$user.$loaded)
  const accounts = useUnit($$user.$accounts)

  const usedProvider = useUnit($$settingsPage.$usedProvider)
  const changeUsedProvider = useUnit($$settingsPage.changeUsedProvider)

  const name = useUnit($$settingsPage.$name)
  const changeName = useUnit($$settingsPage.changeName)

  const updatingProfile = useUnit($$settingsPage.$updatingProfile)
  const submitProfile = useUnit($$settingsPage.submitProfile)

  return (
    <Card
      component="form"
      style={{ gap: 'var(--mantine-spacing-md)' }}
      onSubmit={(event) => {
        event.preventDefault()
        submitProfile()
      }}
    >
      <LoadingOverlay visible={updatingProfile} />

      <Title order={3}>Профиль</Title>

      <Skeleton visible={!loaded} width="fit-content">
        <Select
          label="Источник данных"
          description="Из какой социальной сети брать информацию для профиля"
          data={accounts.map((account) => ({
            label: ProviderInfoMap[account.provider].label,
            value: account.provider,
          }))}
          value={usedProvider}
          onChange={(value) => changeUsedProvider(value as AccountProvider)}
          allowDeselect={false}
        />
      </Skeleton>

      <Skeleton visible={!loaded} width="fit-content">
        <TextInput
          label="Имя в профиле"
          description="Переопределить имя из социальной сети"
          value={name}
          onChange={(event) => changeName(event.target.value)}
        />
      </Skeleton>

      <Skeleton visible={!loaded} width="fit-content">
        <Button type="submit" disabled={updatingProfile || !loaded}>
          Сохранить изменения
        </Button>
      </Skeleton>
    </Card>
  )
}

const SocialNetworks = () => {
  const loaded = useUnit($$user.$loaded)
  const accounts = useUnit($$user.$accounts)

  const vkAccount = accounts.find(
    (account) => account.provider === AccountProvider.VK,
  )

  const telegramAccount = accounts.find(
    (account) => account.provider === AccountProvider.Telegram,
  )

  const hasAllAccounts = Boolean(vkAccount && telegramAccount)

  return (
    <Card style={{ gap: 'var(--mantine-spacing-md)' }}>
      <Title order={3}>Социальные сети</Title>

      {!hasAllAccounts && (
        <Group>
          {!vkAccount && (
            <Skeleton visible={!loaded} width="fit-content">
              <VkButton size="sm">Привязать VK ID</VkButton>
            </Skeleton>
          )}
          {!telegramAccount && (
            <Skeleton visible={!loaded} width="fit-content">
              <TelegramButton size="sm">Привязать Telegram</TelegramButton>
            </Skeleton>
          )}
        </Group>
      )}

      {!loaded && (
        <SimpleGrid className="h-24" cols={2}>
          {Array.from({ length: 2 }).map((_, index) => {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <Card key={index} className="justify-center">
                <Group>
                  <Skeleton circle height={56} width={56} />
                  <Stack gap={12}>
                    <Skeleton width={100} height={20} />
                    <Skeleton width={200} height={16} />
                  </Stack>
                </Group>
              </Card>
            )
          })}
        </SimpleGrid>
      )}

      {loaded && (
        <SimpleGrid className="h-24" cols={accounts.length}>
          {accounts.map(
            ({
              provider,
              providerUsername,
              providerUserFirstName,
              providerUserLastName,
              providerUserImage,
            }) => {
              const fullName = getFullName(
                providerUserFirstName,
                providerUserLastName,
              )

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
                <Card key={provider} className="justify-center">
                  <Group>
                    {providerUserImage && (
                      <Avatar
                        src={providerUserImage}
                        size={48}
                        classNames={{
                          root: 'overflow-visible m-1',
                          image:
                            'rounded-full outline outline-2 outline-offset-2 outline-sigma-600',
                        }}
                      />
                    )}
                    <Stack gap={4}>
                      <Title order={4}>{label}</Title>
                      <Text ff="Rubik, sans-serif">
                        {fullName} {profileLink && <>({profileLink})</>}
                      </Text>
                    </Stack>
                  </Group>
                </Card>
              )
            },
          )}
        </SimpleGrid>
      )}
    </Card>
  )
}
