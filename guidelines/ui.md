# UI Guidelines

## Core Principles

### Responsive Design
- Use mobile-first approach
- Support three main breakpoints:
  - Mobile: < md
  - Tablet: md to lg
  - Desktop: > lg
- Ensure consistent UI across different screen sizes
- Adapt layouts and components based on viewport

### Accessibility
- Use semantic HTML elements
- Include ARIA labels for interactive elements
- Maintain proper focus management
- Support keyboard navigation
- Ensure sufficient color contrast
- Provide text alternatives for images

## Layout Guidelines

### Base Structure
- Use responsive layouts that adapt to different screen sizes
- Implement consistent spacing and padding
- Follow a clear visual hierarchy
- Consider mobile navigation patterns (e.g., bottom tabs for mobile)

### Common Patterns
1. **Headers**
   - Sticky positioning
   - Consistent height across breakpoints
   - Clear branding and navigation
   - User profile/actions area

2. **Navigation**
   - Clear visual hierarchy
   - Consistent icon and label pairing
   - Active state indication
   - Mobile-optimized navigation patterns

3. **Content Areas**
   - Clear content boundaries
   - Consistent padding and margins
   - Responsive grid systems
   - Proper spacing between elements

## Component Guidelines

### Interactive Elements

1. **Buttons**
   - Clear visual hierarchy (primary, secondary, tertiary)
   - Consistent padding and sizing
   - Include loading states
   - Proper hover and focus states
   - Icon alignment and spacing
   - Full width on mobile when appropriate

2. **Forms**
   - Clear labels and placeholders
   - Consistent error handling
   - Loading states
   - Proper validation feedback
   - Mobile-optimized inputs
   - Grouped related fields

3. **Modals & Overlays**
   - Centered content
   - Clear actions
   - Proper backdrop
   - Mobile-optimized layout
   - Keyboard navigation support

### User Interface Components

1. **Cards**
   - Consistent padding
   - Clear content hierarchy
   - Responsive behavior
   - Proper spacing between elements

2. **Lists & Tables**
   - Clear row separation
   - Responsive behavior
   - Loading states
   - Empty states
   - Proper alignment

3. **Navigation Components**
   - Clear active states
   - Consistent spacing
   - Icon and label alignment
   - Mobile-optimized touch targets

## Component Usage

### UI Component Libraries
- Use Mantine components as the primary UI component library
- Utilize custom components from `@[core/ui]` for specific project needs
- Prefer existing components over creating new ones to maintain consistency

### Styling Guidelines
- Use Tailwind classes for layout and spacing
  - Apply margin and padding through Tailwind utility classes
  - Use Tailwind for responsive layouts and flexbox/grid systems
- Follow styling rules defined in `@[guidelines/css.md]`
- When using Mantine components:
  - Avoid using Mantine's CSS shorthand props (m, mt, p, px, etc.)
  - Instead, use `className` prop with Tailwind classes
  - Example: `className="mt-4 px-6 flex items-center"` instead of `mt="md" px="lg"`
- Keep component-specific styles minimal and focused on the component's core functionality
- Maintain consistent spacing using Tailwind's spacing scale

### Layout Best Practices
- Use Tailwind classes for:
  - Container margins and padding
  - Grid and flex layouts
  - Spacing between components
  - Responsive adjustments
- Keep component-specific styles minimal and focused on the component's core functionality
- Maintain consistent spacing using Tailwind's spacing scale

## Visual Style

### Colors
- Use theme variables for consistency
- Follow accessibility guidelines for contrast
- Maintain consistent color meaning:
  - Primary: Main brand color
  - Success: Green tones
  - Warning: Orange/Yellow tones
  - Error: Red tones
  - Info: Blue tones

### Typography
- Use consistent font scale
- Maintain clear hierarchy:
  - Headings: 2xl-4xl
  - Body: base
  - Small text: sm
- Use appropriate font weights:
  - Headings: medium (500)
  - Body: normal (400)

### Effects & Animation
- Use subtle transitions
- Implement loading states
- Add feedback animations
- Keep animations smooth and purposeful
- Consider reduced motion preferences

## Development Practices

### Code Organization
- Maintain consistent component structure
- Use TypeScript for type safety
- Follow naming conventions
- Create reusable components
- Implement proper prop types

### Performance
- Lazy load components when appropriate
- Optimize images and assets
- Use efficient CSS
- Implement proper loading states

### State Management
- Clear loading states
- Proper error handling
- Consistent data flow
- Predictable state updates
- Optimistic updates when appropriate

### Testing & Quality
- Implement component tests
- Check accessibility
- Test responsive behavior
- Validate cross-browser compatibility
- Monitor performance metrics

## Best Practices

1. **Mobile Optimization**
   - Touch-friendly targets (min 44px)
   - Simplified navigation
   - Performance consideration
   - Proper viewport handling

2. **Error Handling**
   - Clear error messages
   - User-friendly feedback
   - Recovery options
   - Consistent error display
   - Proper logging

3. **Loading States**
   - Consistent loading indicators
   - Skeleton screens
   - Progress feedback
   - Prevent content jumps
   - Handle timeout cases

4. **Internationalization**
   - Support russian language
   - Handle text expansion
   - Use proper date/time formatting