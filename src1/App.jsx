import React, { useEffect, useState } from 'react';
import './app.css';

/* ====== ikona MEGAFON (SVG) ====== */
const IconSpeaker = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 9v6h4l5 4V5L7 9H3zM16.5 12a3.5 3.5 0 0 0-2.13-3.22v6.44A3.5 3.5 0 0 0 16.5 12z"/>
    <path d="M14.37 5.29a7 7 0 0 1 0 13.42v-2.02a5 5 0 0 0 0-9.38V5.29z"/>
  </svg>
);

/* ====== jednoduché texty (i18n přidáme později) ====== */
const T = {
  cs: {
    app:'DartScore Pro',
    sound:'Zvuk', voice:'Hlas', back:'Zpět',
    mode:'Režim', classic:'Klasická hra', cricket:'Cricket', around:'Around the Clock',
    start:'Start', closing:'Ukončení',
    singleOut:'Single-out', doubleOut:'Double-out', tripleOut:'Triple-out', masterOut:'Master-out',
    order:'Pořadí', fixed:'Fixní', random:'Náhodné',
    robot:'Robot', off:'Vypn.', easy:'Snadná', medium:'Střední', hard:'Těžká',
    startGame:'▶ Start hry', rules:'Pravidla', addPlayer:'Přidat hráče',
    player:'Hráč', game:'Hra'
  },
  en: {
    app:'DartScore Pro',
    sound:'Sound', voice:'Voice', back:'Back',
    mode:'Mode', classic:'Classic', cricket:'Cricket', around:'Around the Clock',
    start:'Start', closing:'Finish',
    singleOut:'Single-out', doubleOut:'Double-out', tripleOut:'Triple-out', masterOut:'Master-out',
    order:'Order', fixed:'Fixed', random:'Random',
    robot:'Bot', off:'Off', easy:'Easy', medium:'Medium', hard:'Hard',
    startGame:'▶ Start Game', rules:'Rules', addPlayer:'Add player',
    player:'Player', game:'Game'
  }
};
const t = (lang, key) => (T[lang] && T[lang][key]) || T.cs[key] || key;

/* ====== util ====== */
const uid = () => Math.random().toString(36).slice(2,9);
const colors = ['#16a34a','#3b82f6','#ef4444','#14b8a6','#8b5cf6','#e11d48','#f59e0b','#22c55e'];
const defaultNameFor=(lang,n)=>({cs:`Hráč ${n}`,en:`Player ${n}`}[lang]||`Player ${n}`);
const autoNameRx = [/^Hráč (\d+)$/, /^Player (\d+)$/];

