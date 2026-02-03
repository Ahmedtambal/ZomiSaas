import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { userProfileService } from '../../services/userProfileService';

export const SecurityTab = () => {
  const { notify } = useNotification();
  const [changing, setChanging] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate new password length
    if (formData.newPassword.length < 8) {
      notify({
        type: 'error',
        title: 'Invalid password',
        description: 'New password must be at least 8 characters',
      });
      return;
    }
    
    // Validate password match
    if (formData.newPassword !== formData.confirmPassword) {
      notify({
        type: 'error',
        title: 'Password mismatch',
        description: 'New passwords do not match',
      });
      return;
    }
    
    try {
      setChanging(true);
      
      await userProfileService.changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
      });
      
      notify({
        type: 'success',
        title: 'Password updated',
        description: 'Your password has been updated successfully',
      });
      
      // Clear form
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('Failed to change password:', error);
      notify({
        type: 'error',
        title: 'Update failed',
        description: error.response?.data?.detail || 'Failed to update password',
      });
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Security</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-slate-900"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-slate-900"
              minLength={8}
              required
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">Minimum 8 characters</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="glass-input w-full pl-12 pr-4 py-3 rounded-xl text-slate-900"
              required
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={changing}
            className="px-6 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {changing ? 'Updating...' : 'Update Password'}
          </button>
          <button
            type="button"
            onClick={() => setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
            disabled={changing}
            className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
