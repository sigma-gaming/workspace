# API Interaction Guidelines

## Overview

This document describes patterns for interacting with APIs in our frontend applications. The guidelines focus on using Effector for API calls and state management, with integration of Farfetched for simpler cases.

## API Client Creation

We use Hono client to create strongly-typed API instances:

```typescript
// shared/api/games/index.ts
import { ApiType } from '@apis/games-api'
import { hc } from 'hono/client'
import { env } from '../../env'

export const gamesApi = hc<ApiType>(env.gamesApi.url, {
  fetch(input, init) {
    return fetch(input, { ...init, credentials: 'include' })
  }
})
```

Key points about API clients:
- Created in `/shared/api/{api-name}` directory
- Use Hono's `hc` function to create a Proxy object
- Structure mirrors the API routes structure
- Typed using `ApiType` exported from API packages
- Each endpoint is an async function that needs to be wrapped in an Effect
- Can be used with `createApiEffect` or directly in Farfetched queries/mutations

### API Structure Example

```typescript
// API routes structure in apps/games-api/src/app.ts
app
  .route('/chat', chatRouter)
  .route('/me', meRouter)
  .route('/settings', settingsRouter)
  // ...

// Subroutes example in apps/games-api/src/routes/chat/index.ts
chatRouter
  .route('/getLastMessages', getLastMessagesRoute)
  .route('/sendMessage', sendMessageRoute)

// Generated API client structure matches route composition
gamesApi.chat.getLastMessages.$get()    // GET /chat/getLastMessages
gamesApi.chat.sendMessage.$post()       // POST /chat/sendMessage
gamesApi.me.profile.$get()              // GET /me/profile
gamesApi.settings.notifications.$put()   // PUT /settings/notifications
```

The Proxy structure of the API client mirrors how routes are composed using Hono's `.route()` method in the API codebase. Each route module can define its own subroutes, and the client's type structure follows this hierarchy.

## API Effect Creation

We use a centralized approach for creating API effects using the `createApiEffect` factory. Since API endpoints from Hono client are regular async functions, they need to be wrapped in Effects to be used with Effector:

```typescript
// shared/api/effects.ts
import { createApiEffectFactory } from '@core/client'

export const createApiEffect = createApiEffectFactory()

// Usage in model
const getLastMessagesFx = createApiEffect(
  'query',
  gamesApi.chat.getLastMessages.$get
)

// Or with Farfetched
const notificationsQuery = createQuery({
  name: 'notifications/get',
  effect: createApiEffect('query', gamesApi.notifications.getAll.$get)
})
```

The wrapped API function becomes an Effect that can be:
- Used directly as a target in samples
- Used as a trigger for other operations
- Used in Farfetched queries/mutations
- Combined with other Effects in complex flows

### Basic Usage

1. **Simple API Effect**:
```typescript
const getProfileFx = createApiEffect('query', gamesApi.me.profile.$get)
const updateSettingsFx = createApiEffect('json', gamesApi.settings.notifications.$put)

// Usage
const $profile = createStore(null)
  .on(getProfileFx.doneData, (_, profile) => profile)

const $settings = createStore(defaultSettings)
  .on(updateSettingsFx.doneData, (_, newSettings) => newSettings)
```

2. **With Farfetched**:
```typescript
const balanceQuery = createQuery({
  name: 'balance/get',
  effect: createApiEffect('query', gamesApi.balance.get.$get)
})

const sendMessageMutation = createMutation({
  name: 'chat/sendMessage',
  effect: createApiEffect('json', gamesApi.chat.sendMessage.$post)
})
```

## Effect Types

1. **'query'** - For GET requests:
   - Used for data fetching
   - Automatically handles response parsing
   - Best for read operations

2. **'json'** - For POST/PUT/DELETE requests:
   - Used for data modifications
   - Handles JSON request/response
   - Best for write operations

## API Integration Patterns

### 1. Simple Data Fetching

```typescript
// Direct effect usage
const getBalanceFx = createApiEffect(
  'query',
  gamesApi.balance.get.$get
)

// Store updates
const $balance = createStore(null)
  .on(getBalanceFx.doneData, (_, balance) => balance)

// Trigger fetching
sample({
  clock: pageStarted,
  target: getBalanceFx
})
```

