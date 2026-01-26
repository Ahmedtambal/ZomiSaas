import React, { useState, useEffect } from 'react';
import { 
  generateToken, 
  getTokens, 
  updateToken, 
  copyTokenUrl,
  formatSubmissionCount,
  daysUntilExpiry,
  isTokenExpired,
  hasReachedSubmissionLimit 
} from '../../services/formService';
import { FormToken } from '../../types/forms';

interface FormTokenManagerProps {
  formId: string;
}

interface Company {
  id: string;
  name: string;
}

export const FormTokenManager: React.FC<FormTokenManagerProps> = ({ formId }) => {
  const [tokens, setTokens] = useState<FormToken[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  
  // Modal form state
  const [selectedCompany, setSelectedCompany] = useState('');
  const [expiryDays, setExpiryDays] = useState(30);
  const [maxSubmissions, setMaxSubmissions] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    loadTokens();
    loadCompanies();
  }, [formId]);

  const loadTokens = async () => {
    try {
      setLoading(true);
      const data = await getTokens(formId);
      setTokens(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load tokens:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://zomisaasbackend.onrender.com'}/api/companies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCompanies(Array.isArray(data) ? data : []);
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    }
  };

  const handleGenerateToken = async () => {
    if (!selectedCompany) {
      setError('Please select a company');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const newToken = await generateToken(formId, {
        company_id: selectedCompany,
        expiry_days: expiryDays,
        max_submissions: maxSubmissions || undefined,
      });

      setTokens(prev => [newToken, ...prev]);
      setShowModal(false);
      resetModalForm();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate token');
    } finally {
      setGenerating(false);
    }
  };

  const handleDeactivateToken = async (tokenId: string) => {
    try {
      const updatedToken = await updateToken(tokenId, { is_active: false });
      setTokens(prev => prev.map(t => t.id === tokenId ? updatedToken : t));
    } catch (err) {
      console.error('Failed to deactivate token:', err);
    }
  };

  const handleCopyUrl = async (url: string, tokenId: string) => {
    try {
      await copyTokenUrl(url);
      setCopiedToken(tokenId);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const resetModalForm = () => {
    setSelectedCompany('');
    setExpiryDays(30);
    setMaxSubmissions(null);
    setError('');
  };

  const getFilteredTokens = () => {
    const safeTokens = tokens || [];
    switch (filter) {
      case 'active':
        return safeTokens.filter(t => t.isActive && !isTokenExpired(t.expiresAt));
      case 'expired':
        return safeTokens.filter(t => !t.isActive || isTokenExpired(t.expiresAt));
      default:
        return safeTokens;
    }
  };

  const getTokenStatusBadge = (token: FormToken) => {
    if (!token.isActive) {
      return <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-full text-xs">Deactivated</span>;
    }
    if (isTokenExpired(token.expiresAt)) {
      return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">Expired</span>;
    }
    if (hasReachedSubmissionLimit(token)) {
      return <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs">Limit Reached</span>;
    }
    return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Active</span>;
  };

  const getSubmissionProgress = (token: FormToken) => {
    if (!token.maxSubmissions) return null;
    
    const percentage = (token.submissionCount / token.maxSubmissions) * 100;
    
    return (
      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all ${
            percentage >= 100 ? 'bg-red-500' : percentage >= 80 ? 'bg-orange-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    );
  };

  const filteredTokens = getFilteredTokens();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Form Links</h2>
          <p className="text-white/60">Generate and manage public form access links</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Generate Link
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-white/10 backdrop-blur-lg rounded-lg p-1">
        {(['all', 'active', 'expired'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              filter === f
                ? 'bg-white/20 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Tokens List */}
      {loading ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/60">Loading tokens...</p>
        </div>
      ) : filteredTokens.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-center">
          <svg className="w-16 h-16 text-white/40 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <p className="text-white/60">No tokens found</p>
          <p className="text-white/40 text-sm mt-2">Generate a link to share this form</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTokens.map((token) => {
            const companyName = companies.find(c => c.id === token.companyId)?.name || 'Unknown Company';
            const daysLeft = daysUntilExpiry(token.expiresAt);

            return (
              <div key={token.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6 hover:bg-white/15 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-white font-semibold">{companyName}</h3>
                      {getTokenStatusBadge(token)}
                    </div>
                    <div className="flex items-center gap-2 text-white/60 text-sm mb-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Created: {new Date(token.createdAt).toLocaleDateString()}
                    </div>
                    {token.expiresAt && (
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {isTokenExpired(token.expiresAt) ? (
                          <span className="text-red-400">Expired on {new Date(token.expiresAt).toLocaleDateString()}</span>
                        ) : daysLeft !== null ? (
                          <span>{daysLeft} days remaining</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopyUrl(token.url, token.id)}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-2"
                      title="Copy link"
                    >
                      {copiedToken === token.id ? (
                        <>
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                    
                    {token.isActive && !isTokenExpired(token.expiresAt) && (
                      <button
                        onClick={() => handleDeactivateToken(token.id)}
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
                        title="Deactivate"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </div>

                {/* Submission Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Submissions</span>
                    <span className="text-white font-medium">{formatSubmissionCount(token)}</span>
                  </div>
                  {getSubmissionProgress(token)}
                </div>

                {/* Access Stats */}
                <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-sm text-white/60">
                  <span>Access Count: {token.accessCount}</span>
                  {token.lastAccessedAt && (
                    <span>Last accessed: {new Date(token.lastAccessedAt).toLocaleDateString()}</span>
                  )}
                </div>

                {/* URL Preview */}
                <div className="mt-4 p-3 bg-black/20 rounded-lg">
                  <p className="text-white/40 text-xs mb-1">Link URL:</p>
                  <p className="text-white/80 text-sm font-mono break-all">{token.url}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generate Token Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-6">Generate Form Link</h3>

            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2">Company *</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select Company</option>
                  {(companies || []).map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white mb-2">Expiry (days)</label>
                <input
                  type="number"
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                  min="1"
                  max="365"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-white/60 text-sm mt-1">Link will expire in {expiryDays} days</p>
              </div>

              <div>
                <label className="block text-white mb-2">Max Submissions (optional)</label>
                <input
                  type="number"
                  value={maxSubmissions || ''}
                  onChange={(e) => setMaxSubmissions(e.target.value ? parseInt(e.target.value) : null)}
                  min="1"
                  placeholder="Unlimited"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-white/60 text-sm mt-1">Leave empty for unlimited submissions</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetModalForm();
                }}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateToken}
                disabled={generating}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
