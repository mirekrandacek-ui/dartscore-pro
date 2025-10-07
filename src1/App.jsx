import React, { useEffect, useMemo, useRef, useState } from 'react';
import './app.css';

/* ====== ikona MEGAFON (SVG) ====== */
const IconSpeaker = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 9v6h4l5 4V5L7 9H3zM16.5 12a3.5 3.5 0 0 0-2.13-3.22v6.44A3.5 3.5 0 0 0 16.5 12z"/>
    <path d="M14.37 5.29a7 7 0 0 1 0 13.42v-2.02a5 5 0 0 0 0-9.38V5.29z"/>
  </svg>
);

/* ====== jednoduché texty (i18n doděláme později) ====== */
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
    player:'Hráč', game:'Hra',
    darts:'šipek', avg:'průměr/šipka', last:'Poslední hod', undo:'Zpět', next:'Další hráč',
    bust:'bez skóre', checkout:'checkout', youWin:'Vyhrál/a',
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
    player:'Player', game:'Game',
    darts:'darts', avg:'avg/dart', last:'Last throw', undo:'Undo', next:'Next player',
    bust:'bust', checkout:'checkout', youWin:'You win',
  }
};
const t = (lang, key) => (T[lang] && T[lang][key]) || T.cs[key] || key;

/* ====== util ====== */
const uid = () => Math.random().toString(36).slice(2,9);
const colors = ['#16a34a','#3b82f6','#ef4444','#14b8a6','#8b5cf6','#e11d48','#f59e0b','#22c55e'];
const defaultNameFor=(lang,n)=>({cs:`Hráč ${n}`,en:`Player ${n}`}[lang]||`Player ${n}`);
const autoNameRx = [/^Hráč (\d+)$/, /^Player (\d+)$/];

