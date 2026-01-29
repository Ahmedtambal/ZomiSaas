# Custom Toast Notification System

## Overview

A fully custom-built toast notification system that replaces all browser-native alerts, confirms, and prompts across the entire application. Built with React Context, TypeScript, and Tailwind CSS.

## Architecture

### Components

1. **NotificationContext** (`src/context/NotificationContext.tsx`)
   - Central state management using React Context
   - Manages array of active notifications
   - Max 5 notifications shown at once (configurable)
   - Provides methods: `notify`, `update`, `dismiss`, `dismissAll`

2. **NotificationContainer** (`src/components/common/NotificationContainer.tsx`)
   - Fixed top-right corner position (z-index: 9999)
   - Renders all active notifications
   - Handles animations and auto-dismiss logic

3. **NotificationItem** (Internal component)
   - Individual notification with icon, content, actions, progress bar
   - Smooth slide-in/slide-out animations
   - Manual dismiss with X button

## Notification Types

| Type | Color | Icon | Duration | Auto-Dismiss |
|------|-------|------|----------|--------------|
| ✅ success | Green | CheckCircle | 3s | Yes |
| ❌ error | Red | XCircle | 6s | Yes |
| ⚠️ warning | Amber | ExclamationTriangle | 3s | Yes |
| ℹ️ info | Blue | InformationCircle | 3s | Yes |
| ⏳ loading | Blue | Spinner | ∞ | No |

## Features

- ✅ Auto-dismiss with customizable duration
- ✅ Progress bar showing time remaining
- ✅ Manual dismiss with X button
- ✅ Smooth slide-in/slide-out animations
- ✅ Action buttons (optional)
- ✅ Description text (optional)
- ✅ Dark mode support
- ✅ Accessibility (ARIA labels, live regions)
- ✅ Max 5 notifications (queue management)

## Usage Examples

### 1. Simple Success Notification

```typescript
import { useNotification } from '../../context/NotificationContext';

const { notify } = useNotification();

notify({
  type: 'success',
  title: 'Saved successfully',
  description: 'Your changes have been saved.',
});
```

### 2. Error Notification

```typescript
notify({
  type: 'error',
  title: 'Delete failed',
  description: 'Failed to delete employee',
});
```

### 3. Loading → Success/Error Pattern

```typescript
const { notify, update } = useNotification();

// Show loading
const id = notify({
  type: 'loading',
  title: 'Uploading file...',
  dismissible: false,
});

try {
  await uploadFile();
  
  // Update to success
  update(id, {
    type: 'success',
    title: 'Upload complete',
    duration: 3000,
    dismissible: true,
  });
} catch (error) {
  // Update to error
  update(id, {
    type: 'error',
    title: 'Upload failed',
    duration: 6000,
    dismissible: true,
  });
}
```

### 4. Warning with Action Buttons (Replaces `confirm()`)

```typescript
notify({
  type: 'warning',
  title: 'Delete 5 items?',
  description: 'This action cannot be undone.',
  duration: 10000,
  actions: [
    {
      label: 'Confirm',
      onClick: async () => {
        // Perform delete
        await deleteItems();
        notify({
          type: 'success',
          title: 'Deleted',
          description: '5 items deleted successfully',
        });
      },
    },
    {
      label: 'Cancel',
      onClick: () => {},
    },
  ],
});
```

### 5. Info Notification

```typescript
notify({
  type: 'info',
  title: 'New feature available',
  description: 'Check out the new dashboard widgets',
});
```

## Integration

### Setup (Already Complete)

1. ✅ Wrap app with `NotificationProvider` in `App.tsx`:
   ```tsx
   <NotificationProvider>
     <NotificationContainer />
     <AppContent />
   </NotificationProvider>
   ```

2. ✅ Import and use in any component:
   ```tsx
   import { useNotification } from '../../context/NotificationContext';
   
   const { notify, update, dismiss } = useNotification();
   ```

## Replaced Browser Notifications

All instances of the following have been replaced:

- ❌ `alert()` → ✅ `notify({ type: 'success' | 'error' | 'info' })`
- ❌ `confirm()` → ✅ `notify({ type: 'warning', actions: [...] })`
- ❌ `window.alert()` → ✅ Custom notifications
- ❌ `window.confirm()` → ✅ Action buttons

## Updated Components

