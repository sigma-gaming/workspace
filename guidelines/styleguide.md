# TypeScript/JavaScript Style Guide

## Table of Contents
1. [Naming Conventions](#naming-conventions)
2. [Types and Interfaces](#types-and-interfaces)
3. [Enums](#enums)
4. [Functions and Methods](#functions-and-methods)
5. [React Components](#react-components)
6. [State Management](#state-management)
7. [File Organization](#file-organization)
8. [CSS/Styling](#css-styling)

## Naming Conventions

### General Rules
- Use `camelCase` for variables, functions, and method names
- Use `PascalCase` for types, interfaces, enums (and their values), classes, and React components
- Use `UPPER_SNAKE_CASE` for constants
- Use descriptive names that clearly indicate the purpose
- Omit prefix "is" if the name is already descriptive

### Variables
```typescript
const userId = 'user123';
const loading = true;
const maxRetries = 3;
```

### File Naming
- Use `kebab-case` for file names: `payment-success.tsx`, `mobile-tabs.tsx`
- Use `.tsx` extension for React components
- Use `.ts` extension for TypeScript files
- Group related files in feature-based directories (see [File Organization](#file-organization))

### Imports and Exports
- Use named exports (`export const`) instead of default exports
- Use default exports only when required by frameworks (Next.js, Astro)
- Group imports by their source:
  1. External dependencies
  2. Internal modules
  3. Relative imports
- Use absolute imports for modules from project root
- Keep one line break between import groups

```typescript
// Comments below are for demonstration purposes only, do not add them in actual code
// External dependencies
import { z } from 'zod'
import { useUnit } from 'effector-react'

// Internal modules
import { PaymentProvider } from '@dbs/games-types'
import { gemInt } from '@games/model'

// Relative imports
import { $$session } from '../../entities/session'
import { routes } from './routes'
```

## Types and Interfaces

### Type Definitions
- Prefer interfaces for public APIs and types for internal use
- Use PascalCase for type names
- Add type suffix for specific type categories

```typescript
interface PayloadSchema {
  amount: number;
  provider: PaymentProvider;
  method: DepositMethod;
  currency: Currency;
}

type RouteParams = {
  id: string;
  type: string;
};
```

## Enums

### Enum Naming and Usage
- Use **ONLY** PascalCase for enum names and enum keys
- Group related values together

```typescript
enum Sound {
  TopUp = 'top-up',
  Withdraw = 'withdraw',
  Pincode = 'pincode',
  WinDefault = 'win-default',
}

enum AccountProvider {
  Vk = 'vk',
  Telegram = 'telegram',
}
```

## Functions and Methods

### Function Declaration
- Use arrow functions for component definitions and callbacks
- Use function declarations for utility functions
- Include type annotations for parameters and return types

```typescript
const handleSubmit = (event: FormEvent) => {
  // Implementation
};

function formatAmount(value: number): string {
  // Implementation
}
```

## React Components

### Component Structure
- Use functional components with hooks
- Export components as named exports
- Place component-specific types and interfaces near the component

```typescript
interface Props {
  label: string;
  multiplier: number;
  color: BadgeColor;
  highlighted?: boolean;
}

export const Component = ({ label, multiplier, color, highlighted }: Props) => {
  // Implementation
};
```

### Props
- Use interface for props definition
- Make props optional when they have default values
- Use descriptive prop names

## State Management

See [Effector Guidelines](./effector.md) for state management implementation

## File Organization

See [App Architecture Guidelines](./app-architecture.md) for frontend applications and [Api Architecture Guidelines](./api-architecture.md) for API services

## CSS/Styling

See [CSS Guidelines](./css.md) for CSS usage

### Best Practices
- Prefer composition over inheritance
- Keep components small and focused
- Use TypeScript's type system effectively
- Follow consistent formatting (follow base eslint and prettier rules)
- Write self-documenting code
- Use meaningful error messages