### 2. Data Mutations

```typescript
// Create mutation
const updateProfileMutation = createMutation({
  name: 'settings/updateProfile',
  effect: createApiEffect('json', gamesApi.settings.updateProfile.$put)
})

// Handle form submission
sample({
  source: form.submitted,
  target: updateProfileMutation.start
})

// Handle response
sample({
  clock: updateProfileMutation.finished.success,
  target: showSuccessNotification
})
```

### 3. Complex Data Operations

```typescript
// Multiple API calls
sample({
  clock: pageStarted,
  target: [
    loadUserProfile,
    loadUserSettings,
    loadUserPreferences
  ]
})

// Sequential operations
sample({
  clock: userUpdated,
  target: updateUserFx
})

sample({
  clock: updateUserFx.done,
  target: reloadUserData
})
```

## Farfetched Integration

### When to Use Farfetched

1. **Simple Cases**:
   - Basic CRUD operations
   - Standard REST endpoints
   - No complex cache management needed
   - Automatic loading states required

```typescript
// Good Farfetched usage
const getSettingsQuery = createQuery({
  name: 'settings/get',
  effect: createApiEffect('query', api.settings.get.$get)
})

const updateSettingsMutation = createMutation({
  name: 'settings/update',
  effect: createApiEffect('json', api.settings.update.$put)
})
```

### When to Use Direct Effects

1. **Complex Cases**:
   - Custom cache invalidation
   - Complex data transformations
   - Manual state management
   - Multiple dependent operations

```typescript
// Complex case with direct effects
const updateUserFx = createApiEffect('json', api.user.update.$post)

sample({
  clock: userUpdated,
  source: { user: $user, settings: $settings },
  fn: ({ user, settings }, update) => ({
    ...update,
    settings: settings.preferences
  }),
  target: updateUserFx
})
```

## Error Handling

1. **Using handleExceptions**:
```typescript
handleExceptions(updateProfileMutation, { form })
```

2. **Manual Error Handling**:
```typescript
sample({
  clock: updateUserFx.failData,
  fn: (error) => ({
    message: 'Failed to update user',
    details: error.message
  }),
  target: showErrorNotification
})
```

## Loading States

1. **With Farfetched**:
```typescript
const $loading = getUserQuery.$pending
```

2. **With Direct Effects**:
```typescript
const $loading = createStore(false)
  .on(fetchUserFx, () => true)
  .on(fetchUserFx.finally, () => false)
```

## Best Practices

1. **API Organization**:
   - Keep API definitions centralized
   - Use typed API clients
   - Group related endpoints

2. **Effect Creation**:
   - Use appropriate effect type
   - Keep effects close to their usage
   - Use descriptive names

3. **State Management**:
   - Keep API state separate from UI state
   - Use appropriate caching strategy
   - Handle loading and error states

4. **Error Handling**:
   - Always handle API errors
   - Provide user feedback
   - Log errors appropriately

5. **Performance**:
   - Use caching when appropriate
   - Cancel unnecessary or excessive requests

## Common Patterns

1. **Form Submission**:
```typescript
// Create mutation
const submitFormMutation = createMutation({
  name: 'form/submit',
  effect: createApiEffect('json', api.form.submit.$post)
})

// Connect form
sample({
  clock: form.submitted,
  target: submitFormMutation.start
})

// Handle response
sample({
  clock: submitFormMutation.finished.success,
  target: [
    showSuccessNotification,
    resetForm,
    reloadData
  ]
})
```

2. **Data Prefetching**:
```typescript
// Create query
const getDataQuery = createQuery({
  name: 'data/get',
  effect: createApiEffect('query', api.data.get.$get)
})

// Load on route open
sample({
  clock: routes.page.opened,
  target: getDataQuery.start
})
```

3. **Conditional Updates**:
```typescript
// Update only if data changed
sample({
  clock: dataChanged,
  source: $currentData,
  filter: (current, update) => !isEqual(current, update),
  target: updateDataFx
})
```

## See Also

- [App Architecture Guidelines](./app-architecture.md) for overall application structure
- [Effector Guidelines](./effector.md) for Effector-specific patterns