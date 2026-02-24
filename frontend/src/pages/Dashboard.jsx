import React, { useState, useEffect, useCallback } from 'react';
import { FiClock, FiLock, FiRefreshCw, FiLogOut, FiTarget, FiTrendingUp, FiAward } from 'react-icons/fi';
import { FaWallet, FaDice } from 'react-icons/fa';
import { getMarkets, placeBet, getUserBets, getResults } from '../services/apiService';
import { sortPanna } from '../utils/pannaLogic';
import toast from 'react-hot-toast';
import { useWallet } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';

/* ══════════════════════════════════════════════════════════════════
   Countdown Hook
   ══════════════════════════════════════════════════════════════════ */
function useCountdown(openTime, closeTime) {
  const compute = useCallback(() => {
    const now = new Date();
    const cur = now.toTimeString().slice(0, 8);
    const isOpen = cur >= openTime && cur <= closeTime;

    if (isOpen) {
      const [ch, cm] = closeTime.split(':');
      const close = new Date();
      close.setHours(+ch, +cm, 0, 0);
      const diff = close - now;
      if (diff > 0) {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return {
          time: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`,
          open: true,
          urgent: diff < 300000, // last 5 min
        };
      }
    }
    return { time: 'Closed', open: false, urgent: false };
  }, [openTime, closeTime]);

  const [state, setState] = useState(compute);

  useEffect(() => {
    const id = setInterval(() => setState(compute()), 1000);
    return () => clearInterval(id);
  }, [compute]);

  return state;
}

/* ══════════════════════════════════════════════════════════════════
   Panna data
   ══════════════════════════════════════════════════════════════════ */
const PANNAS = [];
for (let i = 100; i <= 999; i++) {
  const s = sortPanna(String(i));
  if (!PANNAS.includes(s)) PANNAS.push(s);
}

/* ══════════════════════════════════════════════════════════════════
   BetModal
   ══════════════════════════════════════════════════════════════════ */
const BET_TABS = [
  { key: 'single', label: 'Single', desc: 'Pick 1 digit (0-9)', payout: '×9', color: '#818cf8' },
  { key: 'jodi',   label: 'Jodi',   desc: 'Pick 2 digits',      payout: '×90', color: '#fbbf24' },
  { key: 'panna',  label: 'Panna',  desc: 'Pick 3 digits',      payout: '×140+', color: '#34d399' },
];

function BetModal({ market, onClose }) {
  const [tab, setTab] = useState('single');
  const [num, setNum] = useState('');
  const [amt, setAmt] = useState('');
  const [busy, setBusy] = useState(false);
  const { updateBalance } = useWallet();

  const maxLen = tab === 'panna' ? 3 : tab === 'jodi' ? 2 : 1;
  const currentTab = BET_TABS.find(t => t.key === tab);
  const suggestions = tab === 'panna' && num.length
    ? PANNAS.filter(p => p.startsWith(num)).slice(0, 8)
    : [];

  const quick = [50, 100, 200, 500, 1000];

  useEffect(() => { setNum(''); }, [tab]);

  const submit = async () => {
    if (!num)  return toast.error('Enter a number first');
    if (!amt || parseFloat(amt) <= 0) return toast.error('Enter a valid amount');
    if (tab === 'single' && (isNaN(num) || +num < 0 || +num > 9)) return toast.error('Single: enter 0–9');
    if (tab === 'jodi'   && num.length !== 2) return toast.error('Jodi: enter exactly 2 digits');
    if (tab === 'panna'  && num.length !== 3) return toast.error('Panna: enter exactly 3 digits');

    let betType = tab;
    let betNumber = num;
    if (tab === 'panna') {
      betNumber = sortPanna(num);
      const u = new Set(betNumber.split(''));
      betType = u.size === 1 ? 'triple_panna' : u.size === 2 ? 'double_panna' : 'single_panna';
    }

    setBusy(true);
    try {
      const { data } = await placeBet({
        marketId: market.id,
        betType,
        betNumber,
        amount: parseFloat(amt),
      });
      updateBalance(data.newBalance);
      toast.success('Bet placed 🎯 Good luck!');
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to place bet');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet anim-slideUp">
        <div className="modal-handle" />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <p style={{ fontSize: '20px', fontWeight: 800 }}>{market.name}</p>
            <p style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 700, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="dot dot-pulse" style={{ background: 'var(--green)' }} />
              Market Open · {market.open_time?.slice(0,5)} – {market.close_time?.slice(0,5)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border2)',
              borderRadius: '50%', width: '36px', height: '36px',
              color: 'var(--muted)', fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>

        {/* Bet Type Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {BET_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '12px 8px',
                background: tab === t.key ? `rgba(${t.color === '#818cf8' ? '99,102,241' : t.color === '#fbbf24' ? '251,191,36' : '52,211,153'},0.15)` : 'var(--surface2)',
                border: `1.5px solid ${tab === t.key ? t.color : 'var(--border)'}`,
                borderRadius: '14px',
                color: tab === t.key ? t.color : 'var(--muted)',
                fontSize: '12px', fontWeight: 700,
                transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 800 }}>{t.label}</span>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>{t.payout}</span>
            </button>
          ))}
        </div>

        {/* Info pill */}
        <div style={{
          marginBottom: '16px', padding: '8px 12px',
          background: 'var(--surface2)', borderRadius: '10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>{currentTab?.desc}</span>
          <span style={{ fontSize: '11px', fontWeight: 800, color: currentTab?.color }}>Payout {currentTab?.payout}</span>
        </div>

        {/* Number Input */}
        <label className="label">Your Number</label>
        <input
          type="text"
          value={num}
          maxLength={maxLen}
          onChange={e => setNum(e.target.value.replace(/\D/g, '').slice(0, maxLen))}
          placeholder={tab === 'panna' ? '1 2 3' : tab === 'jodi' ? '4 5' : '7'}
          style={{
            fontSize: '32px', fontWeight: 900, textAlign: 'center',
            letterSpacing: '0.4em', marginBottom: '8px',
            background: 'var(--surface2)', height: '70px',
          }}
        />

        {/* Panna suggestions */}
        {suggestions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {suggestions.map(s => (
              <button key={s} onClick={() => setNum(s)}
                style={{
                  fontSize: '12px', padding: '5px 12px',
                  background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
                  borderRadius: '8px', color: 'var(--green)', fontWeight: 700,
                }}
              >{s}</button>
            ))}
          </div>
        )}

        {/* Amount */}
        <label className="label" style={{ marginTop: '12px' }}>Bet Amount (₹)</label>
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <span style={{
            position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
            fontSize: '18px', fontWeight: 700, color: 'var(--muted)', pointerEvents: 'none',
          }}>₹</span>
          <input
            type="number"
            value={amt}
            onChange={e => setAmt(e.target.value)}
            placeholder="0"
            style={{ fontSize: '24px', fontWeight: 800, textAlign: 'center', paddingLeft: '32px' }}
          />
        </div>

        {/* Quick amounts */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '2px' }}>
          {quick.map(q => (
            <button
              key={q}
              onClick={() => setAmt(String(q))}
              style={{
                whiteSpace: 'nowrap', fontSize: '12px', padding: '7px 14px',
                background: amt === String(q) ? 'rgba(99,102,241,0.18)' : 'var(--surface2)',
                border: `1px solid ${amt === String(q) ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                borderRadius: '10px',
                color: amt === String(q) ? 'var(--indigo)' : 'var(--muted)',
                fontWeight: 700, flexShrink: 0,
              }}
            >₹{q}</button>
          ))}
        </div>

        {/* Expected win */}
        {amt && parseFloat(amt) > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '10px 14px', background: 'rgba(52,211,153,0.07)', borderRadius: '10px',
            marginBottom: '16px', border: '1px solid rgba(52,211,153,0.15)',
          }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Potential Win</span>
            <span style={{ fontSize: '14px', color: 'var(--green)', fontWeight: 800 }}>
              ₹{(parseFloat(amt) * (tab === 'single' ? 9 : tab === 'jodi' ? 90 : 140)).toLocaleString('en-IN')}+
            </span>
          </div>
        )}

        <button className="btn-primary" onClick={submit} disabled={busy}>
          {busy ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Placing Bet…
            </span>
          ) : (
            `Place Bet — ₹${parseFloat(amt || 0).toLocaleString('en-IN')}`
          )}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Market Card
   ══════════════════════════════════════════════════════════════════ */
