# Effector Guidelines

This document describes Effector-specific patterns and practices within our application architecture. For general application architecture guidelines, see [App Architecture Guidelines](./app-architecture.md). For API interaction patterns, see [API Interaction Guidelines](./api-interaction.md).

## Application Layers Reference

### App Layer
- Highest level of the application
- Responsible for application initialization and global state management
- Contains app-wide configurations and bootstrapping logic
- Example: `app/model.ts` handles initial app loading, session management, and global error handling

### Pages Layer
- Represents entire pages/routes in the application
- Manages page-specific business logic and state
- Orchestrates features and widgets used on the page
- Example: `pages/games-dice/model.ts` manages the dice game page state and game flow

### Features Layer
- Implements specific business features
- Contains isolated business logic that can be reused across different pages
- Examples:
  - `features/game-history` - manages game history tracking
  - `features/maintenance` - handles maintenance mode logic
  - `features/ping` - manages server connection status

### Widgets Layer
- Represents complex UI components with their own business logic
- Can be reused across different pages
- More complex than pure UI components but less than features
- Example: `widgets/chat` manages chat functionality with its own state and logic

### Entities Layer
- Contains core business entities and their logic
- Represents the data model and global business rules
- Most reusable layer, used by all other layers
- Examples:
  - `entities/user` - user data and operations
  - `entities/session` - authentication state
  - `entities/balance` - balance management

## Naming Conventions

1. Stores:
   - Prefix with `$` to indicate a store
   - Examples: `$user`, `$loading`, `$settings`

2. Effects:
   - Suffix with `Fx` to indicate an effect
   - Examples: `fetchUserFx`, `updateSettingsFx`, `loadDataFx`

3. Events:
   - Use clear, action-based names
   - Examples: `initialize`, `userLoggedIn`, `settingsUpdated`

4. Model Exports:
   - Prefix with `$$` to indicate a model public API object
   - Examples: `$$user`, `$$session`, `$$settings`

## Layer-Specific Model Patterns

Following our [application architecture](./app-architecture.md), here's how Effector is typically used in each layer:

### App Layer Models
- Global state initialization
- Cross-cutting concerns (auth, theme, etc.)
- App-wide error handling
- Example:
```typescript
// app/model.ts
const appStarted = createEvent()
const $appReady = createStore(false)

sample({
  clock: appStarted,
  target: [initializeAuth, loadSettings, setupAnalytics]
})
```

### Pages Layer Models
- Page-specific state
- Route parameters handling
- Data fetching orchestration
- Example:
```typescript
// pages/profile/model.ts
const pageStarted = createEvent()
const $pageData = createStore(null)

sample({
  clock: pageStarted,
  target: [loadUserProfile, loadUserSettings]
})
```

### Features Layer Models
- Feature-specific business logic
- Independent state management
- API integration
- Example:
```typescript
// features/auth/model.ts
const loginPressed = createEvent()
const $user = createStore(null)

sample({
  clock: loginPressed,
  target: authenticateUserFx
})
```

### Widgets Layer Models
- Widget state-management and business logic
- Example:
```typescript
// widgets/chat/model.ts
const messageSent = createEvent()
const $messages = createStore([])

sample({
  clock: messageSent,
  target: sendMessageFx
})
```

### Entities Layer Models
- Pure business logic
- Data transformations
- Entity state management
- Example:
```typescript
// entities/user/model.ts
const userUpdated = createEvent()
const $user = createStore(null)

sample({
  clock: userUpdated,
  target: updateUserFx
})
```

## Effector Primitives Reference

### Event
- Basic building block for user actions and side effects
- Used for triggering state changes and effects
- Can be used in UI components to trigger the logic in model layer
- Examples:
```typescript
const initialize = createEvent()
const reset = createEvent()
const userLoggedIn = createEvent<User>()
```

### Store
- Holds application state
- Updates in response to events and effects
- Can be combined and derived
- Examples:
```typescript
const $user = createStore<User | null>(null)
const $loggedIn = $user.map(Boolean)
```

### Effect
- Handles async operations / side effects
- Built-in loading states and error handling
- Can be used with any async code
- Is an async function that can be used as an event
- Examples:
```typescript
// Basic effect creation with API
const getProfileFx = createApiEffect('query', gamesApi.me.profile.$get)

// Using effect as target
sample({
  source: profileRequested,
  target: getProfileFx
})

// Using effect as trigger
sample({
  clock: getProfileFx,  // Effect itself is a trigger
  target: profileRequestStarted
})

// Effect as loading trigger
const $loading = createStore(false)
  .on(getProfileFx, () => true)           // Effect starts
  .on(getProfileFx.finally, () => false)  // Effect completes
```

