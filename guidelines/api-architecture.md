# API Architecture Guidelines

This document describes the architecture patterns and best practices used in our API services. It covers the organization of API projects, route composition, data validation, service layer, and database interactions.

For monorepo structure and import guidelines, see [Monorepo Structure Guidelines](./monorepo-structure.md).

## Project Structure

A typical API project follows this structure:

```
src/
  ├── app.ts              # Main application setup and route composition
  ├── env.ts              # Environment configuration
  ├── hono.ts            # Router creation with typed context
  ├── main.ts            # Application entry point
  ├── middlewares/       # Global middleware functions
  ├── routes/            # Route handlers and controllers
  │   ├── chat/
  │   │   ├── index.ts           # Route composition
  │   │   ├── get-messages.ts    # Get chat messages
  │   │   └── send-message.ts    # Send new message
  │   └── profile/
  │       ├── index.ts           # Route composition
  │       ├── get-profile.ts     # Get user profile
  │       └── update-profile.ts  # Update profile
  └── shared/           # Shared utilities and types
```

## Imports

Follow the monorepo import guidelines using path aliases:

```typescript
// Core libraries
import { zValidator } from '@core/server'
import { createLazyInstance } from '@core/di'
import { BadRequestException } from '@core/exceptions'

// Game libraries
import { chatService, profileService } from '@games/services'
import { SessionVariant } from '@games/model'
import { ChatServiceOptions } from '@games/options'

// Database
import { ChatMessageTable } from '@dbs/games-schema'
import { Currency, UserRole } from '@dbs/games-types'
```

## Route Composition with Hono

We use Hono for building our APIs. Each API project has its own `createRouter` function that includes typed context:

```typescript
// hono.ts - Router with typed context
import { HonoUwsEnv } from '@core/server'
import { SessionVariant } from '@games/model'

export type ApiEnv = HonoUwsEnv & {
  Variables: {
    sessionVariant: SessionVariant
  }
}

export function createRouter() {
  return new Hono<ApiEnv>()
}

// app.ts - Top level composition
import { createRouter } from './hono'

export const app = createRouter()
  .use('*', globalMiddleware())
  .route('/chat', chatRouter)
  .route('/profile', profileRouter)

// routes/chat/index.ts - Module level composition
export const chatRouter = createRouter()
  .route('/getMessages', getMessagesHandler)
  .route('/sendMessage', sendMessageHandler)

// routes/chat/get-messages.ts - Individual route handler
export const getMessagesHandler = createRouter()
  .get('/', async (ctx) => {
    const messages = await chatService.getMessages()
    return ctx.json(messages)
  })
```

### Route Handler Best Practices

1. Keep handlers focused on:
   - Request validation
   - Service layer coordination
   - Response formatting
   - Error handling

2. Business Logic in Handlers:
   ```typescript
   // ✅ Acceptable: Route-specific logic
   .get('/', async (ctx) => {
     // Logic specific to this endpoint that won't be reused
     const result = await processRouteSpecificData(data)
     return ctx.json(result)
   })

   // ✅ Better: Move shared or potentially shared logic to service
   .get('/', async (ctx) => {
     const result = await myService.getData()
     return ctx.json(result)
   })
   ```

## Service Layer

Services encapsulate business logic and data access. They are typically initialized lazily to avoid unnecessary instantiation:

```typescript
import { createLazyInstance } from '@core/di'
import { ChatServiceOptions } from '@games/options'
import { ChatMessageTable } from '@dbs/games-schema'

export class ChatService {
  private options: ChatServiceOptions

  constructor() {
    this.options = resolveOptions(ChatServiceOptionsToken)
  }

  async getMessages() {
    // Implementation
  }
}

export const chatService = createLazyInstance(ChatService)
```

### Service Layer Organization

1. Options Management
   - Options are defined in a separate package (for example, `@games/options`)
   - Use `resolveOptions` to get typed options
   - Use `registerOptions` to register options on application level (usually in setup.ts file in API src folder)
   - Options are validated at service initialization

