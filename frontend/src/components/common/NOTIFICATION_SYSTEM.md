# Custom Toast Notification System

A custom-built toast notification center for the Zomi Dashboard application that replaces all browser-native alerts and confirms with a beautifully designed, consistent notification system.

## 🎨 Features

- **5 Notification Types**: success, error, warning, info, loading
- **Auto-dismiss**: Configurable duration per notification type
- **Progress Bar**: Visual countdown showing time remaining
- **Manual Dismiss**: X button to close notifications early
- **Smooth Animations**: Slide in/out transitions
- **Action Buttons**: Optional actions for confirmations
- **Dark Mode Support**: Automatic theme adaptation
- **Accessibility**: ARIA labels and live regions
- **Position**: Fixed top-right corner (z-index: 9999)
- **Max Notifications**: Shows up to 5 notifications at once

## 📦 Architecture

### Components

1. **NotificationContext.tsx** - Central state management using React Context
2. **NotificationContainer.tsx** - UI component that renders notifications
3. **App.tsx** - Wrapped with NotificationProvider

### Notification Types & Durations

| Type      | Color  | Icon                  | Duration | Auto-dismiss |
|-----------|--------|-----------------------|----------|--------------|
| ✅ success | Green  | CheckCircleIcon       | 3s       | Yes          |
| ❌ error   | Red    | XCircleIcon           | 6s       | Yes          |
| ⚠️ warning | Amber  | ExclamationTriangle   | 3s       | Yes          |
| ℹ️ info    | Blue   | InformationCircleIcon | 3s       | Yes          |
| ⏳ loading | Blue   | Spinner               | -        | No           |

## 🚀 Usage

### Basic Notification

