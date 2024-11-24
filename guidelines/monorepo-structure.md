# Monorepo Structure Guidelines

This document describes the organization and best practices for our monorepo structure.

## Repository Structure

The monorepo is organized into several main directories:

```
workspace/
  ├── apps/                 # Applications
  │   ├── games-app/       # Frontend applications
  │   ├── control-app/
  │   ├── games-api/       # Backend services
  │   ├── control-api/
  │   └── games-ws/        # WebSocket services
  │
  ├── core/                # Core libraries and utilities
  │   ├── ui/             # Shared UI components
  │   ├── server/         # Server utilities
  │   └── exceptions/     # Shared exceptions
  │
  ├── games-libs/          # Game-specific libraries
  │   ├── services/       # Business logic services
  │   ├── model/          # Data models
  │   └── options/        # Service options
  │
  ├── dbs/                # Database schemas and types
  │   ├── games-schema/   # Database schemas
  │   └── games-types/    # Shared types
  │
  └── tooling/            # Build and development tools
      ├── build/          # Build configuration
      └── env/           # Environment configuration
```

## Import Guidelines

### Path Aliases

All imports should use path aliases defined in `tsconfig.base.json`:

```typescript
// Good: Using path aliases
import { userService } from '@games/services'
import { Button } from '@core/ui'
import { BadRequestException } from '@core/exceptions'

// Bad: Using relative paths to internal files
import { userService } from '../../../games-libs/services/src/user'
import { Button } from '../../../../core/ui/src/components/Button'
```

### Package Boundaries

1. **Use Public Exports**
   - Only import from package entry points (index.ts)
   - Don't reach into internal package files

```typescript
// Good: Using public exports
import { chatService } from '@games/services'

// Bad: Reaching into package internals
import { ChatService } from '@games/services/src/chat'
```

2. **Package Independence**
   - Each package should have clear boundaries
   - Avoid circular dependencies between packages
   - Use proper layering (core → libs → apps)

## Package Types

### Applications (`apps/`, alias depends on the application type)
- Standalone applications and services
- Can depend on core libraries and game libraries
- Should not be imported by other packages

### Core Libraries (`core/`, alias: `@core/`)
- Foundational utilities and components
- No dependencies on game-specific code
- Used by both applications and game libraries

### Game Libraries (`games-libs/`, alias: `@games/`)
- Game-specific business logic and models
- Can depend on core libraries
- Used by game applications

### Database Layer (`dbs/`, alias: `@dbs/`)
- Database schemas and types
- Used by services and APIs
- Maintains type safety across the stack

### Tooling (`tooling/`, alias: `@tooling/`)
- Build and development utilities
- Configuration management
- CI/CD tooling

## Best Practices

1. **Package Organization**
   - Keep related code together
   - Clear separation of concerns
   - Minimal dependencies between packages

2. **Import Rules**
   - Use path aliases consistently
   - Respect package boundaries
   - Import only from public exports

3. **Dependencies**
   - Follow the dependency hierarchy:
     ```
     apps → games-libs → core
     apps → core
     ```
   - Avoid circular dependencies
   - Keep dependencies explicit in package.json

4. **Type Safety**
   - Share types through dedicated packages
   - Use generated types where applicable
   - Maintain consistent type definitions

5. **Code Sharing**
   - Share code through proper packages
   - Avoid copying code between applications
   - Use composition over inheritance