# SlideEditor Sticky Action Bar - Architecture Documentation

## Overview
The SlideEditor component implements a sticky action bar that appears at the bottom of the screen when slides are selected. This action bar provides three primary buttons for slide modification operations.

## Location
- **Main Component**: `src/components/SlideEditor.tsx` (lines 914-944)
- **Supporting CSS**: `src/app/globals.css` (lines 189-198 for mobile responsiveness)

## DOM Structure

### Sticky Action Bar Container
```jsx
<div className="sticky bottom-4 z-10 mx-auto flex w-fit flex-wrap justify-center gap-2 rounded-lg border bg-card/95 p-2 shadow-lg backdrop-blur-sm">
  {/* Three action buttons */}
</div>
```

### CSS Classes Analysis
- `sticky bottom-4`: Positions the bar 1rem from bottom of viewport
- `z-10`: Ensures it appears above other content
- `mx-auto`: Centers horizontally
- `flex w-fit flex-wrap justify-center gap-2`: Flexible layout with 0.5rem gaps
- `rounded-lg`: 0.5rem border radius
- `border`: Uses CSS variable `--border` color
- `bg-card/95`: Semi-transparent card background (95% opacity)
- `p-2`: 0.5rem padding
- `shadow-lg backdrop-blur-sm`: Drop shadow with backdrop blur effect

## Visibility Toggle Logic

### Conditional Rendering
```jsx
{selectedIndices.length > 0 && (
  <div className="sticky bottom-4 z-10...">
    {/* Action buttons */}
  </div>
)}
```

### Selection State Management
- **State Variable**: `selectedIndices` (array of selected slide indices)
- **Trigger**: Checkbox selection changes in individual slides
- **Handler**: `handleSelectionChange(index: number, checked: boolean)`
- **Select All**: `handleSelectAll(checked: boolean | 'indeterminate')`

## Three Action Buttons

### 1. Refresh Selected Button
```jsx
<Button 
  variant="outline" 
  disabled={isModifying} 
  onClick={() => handleModifySlides('replace_content')}
  className="flex items-center gap-2"
>
  <RefreshCw className="h-4 w-4" />
  Refresh Selected
</Button>
```

### 2. Expand Selected Button
```jsx
<Button 
  variant="outline" 
  disabled={isModifying} 
  onClick={() => handleModifySlides('expand_selected')}
  className="flex items-center gap-2"
>
  <Scaling className="h-4 w-4" />
  Expand Selected
</Button>
```

### 3. Delete Selected Button
```jsx
<Button 
  variant="destructive" 
  disabled={isModifying} 
  onClick={deleteSelectedSlides}
  className="flex items-center gap-2"
>
  <Trash2 className="h-4 w-4" />
  Delete Selected
</Button>
```

## Action Dispatching and Loading States

### Modification Actions Handler
```jsx
const handleModifySlides = async (action: 'expand_content' | 'replace_content' | 'expand_selected') => {
  // Validation
  if (selectedIndices.length === 0) {
    toast({ title: 'No Sections Selected', description: 'Please select sections to modify.', variant: 'destructive' });
    return;
  }
  
  // Set loading state
  const loadingSet = new Set(selectedIndices);
  setLoadingSlides(loadingSet);
  setIsModifying(true);
  
  try {
    // API call to content-generator
    const response = await fetch('/api/content-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'modifySlides',
        payload: { slides, selectedIndices, action },
      }),
    });
    
    // Handle response and update state
    const result = await response.json();
    setSlides(result);
    onSlidesUpdate(result);
    setSelectedIndices([]);
    setLoadingSlides(new Set());
    
  } catch (error) {
    // Error handling
    setLoadingSlides(new Set());
    toast({ title: 'An Error Occurred', description: 'Failed to modify slides. Please try again.', variant: 'destructive' });
  } finally {
    setIsModifying(false);
  }
}
```

### Delete Action Handler
```jsx
const deleteSelectedSlides = () => {
  const newSlides = slides.filter((_, index) => !selectedIndices.includes(index));
  const deletedCount = selectedIndices.length;
  setSlides(newSlides);
  onSlidesUpdate(newSlides);
  setSelectedIndices([]);
  toast({
    title: 'Slides Deleted',
    description: `${deletedCount} slides have been removed.`,
  });
};
```

### Loading State Management
- **Global Loading**: `isModifying` state disables all buttons
- **Individual Slide Loading**: `loadingSlides` Set tracks which slides are being modified
- **Visual Feedback**: Loading slides show shimmer overlay in EnhancedSlideRenderer
- **Button States**: All buttons show disabled state during operations

## Responsive Design

### Mobile Breakpoints
- **CSS Media Query**: `@media (max-width: 767px)` in globals.css
- **Mobile Classes**: 
  - `.mobile-container`: `max-width: 100vw; overflow-x: hidden;`
  - `.mobile-slide`: `max-width: calc(100vw - 2rem); overflow: hidden;`

### Button Layout
- **Flexbox**: Uses `flex-wrap` for responsive wrapping
- **Gap**: Consistent 0.5rem spacing between buttons
- **Width**: Buttons use `w-full sm:w-auto` pattern for mobile-first design

## Key Dependencies
- **Icons**: Lucide React (`RefreshCw`, `Scaling`, `Trash2`)
- **UI Components**: Custom Button component from `./ui/button`
- **State Management**: React useState for selection and loading states
- **API Integration**: Fetch calls to `/api/content-generator`
- **Toast Notifications**: Custom useToast hook for user feedback

## Technical Notes
- The sticky bar uses CSS backdrop-blur for modern visual effects
- All actions are async with proper error handling
- Loading states prevent race conditions during operations
- The component follows React best practices with proper cleanup
- Mobile-first responsive design with Tailwind CSS
