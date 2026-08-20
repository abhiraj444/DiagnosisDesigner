# Mobile UX & Accessibility Requirements
## Design Targets & Style Guide

### 📱 Responsive Breakpoints

| Breakpoint | Range | Device Type | Layout Strategy |
|------------|-------|-------------|-----------------|
| **Mobile** | ≤480px | Small phones | Single column, stacked elements |
| **Tablet** | 481-768px | Large phones, small tablets | Flexible grid, 2-column where appropriate |
| **Desktop** | ≥769px | Tablets, laptops, desktops | Multi-column layouts, sidebars |

### 🎯 Touch Target Specifications

- **Minimum Size**: 44 × 44px (Apple/iOS standard)
- **Recommended Size**: 48 × 48px (Material Design standard)
- **Spacing**: Minimum 8px between touch targets
- **Interactive Elements**: Buttons, links, form controls, navigation items

```css
/* Touch target sizing */
.touch-target {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 16px;
  margin: 4px;
}
```

### 📝 Typography & Font Scaling

| Element | Desktop | Tablet | Mobile | Line Height |
|---------|---------|---------|---------|-------------|
| **H1** | 32px | 28px | 24px | 1.25 |
| **H2** | 24px | 22px | 20px | 1.3 |
| **H3** | 20px | 18px | 18px | 1.35 |
| **Body** | 16px | 15px | 14px | 1.5 |
| **Caption** | 14px | 13px | 12px | 1.4 |
| **Button** | 16px | 15px | 14px | 1.2 |

```css
/* Responsive typography */
body {
  font-size: 16px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  body { font-size: 15px; }
}

@media (max-width: 480px) {
  body { font-size: 14px; }
  h1 { font-size: 24px; }
  h2 { font-size: 20px; }
}
```

### 📌 Sticky Positioning Behavior

#### Mobile-First Sticky Navigation
- **Position**: Fixed at bottom of viewport on mobile (≤768px)
- **Height**: 64px minimum
- **Safe Area**: Account for iOS home indicator (34px bottom padding)
- **Z-index**: 1000+ to ensure visibility above content

```css
/* Mobile sticky navigation */
.mobile-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #ffffff;
  border-top: 1px solid #e0e0e0;
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom);
}

@media (min-width: 769px) {
  .mobile-nav {
    position: relative;
    /* Convert to regular navigation on desktop */
  }
}
```

### ♿ Accessibility Requirements

#### Color Contrast Ratios
- **Normal text**: 4.5:1 minimum (WCAG AA)
- **Large text (18px+)**: 3:1 minimum
- **Interactive elements**: 3:1 minimum for focus indicators
- **Enhanced (AAA)**: 7:1 for normal text, 4.5:1 for large text

#### ARIA Labels & Semantic HTML
```html
<!-- Navigation example -->
<nav role="navigation" aria-label="Main navigation">
  <ul>
    <li><a href="#" aria-current="page">Home</a></li>
    <li><a href="#">About</a></li>
    <li><a href="#">Contact</a></li>
  </ul>
</nav>

<!-- Button with accessible label -->
<button aria-label="Close dialog" type="button">
  <span aria-hidden="true">×</span>
</button>

<!-- Form with proper labels -->
<label for="email">Email Address</label>
<input type="email" id="email" required aria-describedby="email-help">
<div id="email-help">We'll never share your email</div>
```

#### Focus States
```css
/* Focus indicators */
.focus-ring:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(0, 102, 204, 0.2);
}

/* High contrast focus for better visibility */
@media (prefers-contrast: high) {
  .focus-ring:focus {
    outline: 3px solid #000000;
    outline-offset: 3px;
  }
}
```

#### Keyboard Navigation
- **Tab order**: Logical sequence following visual layout
- **Skip links**: "Skip to main content" for screen readers
- **Escape key**: Close modals, dropdowns, and overlays
- **Arrow keys**: Navigate through menus and lists
- **Enter/Space**: Activate buttons and links

### 🎨 Visual Style Guide

#### Color Palette
```css
:root {
  /* Primary Colors */
  --primary-50: #f0f4ff;
  --primary-500: #0066cc;
  --primary-700: #004499;
  
  /* Neutral Colors */
  --neutral-50: #f9fafb;
  --neutral-200: #e5e7eb;
  --neutral-500: #6b7280;
  --neutral-900: #111827;
  
  /* Semantic Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
}
```

#### Component Specifications

##### Buttons
```css
.btn {
  min-height: 44px;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: var(--primary-500);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-700);
}

.btn-primary:focus {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
```

##### Cards
```css
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--neutral-200);
}

@media (max-width: 480px) {
  .card {
    padding: 16px;
    border-radius: 8px;
  }
}
```

### 📐 Layout Grid System

#### Mobile-First Grid
```css
.container {
  width: 100%;
  padding: 0 16px;
  margin: 0 auto;
}

.grid {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
}

@media (min-width: 481px) {
  .container { max-width: 768px; }
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 769px) {
  .container { max-width: 1200px; }
  .grid { grid-template-columns: repeat(12, 1fr); }
}
```

### 🔧 Implementation Checklist

#### Mobile UX
- [ ] Responsive breakpoints implemented
- [ ] Touch targets meet 44px minimum
- [ ] Typography scales appropriately
- [ ] Sticky navigation works on mobile
- [ ] Safe area insets handled for iOS

#### Accessibility
- [ ] Color contrast ratios meet WCAG AA standards
- [ ] ARIA labels added to interactive elements
- [ ] Focus indicators visible and appropriate
- [ ] Keyboard navigation functional
- [ ] Screen reader testing completed

#### Testing
- [ ] Test on actual devices (iOS/Android)
- [ ] Verify with screen readers (NVDA, JAWS, VoiceOver)
- [ ] Check keyboard-only navigation
- [ ] Validate color contrast with tools
- [ ] Test with users who have disabilities

### 📊 Performance Targets

- **First Contentful Paint**: <2.5s on 3G
- **Largest Contentful Paint**: <4s on 3G
- **Cumulative Layout Shift**: <0.1
- **Touch response time**: <100ms
- **Animation frame rate**: 60fps

---

*This style guide serves as the foundation for creating accessible, mobile-first experiences that work for all users across all devices and interaction methods.*