### Sample
- Combines multiple stores/events
- Controls data flow and updates
- Used for complex state dependencies
- Examples:
```typescript
// Update settings when user changes preferences
sample({
  clock: preferencesChanged,
  source: $settings,
  fn: (settings, newPrefs) => ({ ...settings, ...newPrefs }),
  target: createApiEffect('json', gamesApi.settings.notifications.$put)
})
```

### Attach
- Creates new effects from existing ones
- Allows adding extra parameters from stores
- Used for effect composition
- Examples:
```typescript
// Add auth token to API call
const sendMessageWithAuthFx = attach({
  source: $authToken,
  effect: createApiEffect('json', gamesApi.chat.sendMessage.$post),
  mapParams: (params, token) => ({ ...params, token })
})
```

### Combine
- Combines multiple stores into a single store
- Used for complex state dependencies and derived state from multiple stores
- Examples:
```typescript
const $loggedInAsAdmin = combine(
  $user,
  $settings,
  (user, settings) => Boolean(user && settings.isAdmin)
)
```

## Effector Entity Interactions

### Store Updates

1. Using `.on()`:
```typescript
// Direct update
const $counter = createStore(0)
  .on(increment, (state) => state + 1)
  .on(decrement, (state) => state - 1)

// Update with payload
const $user = createStore(null)
  .on(userUpdated, (_, newUser) => newUser)
  .on(userPatched, (current, patch) => ({ ...current, ...patch }))

// Multiple sources
const $settings = createStore({})
  .on(themeChanged, (state, theme) => ({ ...state, theme }))
  .on(languageChanged, (state, language) => ({ ...state, language }))
```

2. Using `sample`:
```typescript
// Basic targeting
sample({
  source: userUpdated,
  target: $user
})

// With transformation
sample({
  clock: profileUpdated,
  source: $user,
  fn: (user, update) => ({ ...user, ...update }),
  target: $user
})

// Multiple sources
sample({
  clock: settingsUpdated,
  source: { user: $user, theme: $theme },
  fn: ({ user, theme }, newSettings) => ({
    ...newSettings,
    theme: theme ?? 'light',
    userId: user?.id
  }),
  target: $settings
})
```

### Effect Events

Effects provide several events for handling different outcomes and can be used as events themselves:

1. **Basic Events**:
```typescript
const fetchUserFx = createEffect(async (id: string) => {
  const user = await api.getUser(id)
  return user
})

// Effect as event trigger
$userRequesting
  .on(fetchUserFx, () => true)           // Effect starts
  .on(fetchUserFx.finally, () => false)  // Effect completes

// Without data access
$loading
  .on(fetchUserFx.done, () => false)    // Just need completion status
  .on(fetchUserFx.fail, () => false)    // Just need failure status

// With data access
$user
  .on(fetchUserFx.doneData, (_, user) => user)        // Need response data
  .on(fetchUserFx.failData, (state, error) => null)   // Need error data
```

2. **Effect Events Usage**:
```typescript
// Effect as target
sample({
  source: userRequested,
  target: fetchUserFx  // Direct usage as target
})

// Effect as trigger
sample({
  clock: fetchUserFx,  // Direct usage as trigger
  target: trackUserRequest
})

// done - when success status is enough
sample({
  clock: fetchUserFx.done,
  target: showSuccessNotification
})

// fail - when failure status is enough
sample({
  clock: fetchUserFx.fail,
  target: showErrorNotification
})

// doneData - when you need the response data
sample({
  source: fetchUserFx.doneData,
  target: $user
})

// failData - when you need the error details
sample({
  source: fetchUserFx.failData,
  fn: (error) => `Error: ${error.message}`,
  target: $errorMessage
})
```

3. **Combining Effect Events**:
```typescript
// Handle loading states
const $loading = createStore(false)
  .on(fetchUserFx, () => true)           // Effect starts
  .on(fetchUserFx.finally, () => false)  // Effect completes

// Complex error handling
sample({
  clock: fetchUserFx.failData,
  source: $retryCount,
  fn: (retries, error) => {
    if (retries < 3) return { shouldRetry: true, error }
    return { shouldRetry: false, error }
  },
  target: handleErrorFx
})
```

### Common Patterns

1. **Store Reset**:
```typescript
const $store = createStore(initialValue)
  .reset(resetTrigger)    // Reset to initial value
  .reset($anotherStore)    // Reset when another store changes
```

