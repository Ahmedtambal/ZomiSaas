import { useState } from 'react';
import { UserPlus, Trash2, Key } from 'lucide-react';
import { User } from '../../types';

export const TeamTab = () => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  const mockTeam: User[] = [
    {
      id: '1',
      email: 'admin@zomiwealth.com',
      fullName: 'Admin User',
      role: 'Admin',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      email: 'member@zomiwealth.com',
      fullName: 'Member User',
      role: 'Member',
      createdAt: '2024-01-10T00:00:00Z',
    },
  ];

  const generateInviteCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setShowInviteModal(true);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    alert('Invite code copied to clipboard!');
  };

  return (
    <>
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Team Management</h2>
          <button
            onClick={generateInviteCode}
            className="flex items-center gap-2 px-4 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200"
          >
            <UserPlus className="w-5 h-5" />
            Generate Invite Code
          </button>
        </div>

        <div className="space-y-3">
          {mockTeam.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-white/50 hover:bg-white/80 rounded-xl transition-all duration-200"
            >
              <div>
                <p className="font-semibold text-slate-900">{member.fullName}</p>
                <p className="text-sm text-slate-600">{member.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-sm font-semibold rounded ${
                  member.role === 'Admin'
                    ? 'bg-zomi-mint text-zomi-green'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {member.role}
                </span>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-zomi-mint rounded-xl flex items-center justify-center">
                <Key className="w-6 h-6 text-zomi-green" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Invite Code Generated</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Share this code with the new team member. It can be used once to create an account.
            </p>
            <div className="bg-white/80 p-4 rounded-xl mb-6">
              <p className="text-4xl font-bold text-center text-zomi-green tracking-widest">
                {generatedCode}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={copyCode}
                className="flex-1 px-4 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200"
              >
                Copy Code
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