function MarketCard({ market, onSelect }) {
  const { time, open, urgent } = useCountdown(market.open_time, market.close_time);

  return (
    <div className={`market-card ${open ? 'open' : 'closed'} anim-fadeUp`}>
      {/* Subtle top accent line */}
      {open && <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.6), transparent)',
        borderRadius: '20px 20px 0 0',
      }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: '17px', marginBottom: '4px' }}>{market.name}</p>
          <p style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.03em' }}>
            {market.open_time?.slice(0, 5)} → {market.close_time?.slice(0, 5)}
          </p>
        </div>
        <span className={`badge ${open ? 'badge-green' : 'badge-red'}`}>
          <span className={`dot ${open ? 'dot-pulse' : ''}`} />
          {open ? 'Open' : 'Closed'}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <FiClock size={15} style={{ color: open ? (urgent ? 'var(--red)' : 'var(--green)') : 'var(--muted2)' }} />
        <span className={`countdown ${!open ? 'dimmed' : urgent ? 'urgent' : ''}`}>
          {time}
        </span>
        {urgent && open && (
          <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--red)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Closing soon!
          </span>
        )}
      </div>

      <button
        className={open ? 'btn-primary' : 'btn-ghost'}
        disabled={!open}
        onClick={() => open && onSelect(market)}
        style={{ width: '100%', padding: '14px', fontSize: '14px', letterSpacing: '0.02em' }}
      >
        {open
          ? <>🎯 Place Bet</>
          : <><FiLock size={13} style={{ marginRight: '6px', verticalAlign: 'middle' }} />Market Closed</>
        }
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Bottom Nav
   ══════════════════════════════════════════════════════════════════ */
