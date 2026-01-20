import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle } from 'lucide-react';

export const ProfileTab = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    dateOfBirth: user?.dateOfBirth || '',
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Profile updated successfully!');
  };

  const handleDelete = () => {
    alert('Account deletion initiated. This action cannot be undone.');
    setShowDeleteModal(false);
  };

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
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="glass-input w-full px-4 py-3 rounded-xl text-slate-900"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="px-6 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200"
            >
              Save Changes
            </button>
            <button
              type="button"
              className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200"
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