export default function App(){
  /* viewport fix (100vh) */
  useEffect(()=>{ 
    const setVh=()=>document.documentElement.style.setProperty('--vh',`${window.innerHeight*0.01}px`); 
    setVh(); window.addEventListener('resize',setVh); 
    return()=>window.removeEventListener('resize',setVh);
  },[]);

  /* stav */
  const [screen,setScreen] = useState('lobby'); // lobby | game
  const [lang,setLang]     = useState(((navigator.language||'cs').slice(0,2))||'cs');
  const [soundOn,setSoundOn] = useState(true);
  const [voiceOn,setVoiceOn] = useState(true);

  const [mode,setMode] = useState('classic');      // classic | cricket | around
  const [startScore,setStartScore] = useState(501);
  const [outMode,setOutMode] = useState('double'); // single | double | triple | master

  const [randomOrder,setRandomOrder] = useState(false);
  const [ai,setAi] = useState('off');              // off | easy | medium | hard

  const [players,setPlayers] = useState([
    {id:uid(), name:defaultNameFor(lang,1), color:colors[0], bot:false},
    {id:uid(), name:defaultNameFor(lang,2), color:colors[1], bot:false}
  ]);

  /* load/save lobby */
  useEffect(()=>{ try{
    const s=JSON.parse(localStorage.getItem('lobby')||'{}');
    if(s.lang) setLang(s.lang);
    if(s.mode) setMode(s.mode);
    if(s.startScore) setStartScore(s.startScore);
    if(s.outMode) setOutMode(s.outMode);
    if(typeof s.randomOrder==='boolean') setRandomOrder(s.randomOrder);
    if(s.ai) setAi(s.ai);
    if(s.players) setPlayers(s.players);
  }catch{} },[]);
  useEffect(()=>{ try{
    localStorage.setItem('lobby', JSON.stringify({lang,mode,startScore,outMode,randomOrder,ai,players}));
  }catch{} },[lang,mode,startScore,outMode,randomOrder,ai,players]);

  /* přelož auto-jména při změně jazyka */
  useEffect(()=>{
    setPlayers(ps=>ps.map(p=>{
      for(const rx of autoNameRx){
        const m=p.name.match(rx);
        if(m){ const n=parseInt(m[1],10); return {...p, name:defaultNameFor(lang,n)}; }
      }
      return p;
    }));
  },[lang]);

  /* ROBOT – přidat/odebrat/aktualizovat podle selectu */
  useEffect(()=>{
    setPlayers(ps=>{
      const hasBot = ps.some(p=>p.bot);
      if(ai==='off'){
        return hasBot ? ps.filter(p=>!p.bot) : ps;
      }
      if(!hasBot){
        return [...ps, {id:uid(), name:`🤖 ${t(lang,'robot')} (${t(lang,ai)})`, color:colors[ps.length%colors.length], bot:true, level:ai}];
      }
      return ps.map(p=>p.bot ? {...p, name:`🤖 ${t(lang,'robot')} (${t(lang,ai)})`, level:ai} : p);
    });
  },[ai,lang]);

  const movePlayer = (i,dir) => setPlayers(ps=>{
    const a=[...ps], j=i+dir; if(j<0||j>=a.length) return a;
    [a[i],a[j]]=[a[j],a[i]]; return a;
  });

  const deletePlayer = (i) => {
    setPlayers(ps=>{
      const toDelete = ps[i];
      // Pokud mažu bota, zároveň vypni AI, aby se hned znovu nepřidal.
      if(toDelete?.bot){ setAi('off'); }
      return ps.filter((_,ix)=>ix!==i);
    });
  };

  const addPlayer = () =>
    setPlayers(ps=>[...ps,{id:uid(), name:defaultNameFor(lang, ps.length+1), color:colors[ps.length%colors.length], bot:false}]);

  const startGame = () => setScreen('game');

  /* menší „chip“ prvky = nižší výška */
  const chipStyle = { padding:'4px 8px', lineHeight:1.1 };

  /* Pomocné handlery pro auto-select jména */
  const handleNameFocus = (e) => {
    // vyber celé jméno – psaní okamžitě přepíše
    e.target.select();
  };
  const handleNameMouseUp = (e) => {
    // zabrání zrušení selectu po kliknutí (hlavně mobil/Chrome)
    e.preventDefault();
  };

  return (
    <div className="container">
      {/* ====== HEADER ====== */}
      <div className="header">
        <div className="left">
          {screen==='game' && (
            <button className="btn ghost" onClick={()=>setScreen('lobby')} title={t(lang,'back')}>←</button>
          )}
          <div className="logo"><span className="dart"></span><span>{t(lang,'app')}</span></div>
        </div>
        <div className="controls">
          <button className={`iconBtn ${!soundOn?'muted':''}`} onClick={()=>setSoundOn(v=>!v)} aria-label={t(lang,'sound')}>
            <IconSpeaker/>
          </button>
          <button className={`iconBtn ${!voiceOn?'muted':''}`} onClick={()=>setVoiceOn(v=>!v)} aria-label={t(lang,'voice')}>
            <span className="iconHead" aria-hidden="true"></span>
          </button>
          <select className="input" value={lang} onChange={e=>setLang(e.target.value)}>
            <option value="cs">Čeština</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>

      {/* ====== ADS PLACEHOLDER ====== */}
      <div className="adstrip">
        <div className="adcard">AdMob</div><div className="adcard">Ad</div><div className="adcard">Ad</div>
      </div>

      {/* ====== OBSAH ====== */}
      {screen==='lobby' ? (
        <div className="lobbyWrap">
          {/* Režim */}
          <div className="lobbyCard">
            <div className="lobbyControls">
              <span>{t(lang,'mode')}</span>
              <select className="input" value={mode} onChange={e=>setMode(e.target.value)} style={{height:34}}>
                <option value="classic">{t(lang,'classic')}</option>
                <option value="cricket">{t(lang,'cricket')}</option>
                <option value="around">{t(lang,'around')}</option>
              </select>
            </div>
          </div>

          {/* Start (Classic) */}
          {mode==='classic' && (
            <div className="lobbyCard">
              <div className="lobbyControls">
                <span>{t(lang,'start')}</span>
                {[101,301,501,701,901].map(s=>(
                  <button key={s} className={`tab ${startScore===s?'active':''}`} style={chipStyle} onClick={()=>setStartScore(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Ukončení */}
          {mode==='classic' && (
            <div className="lobbyCard">
              <div className="lobbyControls">
                <span>{t(lang,'closing')}</span>
                <button className={`tab ${outMode==='single'?'active':''}`} style={chipStyle} onClick={()=>setOutMode('single')}>{t(lang,'singleOut')}</button>
                <button className={`tab ${outMode==='double'?'active':''}`} style={chipStyle} onClick={()=>setOutMode('double')}>{t(lang,'doubleOut')}</button>
                <button className={`tab ${outMode==='triple'?'active':''}`} style={chipStyle} onClick={()=>setOutMode('triple')}>{t(lang,'tripleOut')}</button>
                <button className={`tab ${outMode==='master'?'active':''}`} style={chipStyle} onClick={()=>setOutMode('master')}>{t(lang,'masterOut')}</button>
              </div>
            </div>
          )}

          {/* Pořadí */}
          <div className="lobbyCard">
            <div className="lobbyControls">
              <span>{t(lang,'order')}</span>
              <select className="input" value={randomOrder?'random':'fixed'} onChange={e=>setRandomOrder(e.target.value==='random')} style={{height:34}}>
                <option value="fixed">{t(lang,'fixed')}</option>
                <option value="random">{t(lang,'random')}</option>
              </select>
            </div>
          </div>

          {/* Robot */}
          <div className="lobbyCard">
            <div className="lobbyControls">
              <span>{t(lang,'robot')}</span>
              <select className="input" value={ai} onChange={e=>setAi(e.target.value)} style={{height:34}}>
                <option value="off">{t(lang,'off')}</option>
                <option value="easy">{t(lang,'easy')}</option>
                <option value="medium">{t(lang,'medium')}</option>
                <option value="hard">{t(lang,'hard')}</option>
              </select>
            </div>
          </div>

          {/* Hráči */}
          <div className="lobbyCard">
            {players.map((p,i)=>(
              <div key={p.id} className="playerRow">
                <div className="playerName">
                  <input
                    className="input"
                    value={p.name}
                    onChange={e=>setPlayers(ps=>ps.map((x,ix)=>ix===i?{...x,name:e.target.value}:x))}
                    onFocus={handleNameFocus}
                    onMouseUp={handleNameMouseUp}
                  />
                </div>
                <div className="playerActions">
                  <button className="btn ghost" onClick={()=>movePlayer(i,-1)} title="Up" style={{padding:'4px 8px',lineHeight:1.1}}>↑</button>
                  <button className="btn ghost" onClick={()=>movePlayer(i,1)}  title="Down" style={{padding:'4px 8px',lineHeight:1.1}}>↓</button>
                </div>
                <div><span className="score">{mode==='classic'? startScore : '-'}</span></div>
                <div className="playerDelete">
                  {/* Koš je vidět i u robota; smazání bota zároveň vypne AI */}
                  <button className="trash" onClick={()=>deletePlayer(i)} title="Delete">🗑️</button>
                </div>
              </div>
            ))}
            <button className="btn" onClick={addPlayer}>+ {t(lang,'addPlayer')}</button>
          </div>

          {/* Start hry */}
          <div style={{display:'flex',justifyContent:'flex-end'}}>
            <button className="btn green" onClick={startGame}>{t(lang,'startGame')}</button>
          </div>
        </div>
      ) : (
        /* jednoduchý placeholder herní obrazovky – ověření přepnutí */
        <div className="lobbyWrap">
          <div className="lobbyCard">
            <h3 style={{margin:'6px 0'}}>{t(lang,'game')}</h3>
            {players.map(p=>(
              <div key={p.id} className="playerRow">
                <div className="playerName"><strong>{p.name}</strong></div>
                <div className="playerActions"></div>
                <div><span className="score">{mode==='classic'? startScore : '-'}</span></div>
                <div className="playerDelete"></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