### Core Components
- ✅ `MembersTable.tsx` - Delete, bulk delete, export, update errors
- ✅ `FormManagementPage.tsx` - Create, delete, refresh, generate links
- ✅ `ProfileTab.tsx` - Profile updates, account deletion
- ✅ `SecurityTab.tsx` - Password changes, validation
- ✅ `TeamTab.tsx` - Invite code copy

### All Actions Covered
- ✅ Form submissions
- ✅ Delete operations (single & bulk)
- ✅ Update operations
- ✅ Create operations
- ✅ Validation errors
- ✅ Clipboard copy
- ✅ Export actions
- ✅ Template refresh
- ✅ Link generation

## API Reference

### `notify(notification: Omit<Notification, 'id'>): string`

Creates a new notification and returns its ID.

**Parameters:**
```typescript
{
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title: string;
  description?: string;
  duration?: number; // milliseconds, null for no auto-dismiss
  actions?: Array<{ label: string; onClick: () => void }>;
  dismissible?: boolean; // default: true
}
```

### `update(id: string, updates: Partial<Notification>): void`

Updates an existing notification (useful for loading states).

### `dismiss(id: string): void`

Manually dismisses a specific notification.

### `dismissAll(): void`

Dismisses all active notifications.

## Styling

### Colors (Tailwind Classes)

- **Success**: `bg-green-50 dark:bg-green-900/20 border-green-200`
- **Error**: `bg-red-50 dark:bg-red-900/20 border-red-200`
- **Warning**: `bg-amber-50 dark:bg-amber-900/20 border-amber-200`
- **Info/Loading**: `bg-blue-50 dark:bg-blue-900/20 border-blue-200`

### Animations

Custom Tailwind animation defined in `tailwind.config.js`:

```javascript
keyframes: {
  'slide-in-right': {
    '0%': { transform: 'translateX(100%)', opacity: '0' },
    '100%': { transform: 'translateX(0)', opacity: '1' },
  },
},
animation: {
  'slide-in-right': 'slide-in-right 0.3s ease-out',
},
```

## Accessibility

- ✅ ARIA `role="alert"`
- ✅ ARIA `aria-live="assertive"` for errors
- ✅ ARIA `aria-live="polite"` for other types
- ✅ ARIA `aria-atomic="true"`
- ✅ Focus management on action buttons
- ✅ Keyboard-accessible dismiss buttons

## Performance

- ✅ Max 5 notifications prevents UI clutter
- ✅ Auto-cleanup of expired notifications
- ✅ Efficient React Context (no unnecessary re-renders)
- ✅ CSS animations (GPU accelerated)
- ✅ Lazy rendering (only visible notifications)

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Dependencies

- `react` >= 18.0.0
- `lucide-react` (icons)
- `@heroicons/react` (notification icons)
- `tailwindcss` >= 3.0.0

## Future Enhancements

- [ ] Sound effects (optional)
- [ ] Notification history/log
- [ ] Notification grouping (combine similar)
- [ ] Custom icons per notification
- [ ] Positioning options (top-left, bottom-right, etc.)
- [ ] Swipe-to-dismiss (mobile)
- [ ] Notification stacking animations

## Testing

Example test cases covered:

✅ Create notification → appears in top-right
✅ Auto-dismiss after duration → notification removed
✅ Manual dismiss → notification removed immediately
✅ Max 5 notifications → oldest removed when 6th added
✅ Loading → Success transition → maintains position
✅ Action buttons → execute callbacks correctly
✅ Dark mode → colors adjust appropriately

## Migration Guide

### Before (Browser Alert)
```typescript
alert('Saved successfully!');
```

### After (Custom Notification)
```typescript
notify({
  type: 'success',
  title: 'Saved successfully',
});
```

### Before (Confirm)
```typescript
if (confirm('Delete this item?')) {
  await deleteItem();
}
```

### After (Action Buttons)
```typescript
notify({
  type: 'warning',
  title: 'Delete this item?',
  actions: [
    {
      label: 'Confirm',
      onClick: async () => {
        await deleteItem();
        notify({ type: 'success', title: 'Deleted' });
      },
    },
    { label: 'Cancel', onClick: () => {} },
  ],
});
```

---

**Status**: ✅ Fully implemented and deployed
**Build**: ✅ Production build successful
**Coverage**: All user actions across entire application
