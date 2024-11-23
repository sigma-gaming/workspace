# Frontend Application Architecture Guidelines

## Overview

This document describes the architectural approach to organizing frontend applications using a layered structure based on Feature-Sliced Design methodology. For specific implementation details using Effector state management, see [Effector Guidelines](./effector.md).

## Application Layers

### App Layer
- **Purpose**: Application bootstrapping and global configuration
- **Responsibilities**:
  - Application initialization
  - Global providers setup
  - Environment configuration
  - Root routing
  - Global error boundaries
- **Key Characteristics**:
  - Single instance per application
  - Coordinates all other layers
  - Contains minimal business logic

### Pages Layer
- **Purpose**: Route-level components and page-specific logic
- **Responsibilities**:
  - Page layout and composition
  - Route-specific state management
  - Integration of features and widgets
  - Page-level data fetching
- **Key Characteristics**:
  - Maps directly to routes
  - Orchestrates lower-level layers
  - Contains only page-specific logic

### Layouts Layer
- **Purpose**: Reusable page layouts and structural components
- **Responsibilities**:
  - Define common page structures
  - Provide layout composition
  - Handle layout-specific logic
- **Key Characteristics**:
  - Sits between Pages and Widgets
  - Reusable across multiple pages
  - Can use Widgets and lower layers
  - Prevents layout duplication
- **Examples**:
  - Main application layout
  - Authentication layout
  - Dashboard layout
  - Centered content layout

### Widgets Layer
- **Purpose**: Complex, reusable UI components with business logic
- **Responsibilities**:
  - Complex UI patterns
  - Widget-specific state management
  - UI logic and interactions
- **Key Characteristics**:
  - More complex than UI components and Features
  - Reusable across pages
- **Examples**:
  - Rich text editor
  - Data grid
  - Chat widget
  - Interactive charts

### Features Layer
- **Purpose**: Implements specific business capabilities
- **Responsibilities**:
  - Business logic implementation
  - Feature-specific UI components
  - Feature state management
  - API integration
- **Key Characteristics**:
  - Independent and reusable
  - Self-contained business logic
  - Can be used by multiple pages / widgets
- **Examples**:
  - Authentication
  - Search functionality
  - Notifications system
  - Data filtering

### Routing Layer
- **Purpose**: Route configuration and navigation management
- **Responsibilities**:
  - Route definitions using atomic-router
  - Route guards and authentication
  - Navigation abstractions
  - Page-to-route bindings
- **Key Characteristics**:
  - Sits between Features and Entities
  - Centralizes routing logic
  - Provides routing abstractions
  - Handles route protection
- **Examples**:
  - Basic page routing
  - Authenticated routes
  - Route parameters
  - Navigation helpers

### Entities Layer
- **Purpose**: Business domain models and core logic
- **Responsibilities**:
  - Data models
  - Business rules
  - Entity-specific operations
  - Data transformation
- **Key Characteristics**:
  - Pure business logic usually
  - No UI components usually, but can contain some basic UI related to the entity
  - Highly reusable
  - Can be used by multiple pages / widgets / features
- **Examples**:
  - User entity
  - Product entity
  - Order entity

### Shared Layer
- **Purpose**: Common utilities and UI components
- **Components**:
  - **UI**: Basic UI components
  - **API**: API clients and utilities
  - **Lib**: Utility functions and helpers
  - **Config**: Shared configuration
- **Key Characteristics**:
  - No business logic
  - Highly reusable
  - Framework/library agnostic where possible

## File Structure

```
src/
├── app/                  # Application initialization
├── pages/               # Route components
│   ├── home/
│   ├── profile/
│   └── settings/
├── layouts/             # Reusable layouts
│   ├── main/
│   ├── auth/
│   └── dashboard/
├── routing/             # Route configuration
│   ├── routes.ts
│   ├── router.ts
│   ├── create-page.tsx
│   └── create-authenticated-page.tsx
├── features/            # Business features
│   ├── auth/
│   └── notifications/
├── widgets/             # Complex UI components
│   ├── header/
│   └── sidebar/
├── entities/            # Business domain models
│   ├── user/
│   └── product/
└── shared/             # Shared resources
    ├── api/
    ├── lib/
    ├── ui/
    └── config/
```

## Layer Dependencies

1. **Allowed Dependencies**:
   - Pages → Layouts → Widgets → Features → Entities
   - Pages → Routing → Entities
   - Pages → Entities
   - Pages → Features
   - Layouts → Widgets → Features → Entities
   - Widgets → Features → Routing → Entities
   - Features → Routing → Entities
   - All layers → Shared
   - And more..

2. **Forbidden Dependencies**:
   - Lower layers cannot depend on higher layers
   - No layer can depend on App layer
   - Widgets or Features cannot depend on Pages
   - Layouts cannot depend on Pages
   - Entities cannot depend on Features, Widgets, or Layouts
   - Shared cannot depend on any other layer

## Best Practices

1. **Layer Isolation**:
   - Each layer should have clear boundaries
   - Minimize cross-layer dependencies
   - Use composition over direct imports

2. **Module Organization**:
   - Group related files within modules
   - Keep module interfaces clean and minimal
   - Use index files for public APIs

3. **State Management**:
   - Keep state close to where it's used
   - Share state only when necessary
   - Use appropriate state management patterns
     (See [Effector Guidelines](./effector.md) for Effector-specific patterns)

4. **Code Organization**:
   - Group by feature, not by type
   - Keep related code close together
   - Use consistent naming conventions

## Module Structure

Each module (regardless of layer) should follow a consistent structure:

```
module/
├── index.ts           # Public API
├── model/            # Business logic and state (optional)
├── ui/               # UI components (optional)
├── lib/              # Internal utilities (optional)
└── config/           # Module configuration (optional)
```

## Further Reading

- [Feature-Sliced Design](https://feature-sliced.design/)
- [Effector Guidelines](./effector.md) for state management implementation