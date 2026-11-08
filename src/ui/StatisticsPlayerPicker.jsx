import React, { useId, useRef, useState } from 'react';
import { searchName } from '../statisticsHistory.js';

export default function StatisticsPlayerPicker({ players, value, onChange, label, copy, exclude, displayName = name => name }) {
  const [query, setQuery] = useState('');
  const popup = useRef(null);
  const searchId = useId();
  const available = players.filter(p => p.name !== exclude);
  const matches = query.trim() ? available.filter(p => searchName(p.name).includes(searchName(query))) : available;
  return <details className="stats-player-picker" ref={popup} onToggle={e => { if (!e.currentTarget.open) setQuery(''); }}>
    <summary><span className="stats-field-label">{label}</span><strong>{value ? displayName(value) : copy.selection}</strong></summary>
    <div className="stats-picker-panel">
      <label htmlFor={searchId}>{copy.search}</label>
      <input id={searchId} type="search" className="input" value={query} onChange={e => setQuery(e.target.value)} autoComplete="off" />
      {!query && <span className="stats-muted">{copy.recent}</span>}
      <div className="stats-picker-results">
        {matches.slice(0,8).map(p => <button type="button" key={p.name} aria-pressed={value === p.name} onClick={() => { onChange(p.name); popup.current.open = false; }}>
          <strong>{displayName(p.name)}</strong><span>{p.matches} · {copy.matches.toLocaleLowerCase()}</span>
        </button>)}
        {!matches.length && <p role="status">{copy.none}</p>}
      </div>
      {matches.length > 8 && <p className="stats-muted">{copy.hint}</p>}
    </div>
  </details>;
}
