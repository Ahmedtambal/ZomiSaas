import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export const AppConfigTab = () => {
  const [nationalities, setNationalities] = useState([
    'British', 'Irish', 'American', 'Canadian', 'Australian'
  ]);
  const [maritalStatuses, setMaritalStatuses] = useState([
    'Single', 'Married', 'Divorced', 'Widowed', 'Civil Partnership'
  ]);

  const [newNationality, setNewNationality] = useState('');
  const [newMaritalStatus, setNewMaritalStatus] = useState('');

  const addNationality = () => {
    if (newNationality.trim() && !nationalities.includes(newNationality.trim())) {
      setNationalities([...nationalities, newNationality.trim()]);
      setNewNationality('');
    }
  };

  const removeNationality = (value: string) => {
    setNationalities(nationalities.filter(n => n !== value));
  };

  const addMaritalStatus = () => {
    if (newMaritalStatus.trim() && !maritalStatuses.includes(newMaritalStatus.trim())) {
      setMaritalStatuses([...maritalStatuses, newMaritalStatus.trim()]);
      setNewMaritalStatus('');
    }
  };

  const removeMaritalStatus = (value: string) => {
    setMaritalStatuses(maritalStatuses.filter(m => m !== value));
  };

  return (
    <div className="glass-panel rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">App Configuration</h2>

      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Accepted Nationalities</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newNationality}
              onChange={(e) => setNewNationality(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addNationality()}
              className="glass-input flex-1 px-4 py-3 rounded-xl text-slate-900"
              placeholder="Add nationality..."
            />
            <button
              onClick={addNationality}
              className="px-4 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white rounded-xl transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {nationalities.map((nationality) => (
              <span
                key={nationality}
                className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-lg"
              >
                <span className="text-sm font-medium text-slate-900">{nationality}</span>
                <button
                  onClick={() => removeNationality(nationality)}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Marital Status Options</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newMaritalStatus}
              onChange={(e) => setNewMaritalStatus(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addMaritalStatus()}
              className="glass-input flex-1 px-4 py-3 rounded-xl text-slate-900"
              placeholder="Add marital status..."
            />
            <button
              onClick={addMaritalStatus}
              className="px-4 py-3 bg-zomi-green hover:bg-zomi-green/90 text-white rounded-xl transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {maritalStatuses.map((status) => (
              <span
                key={status}
                className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-lg"
              >
                <span className="text-sm font-medium text-slate-900">{status}</span>
                <button
                  onClick={() => removeMaritalStatus(status)}
                  className="text-slate-400 hover:text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
