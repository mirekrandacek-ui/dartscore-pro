import React, { useEffect, useMemo, useRef, useState } from 'react';
import './app.css';

/* ===== Ikona zvuku ===== */
const IconSpeaker = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 9v6h4l5 4V5L7 9H3zM16.5 12a3.5 3.5 0 0 0-2.13-3.22v6.44A3.5 3.5 0 0 0 16.5 12z"/>
    <path d="M14.37 5.29a7 7 0 0 1 0 13.42v-2.02a5 5 0 0 0 0-9.38V5.29z"/>
  </svg>
);

/* ===== Texty (CS/EN/DE/ES/NL/RU) ===== */
const T = {
  cs:{app:'DartScore Pro',sound:'Zvuk',voice:'Hlas',back:'Zpět',
      mode:'Režim',classic:'Klasická hra',cricket:'Cricket',around:'Around the Clock',
      start:'Start',closing:'Ukončení',
      singleOut:'Single-out',doubleOut:'Double-out',tripleOut:'Triple-out',masterOut:'Master-out',
      order:'Pořadí',fixed:'Fixní',random:'Náhodné',
      robot:'Robot',off:'Vypn.',easy:'Snadná',medium:'Střední',hard:'Těžká',
      startGame:'▶ Start hry',continueGame:'Pokračovat ve hře',saveGame:'Uložit hru',
      rules:'Pravidla',addPlayer:'Přidat hráče',
      player:'Hráč',game:'Hra',darts:'šipek',avg:'průměr/šipka',last:'Poslední hod',
      undo:'Zpět',next:'Další hráč',bust:'bez skóre',checkout:'checkout',
      youWinPrefix:'Výhra', outLabel:'Ukončení'},
  en:{app:'DartScore Pro',sound:'Sound',voice:'Voice',back:'Back',
      mode:'Mode',classic:'Classic',cricket:'Cricket',around:'Around the Clock',
      start:'Start',closing:'Finish',
      singleOut:'Single-out',doubleOut:'Double-out',tripleOut:'Triple-out',masterOut:'Master-out',
      order:'Order',fixed:'Fixed',random:'Random',
      robot:'Bot',off:'Off',easy:'Easy',medium:'Medium',hard:'Hard',
      startGame:'▶ Start Game',continueGame:'Continue game',saveGame:'Save game',
      rules:'Rules',addPlayer:'Add player',
      player:'Player',game:'Game',darts:'darts',avg:'avg/dart',last:'Last throw',
      undo:'Undo',next:'Next player',bust:'bust',checkout:'checkout',
      youWinPrefix:'Win', outLabel:'Finish'},
  de:{app:'DartScore Pro',sound:'Ton',voice:'Stimme',back:'Zurück',
      mode:'Modus',classic:'Klassisch',cricket:'Cricket',around:'Rund um die Uhr',
      start:'Start',closing:'Beenden',
      singleOut:'Single-out',doubleOut:'Double-out',tripleOut:'Triple-out',masterOut:'Master-out',
      order:'Reihenfolge',fixed:'Fix',random:'Zufällig',
      robot:'Roboter',off:'Aus',easy:'Leicht',medium:'Mittel',hard:'Schwer',
      startGame:'▶ Spiel starten',continueGame:'Spiel fortsetzen',saveGame:'Spiel speichern',
      rules:'Regeln',addPlayer:'Spieler hinzufügen',
      player:'Spieler',game:'Spiel',darts:'Darts',avg:'Schnitt/Dart',last:'Letzter Wurf',
      undo:'Zurück',next:'Nächster',bust:'bust',checkout:'Checkout',
      youWinPrefix:'Sieg', outLabel:'Finish'},
  es:{app:'DartScore Pro',sound:'Sonido',voice:'Voz',back:'Atrás',
      mode:'Modo',classic:'Clásico',cricket:'Cricket',around:'Alrededor del reloj',
      start:'Inicio',closing:'Cierre',
      singleOut:'Single-out',doubleOut:'Double-out',tripleOut:'Triple-out',masterOut:'Master-out',
      order:'Orden',fixed:'Fijo',random:'Aleatorio',
      robot:'Robot',off:'Apag.',easy:'Fácil',medium:'Medio',hard:'Difícil',
      startGame:'▶ Empezar',continueGame:'Continuar partida',saveGame:'Guardar partida',
      rules:'Reglas',addPlayer:'Añadir jugador',
      player:'Jugador',game:'Juego',darts:'dardos',avg:'prom/dardo',last:'Último tiro',
      undo:'Deshacer',next:'Siguiente',bust:'sin puntuación',checkout:'checkout',
      youWinPrefix:'Victoria', outLabel:'Finish'},
  nl:{app:'DartScore Pro',sound:'Geluid',voice:'Spraak',back:'Terug',
      mode:'Modus',classic:'Klassiek',cricket:'Cricket',around:'Rond de klok',
      start:'Start',closing:'Einde',
      singleOut:'Single-out',doubleOut:'Double-out',tripleOut:'Triple-out',masterOut:'Master-out',
      order:'Volgorde',fixed:'Vast',random:'Willekeurig',
      robot:'Robot',off:'Uit',easy:'Makkelijk',medium:'Gemiddeld',hard:'Moeilijk',
      startGame:'▶ Start spel',continueGame:'Doorgaan',saveGame:'Spel opslaan',
      rules:'Regels',addPlayer:'Speler toevoegen',
      player:'Speler',game:'Spel',darts:'darts',avg:'gem/dart',last:'Laatste worp',
      undo:'Ongedaan',next:'Volgende',bust:'bust',checkout:'checkout',
      youWinPrefix:'Winst', outLabel:'Finish'},
  ru:{app:'DartScore Pro',sound:'Звук',voice:'Голос',back:'Назад',
      mode:'Режим',classic:'Классика',cricket:'Крикет',around:'По кругу',
      start:'Старт',closing:'Завершение',
      singleOut:'Single-out',doubleOut:'Double-out',tripleOut:'Triple-out',masterOut:'Master-out',
      order:'Порядок',fixed:'Фикс',random:'Случайно',
      robot:'Робот',off:'Выкл.',easy:'Лёгкий',medium:'Средний',hard:'Сложный',
      startGame:'▶ Начать игру',continueGame:'Продолжить',saveGame:'Сохранить игру',
      rules:'Правила',addPlayer:'Добавить игрока',
      player:'Игрок',game:'Игра',darts:'дротиков',avg:'ср./дротик',last:'Последний бросок',
      undo:'Отмена',next:'Далее',bust:'без очков',checkout:'чекаут',
      youWinPrefix:'Победа', outLabel:'Finish'}
};
const LANG_LABEL = {cs:'Čeština',en:'English',de:'Deutsch',es:'Español',nl:'Nederlands',ru:'Русский'};
const t = (lang, key) => (T[lang] && T[lang][key]) || T.cs[key] || key;

