import { useState, useEffect } from 'react';
import { UserPlus, Copy, Check, Trash2, Shield, User, Crown, Key, ChevronDown } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { teamManagementService, InviteCode, Member } from '../../services/teamManagementService';

export const TeamTab = () => {
  const { notify } = useNotification();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [inviteCode, setInviteCode] = useState<InviteCode | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>('user');

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const data = await teamManagementService.getMembers();
      setMembers(data);
    } catch (error: any) {
      console.error('Failed to load members:', error);
      notify({
        type: 'error',
        title: 'Load failed',
        description: error.response?.data?.detail || 'Failed to load team members',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      setGenerating(true);
      const code = await teamManagementService.createInviteCode({
        role: selectedRole,
        expires_in_days: 7,
      });
      setInviteCode(code);
      setShowInviteModal(true);
    } catch (error: any) {
      console.error('Failed to generate invite code:', error);
      notify({
        type: 'error',
        title: 'Generation failed',
        description: error.response?.data?.detail || 'Failed to generate invite code',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      notify({
        type: 'success',
        title: 'Code copied',
        description: 'Invite code copied to clipboard',
        duration: 2000,
      });
    }
  };

  const handleUpdateRole = async (memberId: string, memberName: string, currentRole: string) => {
    // Determine new role
    let newRole: string;
    let confirmMessage: string;

    if (currentRole === 'user') {
      newRole = 'admin';
      confirmMessage = `Promote ${memberName} to Admin?`;
    } else if (currentRole === 'admin') {
      if (user?.role === 'owner') {
        // Owner can promote admin to owner OR demote to user
        notify({
          type: 'warning',
          title: 'Change Admin Role',
          description: `Promote ${memberName} to Owner (you will become Admin) or demote to User?`,
          duration: 15000,
          actions: [
            {
              label: 'Promote to Owner',
              onClick: async () => {
                await updateMemberRole(memberId, 'owner');
              },
            },
            {
              label: 'Demote to User',
              onClick: async () => {
                await updateMemberRole(memberId, 'user');
              },
            },
            {
              label: 'Cancel',
              onClick: () => {},
            },
          ],
        });
        return;
      } else {
        newRole = 'user';
        confirmMessage = `Demote ${memberName} to User?`;
      }
    } else {
      return; // Cannot change owner role
    }

    notify({
      type: 'warning',
      title: confirmMessage,
      description: 'This will change their access permissions.',
      duration: 10000,
      actions: [
        {
          label: 'Confirm',
          onClick: async () => {
            await updateMemberRole(memberId, newRole);
          },
        },
        {
          label: 'Cancel',
          onClick: () => {},
        },
      ],
    });
  };

  const updateMemberRole = async (memberId: string, newRole: string) => {
    try {
      await teamManagementService.updateMemberRole(memberId, { new_role: newRole });
      notify({
        type: 'success',
        title: 'Role updated',
        description: 'Member role updated successfully',
      });
      await loadMembers();
    } catch (error: any) {
      console.error('Failed to update role:', error);
      notify({
        type: 'error',
        title: 'Update failed',
        description: error.response?.data?.detail || 'Failed to update member role',
      });
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    notify({
      type: 'warning',
      title: `Delete ${memberName}?`,
      description: 'This action cannot be undone. The user will be removed from the organization.',
      duration: 10000,
      actions: [
        {
          label: 'Confirm Delete',
          onClick: async () => {
            try {
              await teamManagementService.deleteMember(memberId);
              notify({
                type: 'success',
                title: 'Member deleted',
                description: 'Team member removed successfully',
              });
              await loadMembers();
            } catch (error: any) {
              console.error('Failed to delete member:', error);
              notify({
                type: 'error',
                title: 'Delete failed',
                description: error.response?.data?.detail || 'Failed to delete member',
              });
            }
          },
        },
        {
          label: 'Cancel',
          onClick: () => {},
        },
      ],
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-600" />;
      default:
        return <User className="w-4 h-4 text-slate-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const canModifyMember = (memberRole: string, memberId: string) => {
    if (memberId === user?.id) return false; // Cannot modify self
    if (memberRole === 'owner') return false; // Cannot modify owner
    if (user?.role === 'owner') return true;
    if (user?.role === 'admin' && memberRole === 'user') return true;
    return false;
  };

  const canDeleteMember = (memberRole: string, memberId: string) => {
    if (memberId === user?.id) return false; // Cannot delete self
    if (memberRole === 'owner') return false; // Cannot delete owner
    if (user?.role === 'owner') return true;
    if (user?.role === 'admin' && memberRole !== 'admin') return true;
    return false;
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zomi-green mx-auto"></div>
        <p className="text-center text-slate-600 mt-4">Loading team...</p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Team Management</h2>
          {isAdmin && (
            <div className="flex gap-3 items-center">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'user')}
                className="px-4 py-3 rounded-xl text-slate-900 border border-slate-200 bg-white focus:border-zomi-green focus:outline-none transition-colors"
              >
                <option value="user">Invite as User</option>
                <option value="admin">Invite as Admin</option>
              </select>
              <button
                onClick={handleGenerateCode}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-5 h-5" />
                {generating ? 'Generating...' : 'Generate Invite Code'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 bg-white/50 hover:bg-white/80 rounded-xl transition-all duration-200 border border-slate-100"
            >
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{member.full_name}</p>
                <p className="text-sm text-slate-600">{member.email || 'No email'}</p>
                {member.job_title && (
                  <p className="text-xs text-slate-500 mt-1">{member.job_title}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleUpdateRole(member.id, member.full_name, member.role)}
                  disabled={!canModifyMember(member.role, member.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border transition-all duration-200 ${
                    getRoleBadgeColor(member.role)
                  } ${
                    canModifyMember(member.role, member.id)
                      ? 'hover:shadow-md cursor-pointer'
                      : 'opacity-75 cursor-not-allowed'
                  }`}
                  title={canModifyMember(member.role, member.id) ? 'Click to change role' : ''}
                >
                  {getRoleIcon(member.role)}
                  <span className="capitalize">{member.role}</span>
                  {canModifyMember(member.role, member.id) && (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {canDeleteMember(member.role, member.id) && (
                  <button
                    onClick={() => handleDeleteMember(member.id, member.full_name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Delete member"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showInviteModal && inviteCode && (
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
            <div className="bg-white p-4 rounded-xl mb-2">
              <p className="text-4xl font-bold text-center text-zomi-green tracking-widest">
                {inviteCode.code}
              </p>
            </div>
            <p className="text-xs text-slate-500 text-center mb-6">
              Role: <span className="font-semibold capitalize">{inviteCode.role}</span> • Expires: {new Date(inviteCode.expires_at).toLocaleDateString()}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCopyCode}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white font-semibold rounded-xl transition-all duration-200"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-5 h-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Code
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setCopiedCode(false);
                }}
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