2. **Conditional Updates**:
```typescript
// Using filter in sample
sample({
  clock: userUpdated,
  source: $user,
  filter: (user, update) => user !== null,
  target: updateUserFx
})

// Using guards
guard({
  source: userUpdated,
  filter: $isAuthenticated,
  target: updateUserFx
})
```

3. **Derived State**:
```typescript
// Using .map
const $userName = $user.map(user => user?.name ?? 'Guest')

// Using combine
const $userStatus = combine(
  $user,
  $lastActivity,
  (user, lastActivity) => {
    if (!user) return 'offline'
    return Date.now() - lastActivity < 5000 ? 'online' : 'away'
  }
)
```

## Ecosystem Libraries Reference

### effector-react
- React bindings for Effector
- Key features:
  - `useUnit` - hook for using stores in components

### patronum
- Utility library with additional operators
- Key features:
  - `debounce` - debounces events/effects
  - `throttle` - throttles events/effects
  - `status` - creates status store for effects
  - `and` - creates derived boolean store from multiple stores, contains true when all store values are truthy
  - `or` - creates derived boolean store from multiple stores, contains true when any store values are truthy
  - `not` - creates derived boolean store from a single store, contains true when the store value is falsy

### atomic-router
- Routing solution for Effector applications
- Key features:
  - Route definitions with params
  - Navigation events and stores
  - Route guards and middleware

### effector-storage
- Persistent storage adapter
- Key features:
  - Local storage integration
  - Session storage integration
  - Custom storage adapters

### @farfetched/core
- Data fetching and caching solution
- Best for simple query scenarios that don't require manual cache management
- Key features:
  - `createQuery` - creates a query entity for data fetching
  - `createMutation` - creates a mutation entity for data modifications
  - Built-in cache management
  - Automatic loading states
- When to use:
  - Simple CRUD operations
  - REST API calls without complex cache invalidation
  - Queries that don't need manual state management
- When not to use:
  - Complex data relationships
  - Custom cache invalidation logic
  - Manual query state management requirements
- Examples:
```typescript
const userQuery = createQuery({
  name: 'user/get',
  effect: createApiEffect('query', gamesApi.me.profile.$get)
})

const updateUserMutation = createMutation({
  name: 'user/update',
  effect: createApiEffect('mutation', gamesApi.me.profile.$put)
})
```

## Best Practices

1. Layer-Specific Models:
   - Keep models focused on their layer's responsibility
   - Follow layer dependency rules from [App Architecture](./app-architecture.md)
   - Export only what's needed through the public API

2. State Management:
   - Keep stores minimal and focused
   - Use computed values with `.map()` when possible
   - Reset states appropriately with `.reset(event)` or calling `$store.reinit` event

3. Effects:
   - Handle errors appropriately
   - Use `attach` for passing common global store values to effects
   - Do not use effects directly in UI components - use events instead

4. Events:
   - Name events clearly based on what happened / what will happen
   - Use typed events when passing data
   - Keep event handlers pure when possible

5. Samples:
   - Use for complex state updates
   - Keep logic clear and focused
   - Consider using `combine` for multiple sources

6. Using `useUnit`:
   - Use `useUnit` with individual stores
   - Do not use `useUnit` for events when the app is not SSR
   - Avoid passing nested structures containing stores
   - Bad:
     ```typescript
     // Avoid this
     const model = useUnit($$model)  // model contains nested stores
     ```
   - Good:
     ```typescript
     // Do this instead
     const value1 = useUnit($store1)
     const value2 = useUnit($store2)
     const loading = useUnit($loading)
     ```
   - Exceptions:
     - Query and Mutation instances from Farfetched

## Common Patterns

1. Model Organization:
```typescript
// Initialization
const initialize = createEvent()
const reset = createEvent()

// Effects
const fetchDataFx = createEffect(...)

// Stores
const $data = createStore(null)
const $loading = status(fetchDataFx)

// Logic
sample({
  clock: initialize,
  target: fetchDataFx
})

// Exports
export const $$modelName = {
  initialize,
  reset,
  $data,
  $loading
}
```

2. Feature Integration:
```typescript
// Connect features through events
sample({
  clock: gameFinished,
  target: [
    updateBalance,
    updateHistory,
    showNotification
  ]
})
```

3. Error Handling:
```typescript
const handleErrorFx = createEffect((error: Error) => {
  // Error handling logic
})

sample({
  clock: fetchDataFx.failData,
  target: handleErrorFx
})
```

Remember to follow these guidelines while keeping your specific business requirements in mind. The structure can be adapted based on your needs while maintaining the core principles of separation of concerns and clean architecture.