2. Dependencies
   - Services import dependencies directly
   - Lazy initialization prevents unused service initialization
   - Circular dependencies are handled via lazy imports

3. Service Registry
   ```typescript
   // services/index.ts
   export { chatService } from './chat'
   export { userService } from './user'
   
   // Individual services are created lazily
   // and only initialized when first accessed
   ```

### Decorators

Decorators are **never used** in application or service layer. This prevents different bundling and environment issues related to decorators support.

### Service Layer Responsibilities

1. Business Logic
   - Complex data processing
   - Business rules enforcement
   - Data validation and transformation

2. Data Access
   - Database operations
   - Cache management
   - External service integration

3. Transaction Management
   - Ensuring data consistency
   - Managing complex operations

## Database Layer

We use a typed database schema with Drizzle ORM:

```typescript
// schema/table.ts
export const MyTable = pgTable('MyTable', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  trackingId: uuid('trackingId').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  data: jsonb('data').$type<MyDataType>(),
})

// Types are generated for type-safe queries
export type MyTableSelect = typeof MyTable.$inferSelect
export type MyTableInsert = typeof MyTable.$inferInsert
```

### Database Best Practices

1. Schema Organization
   - One table per file
   - Clear naming conventions
   - Explicit relationships

2. Type Safety
   - Use generated types
   - Define custom types for complex data
   - Validate data before insertion

## Data Models

Models define the shape of data throughout the application:

```typescript
// model/types.ts
export interface MyData {
  id: number
  trackingId: string
  details: {
    field1: string
    field2: number
  }
}

// These types are used in:
// - Database schemas
// - API responses
// - Service layer
// - Frontend applications
```

### Model Layer Guidelines

1. Keep models focused on:
   - Data structure definition
   - Type relationships
   - Validation rules

2. Avoid including:
   - Business logic
   - Database access
   - API-specific code

## Error Handling

Use consistent error handling across the application:

```typescript
// Throw typed exceptions
throw new BadRequestException('Invalid input')
throw new UnauthorizedException('Not authenticated')

// Handle errors at the top level
app.use('*', errorHandler())

// Service layer error handling
try {
  await service.operation()
} catch (error) {
  // Transform to appropriate API error
  throw transformError(error)
}
```

## Validation

Use Zod for request validation with the `zValidator` middleware:

```typescript
import { z } from 'zod'
import { zValidator } from '@core/server'

const schema = z.object({
  field1: z.string(),
  field2: z.number().optional(),
})

export const myRoute = new Hono()
  .post('/', 
    // Validate request body before handler
    zValidator('json', schema),
    async (ctx) => {
      // Body is already validated and typed
      const body = ctx.req.valid('json')
      return ctx.json(await myService.process(body))
    }
  )

// Query params validation
const querySchema = z.object({
  page: z.coerce.number().min(1),
  limit: z.coerce.number().min(1).max(100)
})

export const listRoute = new Hono()
  .get('/',
    zValidator('query', querySchema),
    async (ctx) => {
      const query = ctx.req.valid('query')
      return ctx.json(await myService.list(query))
    }
  )
```

The `zValidator` middleware:
- Validates request data against Zod schema
- Throws `ValidationException` on invalid data
- Provides typed access to validated data via `ctx.req.valid()`
- Supports different validation targets:
  - 'json' for request body
  - 'query' for query parameters
  - 'param' for URL parameters
  - 'header' for request headers

## Best Practices

1. **Route Organization**
   - Group related routes in feature modules (chat, profile, balance)
   - Keep route handlers focused on their specific functionality
   - Use consistent naming that reflects the route's purpose

2. **Service Layer**
   - Single responsibility principle
   - Dependency injection
   - Clear error handling

3. **Database Access**
   - Use typed schemas
   - Centralize database logic
   - Handle transactions carefully

4. **Security**
   - Validate all inputs
   - Handle errors securely