/* ====== speech & hit sound ====== */
function speak(lang, text, enabled){
  if(!enabled || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text.toString());
  const map = { cs:'cs-CZ', en:'en-US' };
  u.lang = map[lang] || 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export default function App(){
  /* viewport fix (100vh) */
  useEffect(()=>{ 
    const setVh=()=>document.documentElement.style.setProperty('--vh',`${window.innerHeight*0.01}px`); 
    setVh(); window.addEventListener('resize',setVh); 
    return()=>window.removeEventListener('resize',setVh);
  },[]);

  /* stav UI */
  const [screen,setScreen] = useState('lobby'); // lobby | game
  const [lang,setLang]     = useState(((navigator.language||'cs').slice(0,2))||'cs');
  const [soundOn,setSoundOn] = useState(true);
  const [voiceOn,setVoiceOn] = useState(true);

  const [mode,setMode] = useState('classic');      // classic | cricket | around (zatím hrajeme classic)
  const [startScore,setStartScore] = useState(501);
  const [outMode,setOutMode] = useState('double'); // single | double | triple | master

  const [randomOrder,setRandomOrder] = useState(false);
  const [ai,setAi] = useState('off');              // off | easy | medium | hard

  const [players,setPlayers] = useState([
    {id:uid(), name:defaultNameFor(lang,1), color:colors[0], bot:false},
    {id:uid(), name:defaultNameFor(lang,2), color:colors[1], bot:false}
  ]);

  const hitAudioRef = useRef(null);

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

  /* ROBOT logika v lobby (přidat/odebrat/aktualizovat label) */
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

  /* ==== LOBBY helpers ==== */
  const movePlayer = (i,dir) => setPlayers(ps=>{
    const a=[...ps], j=i+dir; if(j<0||j>=a.length) return a;
    [a[i],a[j]]=[a[j],a[i]]; return a;
  });
  const deletePlayer = (i) => {
    setPlayers(ps=>{
      const toDelete = ps[i];
      if(toDelete?.bot){ setAi('off'); }
      return ps.filter((_,ix)=>ix!==i);
    });
  };
  const addPlayer = () =>
    setPlayers(ps=>[...ps,{id:uid(), name:defaultNameFor(lang, ps.length+1), color:colors[ps.length%colors.length], bot:false}]);

  /* ====== GAME STATE ====== */
  const [order,setOrder] = useState([]);             // pořadí hráčů (pole indexů hráčů)
  const [turnStart,setTurnStart] = useState(0);      // score na začátku tahu
  const [scores,setScores] = useState([]);           // aktuální skóre hráčů
  const [darts,setDarts] = useState([]);             // hozené šipky v aktuálním tahu (např. [{v:20,m:3,score:60}, ...])
  const [currIdx,setCurrIdx] = useState(0);          // index v order (kdo je na řadě)
  const [mult,setMult] = useState(1);                // 1/2/3
  const [actions,setActions] = useState([]);         // pro undo (stack)
  const [thrown,setThrown] = useState([]);           // počet šipek na hráče
  const [lastTurn,setLastTurn] = useState([]);       // součet posledního tahu hráče
  const [winner,setWinner] = useState(null);

  const currentPlayerIndex = order[currIdx] ?? 0;
  const currentScore = scores[currentPlayerIndex] ?? startScore;

  const startGame = () => {
    const baseOrder = players.map((_,i)=>i);
    const ord = randomOrder ? shuffle(baseOrder) : baseOrder;
    const sc  = players.map(()=>startScore);
    const dartsCnt = players.map(()=>0);
    const last = players.map(()=>0);
    setOrder(ord);
    setScores(sc);
    setDarts([]);
    setCurrIdx(0);
    setTurnStart(startScore);
    setActions([]);
    setThrown(dartsCnt);
    setLastTurn(last);
    setWinner(null);
    setScreen('game');
  };

  function shuffle(a){
    const arr=[...a];
    for(let i=arr.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }

  /* ===== scoring helpers ===== */
  const isFinishAllowed = (multiplier) => {
    if(outMode==='single') return multiplier===1;
    if(outMode==='double') return multiplier===2;
    if(outMode==='triple') return multiplier===3;
    // master: double nebo triple
    return multiplier===2 || multiplier===3;
  };

  const isBustLeavingOne = (newScore) => {
    // v režimech, kde je nutné double/triple/master-out, 1 je neuzavíratelné → bust
    if(outMode==='single') return false;
    return newScore===1;
  };

  const playHitSound = () => {
    if(soundOn && hitAudioRef.current){
      try { hitAudioRef.current.currentTime = 0; hitAudioRef.current.play(); } catch {}
    }
  };

  const pushAction = (payload) => setActions(st=>[...st, payload]);

  const commitDart = (value) => {
    // výpočet skóre zásahu
    let v=value, m=mult;
    if(value===25 || value===50){ // bull/bulls-eye
      // zachovej přesně hodnotu, mult ignoruj
      m = 1;
      v = value;
    }
    const hit = v*m;
    const pIdx = currentPlayerIndex;
    const prev = scores[pIdx];
    let tentative = prev - hit;

    // bust pravidla
    if(tentative < 0 || isBustLeavingOne(tentative)){
      // celý tah bez skóre; hlas "bez skóre"
      speak(lang, t(lang,'bust'), voiceOn);
      playHitSound();
      // zapsat akci pro undo (typ: bust turn)
      pushAction({type:'bust', pIdx, prevScore:prev, dartsBefore:[...darts]});
      // reset skóre hráče, přechod na dalšího
      setDarts([]);
      setLastTurn(ls=>ls.map((x,i)=> i===pIdx ? 0 : x));
      nextPlayer();
      return;
    }

    if(tentative === 0){
      // musí sedět poslední multiplikátor dle out režimu
      if(isFinishAllowed(m)){
        // výhra
        playHitSound();
        speak(lang, t(lang,'youWin'), voiceOn);
        pushAction({type:'dart', pIdx, prevScore:prev, newScore:tentative, hit:{v,m,score:hit}});
        setScores(sc=>sc.map((x,i)=> i===pIdx ? tentative : x));
        setDarts(ds=>[...ds,{v,m,score:hit}]);
        setThrown(th=>th.map((x,i)=> i===pIdx ? x+1 : x));
        setLastTurn(ls=>ls.map((x,i)=> i===pIdx ? (sumScores([...darts,{v,m,score:hit}])) : x));
        setWinner(pIdx);
        return;
      } else {
        // špatný out → bust
        speak(lang, t(lang,'bust'), voiceOn);
        pushAction({type:'bust', pIdx, prevScore:prev, dartsBefore:[...darts]});
        setDarts([]);
        setLastTurn(ls=>ls.map((x,i)=> i===pIdx ? 0 : x));
        nextPlayer();
        return;
      }
    }

    // normální platný zásah
    playHitSound();
    pushAction({type:'dart', pIdx, prevScore:prev, newScore:tentative, hit:{v,m,score:hit}});
    setScores(sc=>sc.map((x,i)=> i===pIdx ? tentative : x));
    setDarts(ds=>[...ds,{v,m,score:hit}]);
    setThrown(th=>th.map((x,i)=> i===pIdx ? x+1 : x));
    setLastTurn(ls=>ls.map((x,i)=> i===pIdx ? (sumScores([...darts,{v,m,score:hit}])) : x));

    // auto next po 3. šipce
    setTimeout(()=>{
      setDarts(current=>{
        if(current.length>=3){
          const total = sumScores(current);
          if(total>0) speak(lang, total, voiceOn);
          nextPlayer();
          return [];
        }
        return current;
      });
    }, 30);
  };

  const sumScores = (arr) => arr.reduce((s,a)=>s+(a?.score||0),0);

  const nextPlayer = () => {
    setCurrIdx(i => (i+1) % order.length);
    setDarts([]);
  };

  useEffect(()=>{
    // nastav start skóre tahu pro nového hráče
    const pIdx = order[currIdx];
    if (pIdx!=null) {
      setTurnStart(scores[pIdx] ?? startScore);
    }
  },[currIdx, order, scores, startScore]);

  const undo = () => {
    setActions(st=>{
      if(st.length===0) return st;
      const last = st[st.length-1];
      if(last.type==='dart'){
        // vrátit skóre a poslední šipku
        const {pIdx, prevScore, hit} = last;
        setScores(sc=>sc.map((x,i)=> i===pIdx ? prevScore : x));
        setDarts(ds=>{
          const d=[...ds];
          // když jsme mezitím přešli na dalšího hráče, vraťme mu tah
          if(order[currIdx]!==pIdx){
            // vrátit se na hráče pIdx
            const pos = order.indexOf(pIdx);
            if(pos>=0) setCurrIdx(pos);
          }
          // odstranit poslední lokální zápis (nebo přidat zpět, pokud jsme byli po auto-next)
          if(d.length>0) d.pop();
          else d.push(hit); // edge: undo po auto-next – vrátíme poslední hit do vizuálu
          return d;
        });
        setThrown(th=>th.map((x,i)=> i===pIdx ? Math.max(0,x-1) : x));
        setLastTurn(ls=>ls.map((x,i)=> i===pIdx ? Math.max(0, x - (hit?.score||0)) : x));
      } else if(last.type==='bust'){
        // bust vrátíme na začátek tahu u daného hráče
        const {pIdx, prevScore} = last;
        setScores(sc=>sc.map((x,i)=> i===pIdx ? prevScore : x));
        // a vrátíme se zpět na hráče, který bustnul
        const pos = order.indexOf(pIdx);
        if(pos>=0) setCurrIdx(pos);
        setDarts(last.dartsBefore || []);
        setLastTurn(ls=>ls.map((x,i)=> i===pIdx ? 0 : x));
      }
      return st.slice(0,-1);
    });
  };

  /* průměry */
  const averages = useMemo(()=>{
    return players.map((_,i)=>{
      const thrownDarts = thrown[i] || 0;
      const done = startScore - (scores[i] ?? startScore);
      return thrownDarts>0 ? (done / thrownDarts) : 0;
    });
  },[players, thrown, scores, startScore]);

  /* Pomocné handlery pro auto-select jména */
  const handleNameFocus = (e) => e.target.select();
  const handleNameMouseUp = (e) => e.preventDefault();

  /* ==== RENDER ==== */
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

      {/* ====== ADS ====== */}
      <div className="adstrip">
        <div className="adcard">AdMob</div><div className="adcard">Ad</div><div className="adcard">Ad</div>
      </div>

      {screen==='lobby' ? (
        <Lobby
          lang={lang}
          t={t}
          mode={mode} setMode={setMode}
          startScore={startScore} setStartScore={setStartScore}
          outMode={outMode} setOutMode={setOutMode}
          randomOrder={randomOrder} setRandomOrder={setRandomOrder}
          ai={ai} setAi={setAi}
          players={players} setPlayers={setPlayers}
          addPlayer={addPlayer} deletePlayer={deletePlayer}
          movePlayer={movePlayer}
          startGame={startGame}
          handleNameFocus={handleNameFocus}
          handleNameMouseUp={handleNameMouseUp}
        />
      ) : (
        <Game
          lang={lang} t={t}
          players={players} order={order} currIdx={currIdx}
          scores={scores} averages={averages} thrown={thrown} lastTurn={lastTurn}
          darts={darts} mult={mult} setMult={setMult}
          commitDart={commitDart} undo={undo}
          winner={winner}
        />
      )}

      <audio ref={hitAudioRef} src="/dart-hit.mp3" preload="auto" />
    </div>
  );
}

/* ====== LOBBY COMPONENT ====== */
function Lobby({
  lang,t,
  mode,setMode,
  startScore,setStartScore,
  outMode,setOutMode,
  randomOrder,setRandomOrder,
  ai,setAi,
  players,setPlayers,
  addPlayer,deletePlayer,movePlayer,
  startGame,
  handleNameFocus,handleNameMouseUp
}){
  return (
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
              <button key={s} className={`tab`} style={{padding:'4px 8px',lineHeight:1.1, background: startScore===s?'var(--green)':'#171a1f', borderColor: startScore===s?'#14532d':'var(--line)'}} onClick={()=>setStartScore(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Ukončení */}
      {mode==='classic' && (
        <div className="lobbyCard">
          <div className="lobbyControls">
            <span>{t(lang,'closing')}</span>
            <button className={`tab ${outMode==='single'?'active':''}`} style={{padding:'4px 8px',lineHeight:1.1}} onClick={()=>setOutMode('single')}>{t(lang,'singleOut')}</button>
            <button className={`tab ${outMode==='double'?'active':''}`} style={{padding:'4px 8px',lineHeight:1.1}} onClick={()=>setOutMode('double')}>{t(lang,'doubleOut')}</button>
            <button className={`tab ${outMode==='triple'?'active':''}`} style={{padding:'4px 8px',lineHeight:1.1}} onClick={()=>setOutMode('triple')}>{t(lang,'tripleOut')}</button>
            <button className={`tab ${outMode==='master'?'active':''}`} style={{padding:'4px 8px',lineHeight:1.1}} onClick={()=>setOutMode('master')}>{t(lang,'masterOut')}</button>
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
            <div><span className="score">{startScore}</span></div>
            <div className="playerDelete">
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
  );
}

/* ====== GAME COMPONENT ====== */
function Game({
  lang,t, players, order, currIdx,
  scores, averages, thrown, lastTurn,
  darts, mult, setMult, commitDart, undo, winner
}){
  const curPlayer = players[order[currIdx]] || players[0];

  const keypad = [
    [1,2,3,4,5,6,7],
    [8,9,10,11,12,13,14],
    [15,16,17,18,19,20,25],
    [0,50]
  ];

  return (
    <div className="gameWrap">
      {/* horní polovina – hráči */}
      <div className="playersPane">
        {order.map((pIdx,i)=>{
          const p=players[pIdx];
          const active = i===currIdx && winner==null;
          return (
            <div key={p.id} className={`playerCard ${active?'active':''} ${winner===pIdx?'winner':''}`}>
              <div className="playerHeader">
                <div className="playerNameText">{p.name}</div>
                <div className="playerStats">
                  <span>{(thrown[pIdx]||0)} {t(lang,'darts')}</span>
                  <span>•</span>
                  <span>{t(lang,'avg')}: {formatAvg(averages[pIdx])}</span>
                </div>
              </div>
              <div className="playerScore">{scores[pIdx] ?? 0}</div>
              <div className="playerTurn">
                {[0,1,2].map(ix=>{
                  const d = darts[ix];
                  return <div key={ix} className="dartBox">{d? formatHit(d) : '-'}</div>;
                })}
                <div className="lastTotal">{t(lang,'last')}: {lastTurn[pIdx]||0}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* spodní polovina – klávesnice */}
      <div className="padPane">
        <div className="padRow">
          <button className={`multBtn ${mult===2?'active':''}`} onClick={()=>setMult(m=>m===2?1:2)}>DOUBLE</button>
          <button className={`multBtn ${mult===3?'active':''}`} onClick={()=>setMult(m=>m===3?1:3)}>TRIPLE</button>
          <button className="undoBtn" onClick={undo} title={t(lang,'undo')}>⟲</button>
        </div>

        {keypad.slice(0,3).map((row,ri)=>(
          <div key={ri} className="padRow">
            {row.map(n=>(
              <button key={n} className="key" onClick={()=>commitDart(n)}>{n}</button>
            ))}
          </div>
        ))}
        <div className="padRow">
          <button className="key" onClick={()=>commitDart(0)}>0</button>
          <button className="key" onClick={()=>commitDart(50)}>50</button>
        </div>
      </div>
    </div>
  );
}

function formatAvg(v){ return (Math.round(v*100)/100).toFixed(2); }
function formatHit(d){
  if(!d) return '-';
  const prefix = d.m===2?'D':(d.m===3?'T':'');
  return `${prefix}${d.v}=${d.score}`;
}
