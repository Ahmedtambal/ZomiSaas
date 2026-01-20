import { useState } from 'react';
import { User, Shield, Users as UsersIcon, Settings as SettingsIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ProfileTab } from './ProfileTab';
import { SecurityTab } from './SecurityTab';
import { TeamTab } from './TeamTab';
import { AppConfigTab } from './AppConfigTab';

export const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    ...(user?.role === 'Admin' ? [
      { id: 'team', label: 'Team Management', icon: UsersIcon },
      { id: 'config', label: 'App Config', icon: SettingsIcon },
    ] : []),
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileTab />;
      case 'security':
        return <SecurityTab />;
      case 'team':
        return user?.role === 'Admin' ? <TeamTab /> : null;
      case 'config':
        return user?.role === 'Admin' ? <AppConfigTab /> : null;
      default:
        return <ProfileTab />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
        <p className="text-slate-600">Manage your account and application preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="glass-panel rounded-2xl p-4">
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200
                    ${isActive
                      ? 'bg-zomi-green text-white shadow-lg'
                      : 'text-slate-700 hover:bg-white/50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="lg:col-span-3">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