/* ===== Util ===== */
const uid = () => Math.random().toString(36).slice(2,9);
const colors = ['#16a34a','#3b82f6','#ef4444','#14b8a6','#8b5cf6','#e11d48','#f59e0b','#22c55e'];
const defaultNameFor=(lang,n)=>({cs:`Hráč ${n}`,en:`Player ${n}`,de:`Spieler ${n}`,es:`Jugador ${n}`,nl:`Speler ${n}`,ru:`Игрок ${n}`}[lang]||`Player ${n}`);
const autoNameRx = [/^Hráč (\d+)$/, /^Player (\d+)$/, /^Spieler (\d+)$/, /^Jugador (\d+)$/, /^Speler (\d+)$/, /^Игрок (\d+)$/];

function speak(lang, text, enabled){
  if(!enabled || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text.toString());
  const map = { cs:'cs-CZ', en:'en-US', de:'de-DE', es:'es-ES', nl:'nl-NL', ru:'ru-RU' };
  u.lang = map[lang] || 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export default function App(){
  /* viewport fix */
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

  const [mode,setMode] = useState('classic');      // zatím scoring řešíme pro classic
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

  /* BOT v lobby */
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

  /* lobby helpers */
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
  const addPlayer = () => setPlayers(ps=>[...ps,{id:uid(), name:defaultNameFor(lang, ps.length+1), color:colors[ps.length%colors.length], bot:false}]);

  /* ===== GAME STATE ===== */
  const [order,setOrder] = useState([]);             // pořadí hráčů
  const [scores,setScores] = useState([]);           // skóre hráčů
  const [darts,setDarts] = useState([]);             // 3 šipky v aktuálním tahu
  const [currIdx,setCurrIdx] = useState(0);          // index v "order"
  const [mult,setMult] = useState(1);                // 1/2/3
  const [actions,setActions] = useState([]);         // stack pro undo
  const [thrown,setThrown] = useState([]);           // celkem šipek
  const [lastTurn,setLastTurn] = useState([]);       // součet posledního tahu
  const [winner,setWinner] = useState(null);

  const currentPlayerIndex = order[currIdx] ?? 0;

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
    setActions([]);
    setThrown(dartsCnt);
    setLastTurn(last);
    setWinner(null);
    setMult(1);
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
  const isFinishAllowed = (m) => {
    if(outMode==='single') return m===1;
    if(outMode==='double') return m===2;
    if(outMode==='triple') return m===3;
    return m===2 || m===3; // master
  };
  const isBustLeavingOne = (newScore) => (outMode==='single'? false : newScore===1);

  const playHitSound = () => {
    if(soundOn && hitAudioRef.current){
      try { hitAudioRef.current.currentTime = 0; hitAudioRef.current.play(); } catch {}
    }
  };
  const pushAction = (payload) => setActions(st=>[...st, payload]);

  /* 3) Zákaz neplatných kombinací (D/T 0, D/T 25, D/T 50) */
  const isInvalidCombo = (v,m) => {
    if(m>1 && (v===0 || v===25 || v===50)) return true;
    return false;
  };

  const commitDart = (value) => {
    let v=value, m=mult;
    if(isInvalidCombo(v,m)) return; // ignoruj klik

    if(value===25 || value===50){ m=1; v=value; } // bull/bullseye ignoruje mult
    const hit = v*m;
    const pIdx = currentPlayerIndex;
    const prev = scores[pIdx];
    let tentative = prev - hit;

    const resetMult = () => setMult(1); // po každém hodu zpět na Single

    if(tentative < 0 || isBustLeavingOne(tentative)){
      speak(lang, t(lang,'bust'), voiceOn);
      playHitSound();
      pushAction({type:'bust', pIdx, prevScore:prev, dartsBefore:[...darts]});
      setDarts([]);
      setLastTurn(ls=>ls.map((x,i)=> i===pIdx ? 0 : x));
      resetMult();
      nextPlayer();
      return;
    }

    if(tentative === 0){
      if(isFinishAllowed(m)){
        playHitSound();
        const name = players[pIdx]?.name || '';
        speak(lang, `${t(lang,'youWinPrefix')} ${name}`, voiceOn);
        pushAction({type:'dart', pIdx, prevScore:prev, newScore:tentative, hit:{v,m,score:hit}});
        setScores(sc=>sc.map((x,i)=> i===pIdx ? 0 : x));
        setDarts(ds=>[...ds,{v,m,score:hit}]);
        setThrown(th=>th.map((x,i)=> i===pIdx ? x+1 : x));
        setLastTurn(ls=>ls.map((x,i)=> i===pIdx ? sumScores([...darts,{v,m,score:hit}]) : x));
        setWinner(pIdx);
        resetMult();
        return;
      } else {
        speak(lang, t(lang,'bust'), voiceOn);
        pushAction({type:'bust', pIdx, prevScore:prev, dartsBefore:[...darts]});
        setDarts([]);
        setLastTurn(ls=>ls.map((x,i)=> i===pIdx ? 0 : x));
        resetMult();
        nextPlayer();
        return;
      }
    }

    playHitSound();
    pushAction({type:'dart', pIdx, prevScore:prev, newScore:tentative, hit:{v,m,score:hit}});
    setScores(sc=>sc.map((x,i)=> i===pIdx ? tentative : x));
    setDarts(ds=>[...ds,{v,m,score:hit}]);
    setThrown(th=>th.map((x,i)=> i===pIdx ? x+1 : x));
    setLastTurn(ls=>ls.map((x,i)=> i===pIdx ? sumScores([...darts,{v,m,score:hit}]) : x));
    resetMult();

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

  const undo = () => {
    setActions(st=>{
      if(st.length===0) return st;
      const last = st[st.length-1];
      if(last.type==='dart'){
        const {pIdx, prevScore, hit} = last;
        setScores(sc=>sc.map((x,i)=> i===pIdx ? prevScore : x));
        setDarts(ds=>{
          const d=[...ds];
          if(order[currIdx]!==pIdx){
            const pos = order.indexOf(pIdx);
            if(pos>=0) setCurrIdx(pos);
          }
          if(d.length>0) d.pop();
          else d.push(hit);
          return d;
        });
        setThrown(th=>th.map((x,i)=> i===pIdx ? Math.max(0,x-1) : x));
        setLastTurn(ls=>ls.map((x,i)=> i===pIdx ? Math.max(0, x - (hit?.score||0)) : x));
      } else if(last.type==='bust'){
        const {pIdx, prevScore} = last;
        setScores(sc=>sc.map((x,i)=> i===pIdx ? prevScore : x));
        const pos = order.indexOf(pIdx);
        if(pos>=0) setCurrIdx(pos);
        setDarts(last.dartsBefore || []);
        setLastTurn(ls=>ls.map((x,i)=> i===pIdx ? 0 : x));
      }
      return st.slice(0,-1);
    });
    setMult(1);
  };

  const averages = useMemo(()=>{
    return players.map((_,i)=>{
      const thrownDarts = thrown[i] || 0;
      const done = startScore - (scores[i] ?? startScore);
      return thrownDarts>0 ? (done / thrownDarts) : 0;
    });
  },[players, thrown, scores, startScore]);

  /* ===== AUTO SCROLL na aktivního hráče + BOT ===== */
  const cardRefs = useRef({});
  useEffect(()=>{
    const activeIdx = order[currIdx];
    const el = cardRefs.current[activeIdx];
    if(el && el.scrollIntoView){
      el.scrollIntoView({behavior:'smooth', block:'nearest'});
    }
  },[order, currIdx]);

  // 4) BOT—jednoduchá AI (pravděpodobnosti zásahů)
  useEffect(()=>{
    const pIdx = order[currIdx];
    const p = players[pIdx];
    if(!p || !p.bot || winner!=null) return;

    let cancelled=false;
    const delays = [350, 900, 1450];
    const level = p.level || 'easy';

    const pickThrow = () => {
      const tables = {
        easy:   { miss:0.25, single:0.6, double:0.12, triple:0.03 },
        medium: { miss:0.15, single:0.6, double:0.18, triple:0.07 },
        hard:   { miss:0.08, single:0.55, double:0.22, triple:0.15 }
      };
      const tb = tables[level] || tables.easy;
      const r = Math.random();
      let multSel = 1;
      if(r > 1 - tb.triple) multSel = 3;
      else if(r > 1 - (tb.triple + tb.double)) multSel = 2;
      else if(r <= tb.miss) return {v:0,m:1};
      const pool = [20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,25,50];
      let v = pool[Math.floor(Math.random()*pool.length)];
      if(multSel>1 && (v===0 || v===25 || v===50)) multSel = 1;
      return {v, m:multSel};
    };

    const fire = (i) => {
      if(cancelled || winner!=null) return;
      const throwRes = pickThrow();
      if(!throwRes) return;
      setTimeout(()=>{ if(!cancelled){ setMult(throwRes.m); commitDart(throwRes.v); } }, delays[i]);
    };

    fire(0); fire(1); fire(2);
    return ()=>{ cancelled=true };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[currIdx, order, players, winner]);

  /* auto-select jména v lobby */
  const handleNameFocus = (e) => e.target.select();
  const handleNameMouseUp = (e) => e.preventDefault();

  /* ===== ULOŽIT / NAČÍST HRU ===== */
  const saveGame = () => {
    try{
      const snapshot = {
        version:1,
        mode,startScore,outMode,randomOrder,
        players,order,scores,currIdx,thrown,lastTurn,
      };
      localStorage.setItem('savedGame', JSON.stringify(snapshot));
      alert('Uloženo.');
    }catch{}
  };
  const hasSaved = !!localStorage.getItem('savedGame');
  const continueGame = () => {
    try{
      const s=JSON.parse(localStorage.getItem('savedGame')||'{}');
      if(!s || !s.order) return;
      setMode(s.mode||'classic');
      setStartScore(s.startScore||501);
      setOutMode(s.outMode||'double');
      setRandomOrder(!!s.randomOrder);
      setPlayers(s.players||players);
      setOrder(s.order||[]);
      setScores(s.scores||[]);
      setCurrIdx(s.currIdx||0);
      setThrown(s.thrown||[]);
      setLastTurn(s.lastTurn||[]);
      setWinner(null);
      setDarts([]);
      setScreen('game');
    }catch{}
  };

  return (
    <div className="container">
      {/* HEADER */}
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
            {['cs','en','de','es','nl','ru'].map(code=>(
              <option key={code} value={code}>{LANG_LABEL[code]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ADS */}
      <div className="adstrip">
        <div className="adcard">AdMob</div><div className="adcard">Ad</div><div className="adcard">Ad</div>
      </div>

      {/* LOBBY nebo GAME */}
      {screen==='lobby' ? (
        <Lobby
          lang={lang} t={t}
          mode={mode} setMode={setMode}
          startScore={startScore} setStartScore={setStartScore}
          outMode={outMode} setOutMode={setOutMode}
          randomOrder={randomOrder} setRandomOrder={setRandomOrder}
          ai={ai} setAi={setAi}
          players={players} setPlayers={setPlayers}
          addPlayer={addPlayer} deletePlayer={deletePlayer}
          movePlayer={movePlayer}
          startGame={startGame}
          continueGame={hasSaved ? continueGame : null}
          handleNameFocus={handleNameFocus}
          handleNameMouseUp={handleNameMouseUp}
          soundOn={soundOn} voiceOn={voiceOn}
          hitAudioRef={hitAudioRef}
        />
      ) : (
        <Game
          lang={lang} t={t}
          outMode={outMode}
          players={players} order={order} currIdx={currIdx}
          scores={scores} averages={averages} thrown={thrown} lastTurn={lastTurn}
          darts={darts} mult={mult} setMult={setMult}
          commitDart={commitDart} undo={undo}
          winner={winner}
          saveGame={saveGame}
          cardRefs={cardRefs}
          setScreen={setScreen}
        />
      )}

      <audio ref={hitAudioRef} src="/dart-hit.mp3" preload="auto" />
    </div>
  );
}

/* ===== LOBBY ===== */
function Lobby({
  lang,t, mode,setMode, startScore,setStartScore,
  outMode,setOutMode, randomOrder,setRandomOrder,
  ai,setAi, players,setPlayers, addPlayer,deletePlayer,movePlayer,
  startGame, continueGame, handleNameFocus,handleNameMouseUp
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
              <button key={s} className={`tab ${startScore===s?'active':''}`} style={{padding:'4px 8px',lineHeight:1.1}} onClick={()=>setStartScore(s)}>{s}</button>
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

      {/* >>> Start hry – přesunuto nad hráče <<< */}
      <div className="lobbyCard">
        <div style={{display:'flex',gap:8,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}>
          <div style={{display:'flex',gap:8}}>
            <button className="btn green" onClick={startGame}>{t(lang,'startGame')}</button>
            {continueGame && <button className="btn" onClick={continueGame}>{t(lang,'continueGame')}</button>}
          </div>
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

      {/* Pravidla */}
      <div className="lobbyCard">
        <details>
          <summary className="btn ghost">📖 {t(lang,'rules')}</summary>
          <dl className="rules">
            <dt>{t(lang,'classic')}</dt>
            <dd>Single = ×1, Double = ×2, Triple = ×3, Bull 25/50. Cíl: přesně na 0.
              <em> {t(lang,'singleOut')}, {t(lang,'doubleOut')}, {t(lang,'tripleOut')}, {t(lang,'masterOut')}</em>.
              Přestřelení nebo zbyde 1 (u D/T/M) = {t(lang,'bust')}.</dd>
            <dt>{t(lang,'cricket')}</dt>
            <dd>15–20 a Bull. Single 1 bod, Double 2, Triple 3. Otevři číslo (3 body), skóruj, zavírej. Vyhraješ, když zavřeš vše a vedeš na body.</dd>
            <dt>{t(lang,'around')}</dt>
            <dd>1→20→Bull. Jakýkoli zásah požadovaného čísla se počítá. Vyhrává kdo první dokončí Bull.</dd>
          </dl>
        </details>
      </div>
    </div>
  );
}

/* ===== GAME ===== */
function Game({
  lang,t,outMode, players, order, currIdx,
  scores, averages, thrown, lastTurn,
  darts, mult, setMult, commitDart, undo, winner,
  saveGame, cardRefs, setScreen
}){
  const keypad = [
    [1,2,3,4,5,6,7],
    [8,9,10,11,12,13,14],
    [15,16,17,18,19,20,25],
    [0,50]
  ];

  const outMap = { single:'Single-out', double:'Double-out', triple:'Triple-out', master:'Master-out' };

  return (
    <div className="gameWrap">
      {/* horní štítek s informací o ukončení */}
      <div className="gameTopBar">
        <span className="badge">{t(lang,'outLabel')}: {outMap[outMode] || '-'}</span>
        <div className="gameTopBtns">
          <button className="btn" onClick={saveGame}>{t(lang,'saveGame')}</button>
          <button className="btn ghost" onClick={()=>setScreen('lobby')}>{t(lang,'back')}</button>
        </div>
      </div>

      <div className="playersPane">
        {order.map((pIdx,i)=>{
          const p=players[pIdx];
          const active = i===currIdx && winner==null;
          return (
            <div
              key={p.id}
              ref={node=>{ if(node) cardRefs.current[pIdx]=node; }}
              className={`playerCard ${active?'active':''} ${winner===pIdx?'winner':''}`}
            >
              {winner===pIdx && <div className="fireworks" aria-hidden="true"></div>}
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

      <div className="padPane">
        <div className="padRow">
          <button className={`multBtn ${mult===2?'active':''}`} onClick={()=>setMult(m=>m===2?1:2)}>DOUBLE</button>
          <button className={`multBtn ${mult===3?'active':''}`} onClick={()=>setMult(m=>m===3?1:3)}>TRIPLE</button>

          {/* Backspace – velikost jako multBtn */}
          <button className="multBtn backspace" onClick={undo} title={t(lang,'undo')} aria-label={t(lang,'undo')}>
            <svg viewBox="0 0 24 24" className="iconBackspace" aria-hidden="true">
              <path d="M6.5 5L3 12l3.5 7H20a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H6.5zM14 9l-2 2-2-2-2 2 2 2-2 2 2 2 2-2 2 2 2-2-2-2 2-2-2-2z"/>
            </svg>
          </button>
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