function BottomNav({ active, onTab }) {
  const tabs = [
    { key: 'markets', icon: <FiTarget size={22} />, label: 'Markets' },
    { key: 'bets',    icon: <FaDice size={22} />,   label: 'My Bets' },
    { key: 'results', icon: <FiAward size={22} />,  label: 'Results' },
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map(t => (
        <button key={t.key} className={`nav-item ${active === t.key ? 'active' : ''}`} onClick={() => onTab(t.key)}>
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ══════════════════════════════════════════════════════════════════
   My Bets Tab
   ══════════════════════════════════════════════════════════════════ */
const STATUS_MAP = {
  pending: { cls: 'badge-indigo', label: 'Pending' },
  won:     { cls: 'badge-green',  label: 'Won ✓' },
  lost:    { cls: 'badge-red',    label: 'Lost' },
};

function MyBetsTab() {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserBets()
      .then(r => setBets(r.data))
      .catch(() => toast.error('Failed to load bets'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="stagger">
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '80px', marginBottom: '10px' }} />)}
    </div>
  );

  if (!bets.length) return (
    <div className="card" style={{ textAlign: 'center', padding: '56px 20px' }}>
      <p style={{ fontSize: '40px', marginBottom: '12px' }}>🎲</p>
      <p style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>No bets yet</p>
      <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Place your first bet to get started!</p>
    </div>
  );

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {bets.map((b, i) => {
        const status = STATUS_MAP[b.status] || STATUS_MAP.pending;
        return (
          <div key={b.id} style={{
            padding: '14px 18px',
            borderTop: i > 0 ? '1px solid var(--border)' : 'none',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: b.status === 'won' ? 'rgba(52,211,153,0.03)' : 'transparent',
          }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '14px' }}>{b.market_name}</p>
              <p style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '2px', fontWeight: 600 }}>
                {b.bet_type?.replace('_', ' ')} · #{b.bet_number}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 800, fontSize: '14px', color: b.status === 'won' ? 'var(--green)' : 'var(--text)' }}>
                ₹{parseFloat(b.amount).toLocaleString('en-IN')}
              </p>
              <span className={`badge ${status.cls}`} style={{ marginTop: '4px', fontSize: '9px' }}>
                {status.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Results Tab
   ══════════════════════════════════════════════════════════════════ */
function ResultsTab() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResults()
      .then(r => setResults(r.data))
      .catch(() => {
        // Fallback to placeholder data
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="stagger">
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '64px', marginBottom: '10px' }} />)}
    </div>
  );

  if (!results.length) return (
    <div className="card" style={{ textAlign: 'center', padding: '56px 20px' }}>
      <p style={{ fontSize: '40px', marginBottom: '12px' }}>🏆</p>
      <p style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>No results yet</p>
      <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Results will appear after markets close</p>
    </div>
  );

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {results.map((r, i) => (
        <div key={r.id} className="result-row" style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: '14px' }}>{r.market_name}</p>
            <p style={{ color: 'var(--muted)', fontSize: '11px', marginTop: '2px' }}>
              {new Date(r.market_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <span className="badge badge-gold" style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.15em', padding: '6px 14px' }}>
            {r.winning_number}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main Dashboard
   ══════════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { displayBalance } = useWallet();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [tabKey, setTabKey] = useState('markets');
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  })();

  const fetchMarkets = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const { data } = await getMarkets();
      setMarkets(data);
    } catch {
      toast.error('Failed to load markets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkets();
    const id = setInterval(() => fetchMarkets(), 30000);
    return () => clearInterval(id);
  }, [fetchMarkets]);

  const logout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const openCount = markets.filter(m => m.status === 'open').length;

  return (
    <div className="shell">
      <div className="shell-content">

        {/* ── Topbar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <p style={{ fontSize: '24px', fontWeight: 900, letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #f0f0fa 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Malvia
            </p>
            <p style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500, marginTop: '1px' }}>
              Hey, {user.name || user.mobile?.slice(-4).padStart(user.mobile?.length || 4, '*') || 'Player'} 👋
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="wallet-chip">
              <FaWallet size={13} style={{ color: 'var(--gold)' }} />
              <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--gold)', letterSpacing: '-0.01em' }}>
                ₹{Math.floor(displayBalance).toLocaleString('en-IN')}
              </span>
            </div>
            <button
              onClick={logout}
              style={{
                background: 'var(--surface2)', border: '1px solid var(--border2)',
                borderRadius: '12px', padding: '9px', color: 'var(--muted)',
                display: 'flex', alignItems: 'center',
              }}
              title="Logout"
            ><FiLogOut size={16} /></button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }} className="stagger">
          <div className="card card-indigo card-sm anim-fadeUp" style={{ borderRadius: '16px' }}>
            <p className="label" style={{ color: 'var(--indigo)', marginBottom: '6px' }}>Open Markets</p>
            <p style={{ fontSize: '30px', fontWeight: 900, lineHeight: 1 }}>{openCount}</p>
            <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>of {markets.length} total</p>
          </div>
          <div className="card card-gold card-sm anim-fadeUp" style={{ borderRadius: '16px' }}>
            <p className="label" style={{ color: 'var(--gold)', marginBottom: '6px' }}>Wallet</p>
            <p style={{ fontSize: '22px', fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>
              ₹{Math.floor(displayBalance).toLocaleString('en-IN')}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>Available</p>
          </div>
        </div>

        {/* ── Content by Tab ── */}
        {tabKey === 'markets' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <p style={{ fontWeight: 800, fontSize: '17px' }}>Live Markets</p>
              <button
                onClick={() => fetchMarkets(true)}
                style={{
                  background: 'none', color: 'var(--indigo)', fontSize: '12px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '5px', padding: '6px',
                }}
              >
                <FiRefreshCw size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="stagger">
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '148px', marginBottom: '14px', borderRadius: '20px' }} />)}
              </div>
            ) : markets.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '56px 20px' }}>
                <p style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</p>
                <p style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>No markets today</p>
                <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Check back later</p>
              </div>
            ) : (
              <div className="stagger">
                {markets.map(m => <MarketCard key={m.id} market={m} onSelect={setSelected} />)}
              </div>
            )}
          </>
        )}

        {tabKey === 'bets' && (
          <>
            <p style={{ fontWeight: 800, fontSize: '17px', marginBottom: '14px' }}>My Bets</p>
            <MyBetsTab />
          </>
        )}

        {tabKey === 'results' && (
          <>
            <p style={{ fontWeight: 800, fontSize: '17px', marginBottom: '14px' }}>Recent Results</p>
            <ResultsTab />
          </>
        )}

      </div>

      {/* Bottom Nav */}
      <BottomNav active={tabKey} onTab={setTabKey} />

      {/* Bet Modal */}
      {selected && <BetModal market={selected} onClose={() => setSelected(null)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Dashboard;
