import { useState } from 'react';
import { Lock } from 'lucide-react';

export const SecurityTab = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    alert('Password updated successfully!');
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
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
            className="px-6 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200"
          >
            Update Password
          </button>
          <button
            type="button"
            onClick={() => setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' })}
            className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
