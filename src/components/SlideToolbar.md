# Slide Toolbar Component Documentation

## Overview

The slide toolbar has been refactored to provide a more flexible and maintainable structure. The three buttons (Refresh Selected, Expand Selected, Delete Selected) are now wrapped in a dedicated `<div class="slide-toolbar">` container and use standalone `ToolbarButton` components.

## Structure

### Main Components

1. **SlideEditor**: Main component that contains the slide toolbar
2. **ToolbarButton**: Standalone button component for toolbar actions
3. **SlideEditor.module.css**: CSS module for styling

### HTML Structure

```html
<div class="slide-toolbar [compact]">
  <ToolbarButton ... />
  <ToolbarButton ... />
  <ToolbarButton ... />
</div>
```

## ToolbarButton Component

### Props

```typescript
interface ToolbarButtonProps {
  icon: React.ReactNode;        // Icon to display (e.g., <RefreshCw />)
  label: string;               // Button text
  ariaLabel?: string;          // Accessibility label (optional)
  onClick: () => void;         // Click handler
  loading?: boolean;           // Loading state
  variant?: 'outline' | 'destructive' | 'default' | 'secondary' | 'ghost' | 'link';
  className?: string;          // Additional CSS classes
  disabled?: boolean;          // Disabled state
}
```

### Example Usage

```tsx
<ToolbarButton
  icon={<RefreshCw className="h-4 w-4" />}
  label="Refresh Selected"
  ariaLabel="Refresh selected slides"
  onClick={() => handleModifySlides('replace_content')}
  loading={isModifying}
  variant="outline"
/>
```

## SlideEditor Props

The `SlideEditor` component now accepts an additional `compact` prop:

```typescript
interface SlideEditorProps {
  // ... existing props
  compact?: boolean;  // Controls compact mode styling
}
```

## Styling

### CSS Classes

- `.slide-toolbar`: Main toolbar container
- `.slide-toolbar.compact`: Compact mode styling
- `.toolbar-button-label`: Button label styling

### Responsive Behavior

The toolbar automatically adapts to different screen sizes:

- **Desktop (>768px)**: Full-size buttons with labels
- **Mobile (≤768px)**: Compact buttons, vertically stacked
- **Small mobile (≤480px)**: Smaller buttons and spacing
- **Very small (≤320px)**: Icons only in compact mode

### Compact Mode

You can enable compact mode by passing the `compact` prop:

```tsx
<SlideEditor compact={true} {...otherProps} />
```

Or use CSS media queries for automatic responsive behavior.

## Accessibility

- Each button has proper `aria-label` attributes
- Focus indicators are styled for keyboard navigation
- Loading states are handled with appropriate visual feedback
- Disabled states prevent interaction during operations

## Migration Guide

If you're updating existing code:

1. The toolbar structure is now wrapped in `.slide-toolbar`
2. Individual buttons are now `ToolbarButton` components
3. Add the `compact` prop if you need manual control over sizing
4. Import the CSS module if you need custom styling

## CSS Customization

You can customize the toolbar appearance by modifying the CSS module or adding custom classes:

```css
/* Custom toolbar styling */
.slide-toolbar {
  /* Your custom styles */
}

.slide-toolbar.compact {
  /* Compact mode overrides */
}
```

## Performance Considerations

- The `ToolbarButton` component is memoized to prevent unnecessary re-renders
- CSS transitions are optimized for smooth animations
- Loading states are managed efficiently to prevent UI blocking
