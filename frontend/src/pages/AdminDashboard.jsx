import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FiRefreshCw, FiSave, FiLogOut, FiUsers, FiActivity } from 'react-icons/fi';
import { FaTrophy, FaChartBar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { getMarkets, getLiveBets, updateMarketTimings, declareResult } from '../services/apiService';

const AdminDashboard = () => {
  const [markets, setMarkets] = useState([]);
  const [liveBets, setLiveBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [result, setResult] = useState({
    marketId: '',
    date: new Date().toISOString().split('T')[0],
    number: '',
  });
  const [declaring, setDeclaring] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [mRes, bRes] = await Promise.all([getMarkets(), getLiveBets()]);
      setMarkets(mRes.data);
      setLiveBets(bRes.data);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 15000);
    return () => clearInterval(id);
  }, [load]);

  const saveMarket = async (m) => {
    try {
      await updateMarketTimings({ id: m.id, openTime: m.open_time, closeTime: m.close_time });
      toast.success(`✅ ${m.name} updated`);
    } catch {
      toast.error('Update failed');
    }
  };

  const patchMarket = (id, field, val) => {
    setMarkets(prev => prev.map(m => m.id === id ? { ...m, [field]: val } : m));
  };

  const publish = async () => {
    if (!result.marketId || !result.number) return toast.error('Select market and enter winning number');
    setDeclaring(true);
    try {
      const { data } = await declareResult({
        marketId: result.marketId,
        marketDate: result.date,
        winningNumber: result.number,
      });
      toast.success(`🏆 Result published! ${data.settledBets} bets settled. Payout: ₹${Math.floor(data.totalPayout).toLocaleString('en-IN')}`);
      setResult(r => ({ ...r, number: '' }));
      load(true);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to declare result');
    } finally {
      setDeclaring(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const totalBets = liveBets.length;
  const totalVolume = liveBets.reduce((a, b) => a + (parseFloat(b.amount) || 0), 0);
  const openMarkets = markets.filter(m => m.status === 'open').length;
  const pendingBets = liveBets.filter(b => b.status === 'pending').length;

  const TABS = [
    { key: 'overview', label: 'Overview', icon: <FaChartBar size={14} /> },
    { key: 'timings', label: 'Timings', icon: <FiActivity size={14} /> },
    { key: 'declare', label: 'Declare', icon: <FaTrophy size={14} /> },
    { key: 'feed', label: 'Live Feed', icon: <FiUsers size={14} /> },
  ];

  return (
    <div className="shell" style={{ maxWidth: '720px' }}>
      <div className="shell-content" style={{ padding: '24px 20px 80px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <p style={{
              fontSize: '24px', fontWeight: 900, letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #f0f0fa 0%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Admin Panel</p>
            <p style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500, marginTop: '1px' }}>
              Malvia Control Center
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => load()}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'var(--surface2)', border: '1px solid var(--border2)',
                borderRadius: '12px', padding: '9px 14px',
                color: 'var(--indigo)', fontSize: '13px', fontWeight: 700,
              }}
            >
              <FiRefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
              Refresh
            </button>
            <button
              onClick={logout}
              className="btn-danger"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FiLogOut size={14} /> Out
            </button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '24px' }} className="stagger">
          {[
            { label: 'Live Bets', value: totalBets, color: 'var(--indigo)', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
            { label: 'Pending', value: pendingBets, color: 'var(--gold)', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.2)' },
            { label: 'Volume', value: `₹${Math.floor(totalVolume).toLocaleString('en-IN')}`, color: 'var(--green)', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)' },
            { label: 'Open Markets', value: `${openMarkets}/${markets.length}`, color: 'var(--violet)', bg: 'rgba(167,139,250,0.1)', border: 'rgba(167,139,250,0.2)' },
          ].map(s => (
            <div key={s.label} className="card card-sm anim-fadeUp" style={{ background: s.bg, borderColor: s.border, marginBottom: 0, borderRadius: '16px' }}>
              <p className="label" style={{ color: s.color }}>{s.label}</p>
              <p style={{ fontWeight: 900, fontSize: '22px', color: s.color, lineHeight: 1.2, marginTop: '4px' }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: '4px', background: 'var(--surface2)', borderRadius: '14px', padding: '4px', border: '1px solid var(--border)', marginBottom: '20px' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                flex: 1, padding: '9px 4px',
                borderRadius: '10px',
                background: activeTab === t.key ? 'var(--surface3)' : 'none',
                border: activeTab === t.key ? '1px solid var(--border3)' : '1px solid transparent',
                color: activeTab === t.key ? 'var(--text)' : 'var(--muted)',
                fontSize: '11px', fontWeight: 700,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                transition: 'all 0.18s',
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Market Timings ── */}
        {activeTab === 'timings' && (
          <div className="card anim-fadeIn">
            <p style={{ fontWeight: 800, fontSize: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiActivity style={{ color: 'var(--indigo)' }} /> Market Timings
            </p>
            {loading ? (
              <div className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {markets.map(m => (
                  <div key={m.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
                    background: 'var(--surface2)', borderRadius: '14px', padding: '14px 16px',
                    border: '1px solid var(--border)',
                  }}>
                    <div style={{ flex: '1', minWidth: '120px' }}>
                      <p style={{ fontWeight: 700, fontSize: '14px' }}>{m.name}</p>
                      <span className={`badge ${m.status === 'open' ? 'badge-green' : 'badge-red'}`} style={{ marginTop: '4px' }}>
                        {m.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <div>
                        <label className="label" style={{ marginBottom: '4px' }}>Open</label>
                        <input
                          type="time"
                          value={m.open_time.slice(0, 5)}
                          onChange={e => patchMarket(m.id, 'open_time', e.target.value + ':00')}
                          style={{ width: '120px', padding: '8px 10px', fontSize: '13px', fontWeight: 700 }}
                        />
                      </div>
                      <span style={{ color: 'var(--muted)', fontWeight: 700, alignSelf: 'flex-end', paddingBottom: '8px' }}>→</span>
                      <div>
                        <label className="label" style={{ marginBottom: '4px' }}>Close</label>
                        <input
                          type="time"
                          value={m.close_time.slice(0, 5)}
                          onChange={e => patchMarket(m.id, 'close_time', e.target.value + ':00')}
                          style={{ width: '120px', padding: '8px 10px', fontSize: '13px', fontWeight: 700 }}
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => saveMarket(m)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        background: 'rgba(99,102,241,0.15)',
                        border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px',
                        padding: '10px 16px', color: 'var(--indigo)', fontSize: '13px', fontWeight: 700,
                      }}
                    ><FiSave size={13} /> Save</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Declare Result ── */}
        {activeTab === 'declare' && (
          <div className="card anim-fadeIn" style={{ borderColor: 'rgba(251,191,36,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <FaTrophy style={{ color: 'var(--gold)', fontSize: '18px' }} />
              <p style={{ fontWeight: 800, fontSize: '18px' }}>Declare Result</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label className="label">Market</label>
                <select
                  value={result.marketId}
                  onChange={e => setResult(r => ({ ...r, marketId: e.target.value }))}
                >
                  <option value="">— Select Market —</option>
                  {markets.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  value={result.date}
                  onChange={e => setResult(r => ({ ...r, date: e.target.value }))}
                />
              </div>
            </div>

            <label className="label">
              Winning Number
              <span style={{ color: 'var(--muted)', textTransform: 'none', fontWeight: 600, marginLeft: '8px' }}>
                format: 123-6 (panna-digit) or just 6 (single)
              </span>
            </label>
            <input
              type="text"
              value={result.number}
              onChange={e => setResult(r => ({ ...r, number: e.target.value.replace(/[^0-9-]/g, '') }))}
              placeholder="e.g. 123-6"
              style={{ marginBottom: '20px', textAlign: 'center', fontSize: '24px', fontWeight: 900, letterSpacing: '0.15em' }}
            />

            <button
              className="btn-gold"
              style={{ width: '100%', padding: '16px', fontSize: '15px' }}
              onClick={publish}
              disabled={declaring}
            >
              {declaring ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Publishing…
                </span>
              ) : '🏆 Publish Result & Settle Bets'}
            </button>
          </div>
        )}

        {/* ── Live Bet Feed ── */}
        {(activeTab === 'feed' || activeTab === 'overview') && (
          <div className="card anim-fadeIn" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <p style={{ fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="dot dot-pulse" style={{ background: 'var(--red)', width: '8px', height: '8px' }} />
                Live Bet Feed
                <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: '12px' }}>({liveBets.length})</span>
              </p>
              <span className="badge badge-indigo">Auto-refresh 15s</span>
            </div>

            <div style={{ maxHeight: activeTab === 'overview' ? '280px' : '500px', overflowY: 'auto' }}>
              {liveBets.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--muted)', fontSize: '13px' }}>
                  No bets yet. Markets will show activity when opened.
                </p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface2)' }}>
                      {['Mobile', 'Market', 'Number', 'Type', 'Amount', 'Status'].map(h => (
                        <th key={h} style={{
                          padding: '10px 14px', textAlign: 'left',
                          color: 'var(--muted)', fontSize: '10px', fontWeight: 700,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {liveBets.map((b, i) => (
                      <tr key={b.id || i} style={{ borderTop: '1px solid var(--border)', transition: 'background 0.15s' }}>
                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {b.mobile ? b.mobile.replace(/(\d{5})$/, '·····') : '—'}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {b.market_name || '—'}
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 900, fontSize: '15px', letterSpacing: '0.05em' }}>
                          {b.bet_number || '—'}
                        </td>
                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                          <span className="badge badge-indigo">
                            {(b.bet_type || '').replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--green)', whiteSpace: 'nowrap' }}>
                          ₹{parseFloat(b.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className={`badge ${b.status === 'won' ? 'badge-green' : b.status === 'lost' ? 'badge-red' : 'badge-gold'}`}>
                            {b.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Overview extra card */}
        {activeTab === 'overview' && (
          <div className="card anim-fadeIn" style={{ marginTop: '14px' }}>
            <p style={{ fontWeight: 800, fontSize: '15px', marginBottom: '14px' }}>Quick Actions</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                onClick={() => setActiveTab('timings')}
                style={{
                  padding: '14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: '14px', color: 'var(--indigo)', fontWeight: 700, fontSize: '13px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                <FiActivity size={16} /> Manage Timings
              </button>
              <button
                onClick={() => setActiveTab('declare')}
                style={{
                  padding: '14px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
                  borderRadius: '14px', color: 'var(--gold)', fontWeight: 700, fontSize: '13px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                <FaTrophy size={16} /> Declare Result
              </button>
            </div>
          </div>
        )}

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminDashboard;
