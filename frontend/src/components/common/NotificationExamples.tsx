// Example usage of the notification system across your application

import { useNotification } from '../context/NotificationContext';

// Example 1: Simple success notification
export const ExampleSuccess = () => {
  const { notify } = useNotification();
  
  const handleSave = () => {
    // ... your save logic
    notify({
      type: 'success',
      title: 'Saved successfully',
      description: 'Your changes have been saved.',
    });
  };
  
  return <button onClick={handleSave}>Save</button>;
};

// Example 2: Error notification with longer duration
export const ExampleError = () => {
  const { notify } = useNotification();
  
  const handleDelete = async () => {
    try {
      // ... your delete logic
      throw new Error('Failed to delete');
    } catch (error) {
      notify({
        type: 'error',
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };
  
  return <button onClick={handleDelete}>Delete</button>;
};

// Example 3: Loading notification that updates
export const ExampleLoading = () => {
  const { notify, update, dismiss } = useNotification();
  
  const handleUpload = async () => {
    const id = notify({
      type: 'loading',
      title: 'Uploading file...',
      dismissible: false,
    });
    
    try {
      // ... your upload logic
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update to success
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
  
  return <button onClick={handleUpload}>Upload</button>;
};

// Example 4: Notification with action buttons
export const ExampleWithActions = () => {
  const { notify } = useNotification();
  
  const handleBulkDelete = () => {
    notify({
      type: 'warning',
      title: 'Delete 5 items?',
      description: 'This action cannot be undone.',
      duration: 10000, // 10 seconds
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
          onClick: () => {
            notify({
              type: 'info',
              title: 'Cancelled',
              description: 'Delete operation cancelled',
            });
          },
        },
      ],
    });
  };
  
  return <button onClick={handleBulkDelete}>Bulk Delete</button>;
};

// Example 5: Info notification
export const ExampleInfo = () => {
  const { notify } = useNotification();
  
  const showInfo = () => {
    notify({
      type: 'info',
      title: 'New feature available',
      description: 'Check out the new dashboard widgets',
    });
  };
  
  return <button onClick={showInfo}>Show Info</button>;
};

// Example 6: Replace browser alerts/confirms
export const ExampleReplaceAlert = () => {
  const { notify } = useNotification();
  
  const handleSubmit = () => {
    // Instead of: alert('Form submitted!')
    notify({
      type: 'success',
      title: 'Form submitted',
      description: 'We will review your submission shortly',
    });
  };
  
  const handleConfirm = () => {
    // Instead of: if (confirm('Are you sure?'))
    notify({
      type: 'warning',
      title: 'Are you sure?',
      description: 'This will permanently delete the record',
      duration: 10000,
      actions: [
        {
          label: 'Yes, delete',
          onClick: () => {
            // Perform action
            notify({
              type: 'success',
              title: 'Deleted',
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
  
  return (
    <>
      <button onClick={handleSubmit}>Submit Form</button>
      <button onClick={handleConfirm}>Delete Record</button>
    </>
  );
};
