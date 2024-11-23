# CSS Guidelines

This document outlines the standards and best practices for working with CSS in our project.

## Core UI Library Styling

When working with the `@core/ui` library components:

- CSS Modules with Tailwind's `@apply` directive are the preferred method for component theming and styling
- Use semantic class names that describe the component's purpose
- Keep styles modular and reusable

## Tailwind Configuration

- The main Tailwind configuration is located in `core/ui/tailwind.config.cjs`
- This configuration is shared across all applications that include the `@core/ui` package
- Maintain consistency by using the predefined design tokens and utilities

## CSS Modules Usage

### In Applications

CSS Modules should be created only in the following cases:
1. When a component requires many Tailwind classes that would be difficult to maintain in a single line
2. For complex styling scenarios like custom gradients or grid layouts that don't align well with existing Tailwind classes

For simple scenarios, use Tailwind classes directly in the `className` prop:

```tsx
<div className="flex flex-col gap-2"></div>
```

### Class Organization

When using multiple `@apply` directives, organize them into logical groups:

```css
.component {
  /* Layout, positioning, spacing */
  @apply flex flex-col relative z-10 p-4 m-2;
  
  /* Border and shape */
  @apply rounded-lg border border-gray-200;
  
  /* Colors and visual effects */
  @apply bg-white text-gray-900 opacity-100;
  
  /* Typography */
  @apply text-base leading-6 font-medium;
}
```

This is just a basic example, and you can customize the organization based on your specific case.

## Selectors and Nesting

### Custom Selectors

For nested selectors and custom data attributes, use CSS selectors syntax instead of Tailwind modifiers:

```css
.container {
  /* Base styles */
  @apply flex items-center;

  /* Nested elements */
  & > .child {
    @apply ml-4;
  }

  /* Data attribute selectors */
  &[data-state="active"] {
    @apply bg-primary-100;
  }
}
```

### State Modifiers

Tailwind state modifiers are acceptable and encouraged for common states:
- `hover:`
- `focus:`
- `focus-visible:`
- `active:`
- `disabled:`
- `enabled:`
- and more..

Example:

```css
.button {
  @apply bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300;
}
```

Remember to maintain consistency across components and follow these guidelines to ensure a maintainable and scalable codebase.