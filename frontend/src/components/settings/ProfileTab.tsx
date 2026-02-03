import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { userProfileService, UserProfile } from '../../services/userProfileService';

export const ProfileTab = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    jobTitle: '',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load user profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await userProfileService.getMyProfile();
      setProfile(profileData);
      setFormData({
        fullName: profileData.full_name || '',
        email: profileData.email || '',
        jobTitle: profileData.job_title || '',
      });
    } catch (error: any) {
      console.error('Failed to load profile:', error);
      notify({
        type: 'error',
        title: 'Load failed',
        description: error.response?.data?.detail || 'Failed to load profile',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const updateData = {
        full_name: formData.fullName,
        job_title: formData.jobTitle || null,
      };
      
      await userProfileService.updateMyProfile(updateData);
      
      notify({
        type: 'success',
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
      
      // Reload profile to get latest data
      await loadProfile();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      notify({
        type: 'error',
        title: 'Update failed',
        description: error.response?.data?.detail || 'Failed to update profile',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    notify({
      type: 'error',
      title: 'Account deletion',
      description: 'Account deletion initiated. This action cannot be undone.',
      duration: 8000,
    });
    setShowDeleteModal(false);
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zomi-green mx-auto"></div>
        <p className="text-center text-slate-600 mt-4">Loading profile...</p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">My Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="glass-input w-full px-4 py-3 rounded-xl text-slate-900 bg-slate-100 cursor-not-allowed"
              title="Email cannot be changed"
            />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Job Title</label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
              placeholder="e.g. Financial Advisor"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={loadProfile}
              disabled={saving}
              className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-2">Danger Zone</h3>
          <p className="text-sm text-slate-600 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200"
          >
            Delete My Account
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Delete Account</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Are you absolutely sure? This action cannot be undone. This will permanently delete your account and remove your data from our servers.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-200"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