```tsx
import { useNotification } from '../../context/NotificationContext';

function MyComponent() {
  const { notify } = useNotification();

  const handleSave = () => {
    notify({
      type: 'success',
      title: 'Saved successfully',
      description: 'Your changes have been saved.',
    });
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Error Notification

```tsx
const handleDelete = async () => {
  try {
    await deleteItem();
  } catch (error) {
    notify({
      type: 'error',
      title: 'Delete failed',
      description: error.message || 'An error occurred',
    });
  }
};
```

### Loading Notification that Updates

```tsx
const handleUpload = async () => {
  const id = notify({
    type: 'loading',
    title: 'Uploading file...',
    dismissible: false,
  });

  try {
    await uploadFile();
    
    update(id, {
      type: 'success',
      title: 'Upload complete',
      description: 'File uploaded successfully',
      duration: 3000,
      dismissible: true,
    });
  } catch (error) {
    update(id, {
      type: 'error',
      title: 'Upload failed',
      description: 'Failed to upload file',
      duration: 6000,
      dismissible: true,
    });
  }
};
```

### Confirmation with Action Buttons

```tsx
const handleBulkDelete = () => {
  notify({
    type: 'warning',
    title: 'Delete 5 items?',
    description: 'This action cannot be undone',
    duration: 10000,
    actions: [
      {
        label: 'Confirm',
        onClick: () => {
          // Perform delete
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
};
```

### Custom Duration

```tsx
notify({
  type: 'info',
  title: 'Important message',
  description: 'This will stay visible for 10 seconds',
  duration: 10000, // 10 seconds
});
```

## 🔧 API Reference

### `useNotification()` Hook

Returns an object with the following methods:

#### `notify(notification)`

Creates and displays a new notification.

**Parameters:**
- `type` (required): `'success' | 'error' | 'warning' | 'info' | 'loading'`
- `title` (required): `string` - Main notification text
- `description` (optional): `string` - Additional details
- `duration` (optional): `number` - Custom duration in milliseconds
- `actions` (optional): `Array<{ label: string, onClick: () => void }>` - Action buttons
- `dismissible` (optional): `boolean` - Allow manual dismiss (default: true)

**Returns:** `string` - Notification ID

#### `update(id, updates)`

Updates an existing notification (useful for loading states).

**Parameters:**
- `id` (required): `string` - Notification ID returned by `notify()`
- `updates` (required): `Partial<Notification>` - Properties to update

#### `dismiss(id)`

Manually dismisses a specific notification.

**Parameters:**
- `id` (required): `string` - Notification ID to dismiss

#### `dismissAll()`

Dismisses all active notifications.

## 📍 Where It's Used

The custom notification system has replaced browser alerts/confirms across:

- ✅ **MembersTable.tsx** - Delete operations, bulk delete, export, update errors
- ✅ **FormManagementPage.tsx** - Form creation, deletion, template refresh, link generation
- ✅ **FormsListPage.tsx** - Form deletion
- ✅ **FormGenerator.tsx** - Form deletion, link copying
- ✅ **ProfileTab.tsx** - Profile updates, account deletion
- ✅ **SecurityTab.tsx** - Password updates, validation errors
- ✅ **TeamTab.tsx** - Invite code copying

## 🎨 Styling

Notifications use Tailwind CSS with:
- Glass-morphism effects
- Dark mode support via `dark:` variants
- Smooth animations defined in [tailwind.config.js](../../../tailwind.config.js)
- Color-coded borders and backgrounds

## ♿ Accessibility

- **ARIA live regions** for screen readers
- **aria-live="assertive"** for error notifications
- **aria-live="polite"** for other types
- **aria-label** on dismiss buttons
- **Keyboard accessible** action buttons

## 🔄 Migration Guide

### Before (Browser Alert)
```tsx
alert('Form submitted successfully!');
```

### After (Custom Notification)
```tsx
notify({
  type: 'success',
  title: 'Form submitted',
  description: 'Form submitted successfully',
});
```

### Before (Browser Confirm)
```tsx
if (confirm('Are you sure?')) {
  deleteItem();
}
```

### After (Custom Notification)
```tsx
notify({
  type: 'warning',
  title: 'Are you sure?',
  description: 'This action cannot be undone',
  duration: 10000,
  actions: [
    { label: 'Yes, delete', onClick: () => deleteItem() },
    { label: 'Cancel', onClick: () => {} },
  ],
});
```

## 📝 Examples

See [NotificationExamples.tsx](NotificationExamples.tsx) for comprehensive usage examples including:
- Simple success notifications
- Error handling
- Loading states that update
- Confirmations with action buttons
- Info messages
- Replacing browser alerts/confirms

## 🛠️ Configuration

Modify default durations in [NotificationContext.tsx](../../context/NotificationContext.tsx):

```tsx
const DEFAULT_DURATIONS: Record<NotificationType, number | null> = {
  success: 3000,
  error: 6000,
  warning: 3000,
  info: 3000,
  loading: null, // No auto-dismiss
};
```

Adjust max notifications:
```tsx
const MAX_NOTIFICATIONS = 5;
```

## 🎯 Best Practices

1. **Use appropriate types**: Match the notification type to the action severity
2. **Keep titles short**: 3-7 words for quick scanning
3. **Use descriptions for context**: Add details when needed
4. **Loading states**: Always update loading notifications to success/error
5. **Confirmations**: Use action buttons for destructive operations
6. **Duration**: Longer for errors (6s), shorter for success (3s)
7. **Accessibility**: Ensure action buttons have clear labels

## 🚨 Common Patterns

### Form Submission
```tsx
const loadingId = notify({ type: 'loading', title: 'Submitting...' });
try {
  await submitForm();
  update(loadingId, { type: 'success', title: 'Submitted', duration: 3000 });
} catch (error) {
  update(loadingId, { type: 'error', title: 'Failed', duration: 6000 });
}
```

### Bulk Operations
```tsx
notify({
  type: 'warning',
  title: `Delete ${count} items?`,
  actions: [
    { label: 'Confirm', onClick: performDelete },
    { label: 'Cancel', onClick: () => {} },
  ],
});
```

### Copy to Clipboard
```tsx
navigator.clipboard.writeText(text);
notify({ type: 'success', title: 'Copied to clipboard' });
```

## 📦 Dependencies

- React 18+
- Tailwind CSS 3+
- @heroicons/react 2+
- TypeScript 5+

## 🔮 Future Enhancements

- [ ] Sound effects (optional)
- [ ] Notification queue management
- [ ] Position customization (top-left, bottom-right, etc.)
- [ ] Custom icons per notification
- [ ] Notification history/log
- [ ] Priority levels (high priority notifications stay longer)
- [ ] Undo actions for destructive operations
