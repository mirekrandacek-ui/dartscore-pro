import React, { useEffect, useMemo, useRef, useState } from 'react';
import './app.css';

/* ===== Ikona reproduktoru ===== */
const IconSpeaker = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 9v6h4l5 4V5L7 9H3zM16.5 12a3.5 3.5 0 0 0-2.13-3.22v6.44A3.5 3.5 0 0 0 16.5 12z"/>
    <path d="M14.37 5.29a7 7 0 0 1 0 13.42v-2.02a5 5 0 0 0 0-9.38V5.29z"/>
  </svg>
);

/* ===== Texty ===== */
const T = {
  cs:{app:'DartScore Pro',sound:'Zvuk',voice:'Hlas',back:'Zpět',
      mode:'Režim',classic:'Klasická hra',cricket:'Cricket',around:'Around the Clock',
      start:'Start',closing:'Ukončení',
      doubleOut:'Double-out',tripleOut:'Triple-out',masterOut:'Master-out',
      anyOutHint:'— pokud není vybráno nic, uzavírá se libovolně',
      order:'Pořadí',fixed:'Fixní',random:'Náhodné', playThrough:'Dohrávat kolo',
      robot:'Robot',off:'Vypn.',easy:'Snadná',medium:'Střední',hard:'Těžká',
      startGame:'▶ Start hry',continueGame:'Pokračovat ve hře',saveGame:'Uložit hru',restart:'Opakovat hru',
      rules:'Pravidla',addPlayer:'Přidat hráče',
      saved:'Uložené hry',share:'Sdílet',clear:'Smazat vše',
      player:'Hráč',game:'Hra',darts:'šipek',avg:'průměr/šipka',last:'Poslední hod',
      undo:'Zpět',next:'Další hráč',bust:'bez skóre',checkout:'checkout',
      youWinPrefix:'Výhra', outLabel:'Ukončení', zeroWord:'nula'},
  en:{app:'DartScore Pro',sound:'Sound',voice:'Voice',back:'Back',
      mode:'Mode',classic:'Classic',cricket:'Cricket',around:'Around the Clock',
      start:'Start',closing:'Finish',
      doubleOut:'Double-out',tripleOut:'Triple-out',masterOut:'Master-out',
      anyOutHint:'— if none is selected, any-out is allowed',
      order:'Order',fixed:'Fixed',random:'Random', playThrough:'Play the round',
      robot:'Bot',off:'Off',easy:'Easy',medium:'Medium',hard:'Hard',
      startGame:'▶ Start Game',continueGame:'Continue game',saveGame:'Save game',restart:'Restart game',
      rules:'Rules',addPlayer:'Add player',
      saved:'Saved games',share:'Share',clear:'Clear all',
      player:'Player',game:'Game',darts:'darts',avg:'avg/dart',last:'Last throw',
      undo:'Undo',next:'Next player',bust:'bust',checkout:'checkout',
      youWinPrefix:'Win', outLabel:'Finish', zeroWord:'zero'},
  de:{app:'DartScore Pro',sound:'Ton',voice:'Stimme',back:'Zurück',
      mode:'Modus',classic:'Klassisch',cricket:'Cricket',around:'Rund um die Uhr',
      start:'Start',closing:'Beenden',
      doubleOut:'Double-out',tripleOut:'Triple-out',masterOut:'Master-out',
      anyOutHint:'— wenn nichts gewählt ist, ist Any-out erlaubt',
      order:'Reihenfolge',fixed:'Fix',random:'Zufällig', playThrough:'Runde ausspielen',
      robot:'Roboter',off:'Aus',easy:'Leicht',medium:'Mittel',hard:'Schwer',
      startGame:'▶ Spiel starten',continueGame:'Spiel fortsetzen',saveGame:'Spiel speichern',restart:'Neu starten',
      rules:'Regeln',addPlayer:'Spieler hinzufügen',
      saved:'Gespeicherte Spiele',share:'Teilen',clear:'Alles löschen',
      player:'Spieler',game:'Spiel',darts:'Darts',avg:'Schnitt/Dart',last:'Letzter Wurf',
      undo:'Zurück',next:'Nächster',bust:'bust',checkout:'Checkout',
      youWinPrefix:'Sieg', outLabel:'Finish', zeroWord:'null'},
  es:{app:'DartScore Pro',sound:'Sonido',voice:'Voz',back:'Atrás',
      mode:'Modo',classic:'Clásico',cricket:'Cricket',around:'Alrededor del reloj',
      start:'Inicio',closing:'Cierre',
      doubleOut:'Double-out',tripleOut:'Triple-out',masterOut:'Master-out',
      anyOutHint:'— si no se selecciona nada, se permite any-out',
      order:'Orden',fixed:'Fijo',random:'Aleatorio', playThrough:'Jugar la ronda',
      robot:'Robot',off:'Apag.',easy:'Fácil',medium:'Medio',hard:'Difícil',
      startGame:'▶ Empezar',continueGame:'Continuar partida',saveGame:'Guardar partida',restart:'Reiniciar',
      rules:'Reglas',addPlayer:'Añadir jugador',
      saved:'Partidas guardadas',share:'Compartir',clear:'Borrar todo',
      player:'Jugador',game:'Juego',darts:'dardos',avg:'prom/dardo',last:'Último tiro',
      undo:'Deshacer',next:'Siguiente',bust:'sin puntuación',checkout:'checkout',
      youWinPrefix:'Victoria', outLabel:'Finish', zeroWord:'cero'},
  nl:{app:'DartScore Pro',sound:'Geluid',voice:'Spraak',back:'Terug',
      mode:'Modus',classic:'Klassiek',cricket:'Cricket',around:'Rond de klok',
      start:'Start',closing:'Einde',
      doubleOut:'Double-out',tripleOut:'Triple-out',masterOut:'Master-out',
      anyOutHint:'— als niets is gekozen, is any-out toegestaan',
      order:'Volgorde',fixed:'Vast',random:'Willekeurig', playThrough:'Ronde uitspelen',
      robot:'Robot',off:'Uit',easy:'Makkelijk',medium:'Gemiddeld',hard:'Moeilijk',
      startGame:'▶ Start spel',continueGame:'Doorgaan',saveGame:'Spel opslaan',restart:'Opnieuw',
      rules:'Regels',addPlayer:'Speler toevoegen',
      saved:'Opgeslagen spellen',share:'Delen',clear:'Alles wissen',
      player:'Speler',game:'Spel',darts:'darts',avg:'gem/dart',last:'Laatste worp',
      undo:'Ongedaan',next:'Volgende',bust:'bust',checkout:'checkout',
      youWinPrefix:'Winst', outLabel:'Finish', zeroWord:'nul'},
  ru:{app:'DartScore Pro',sound:'Звук',voice:'Голос',back:'Назад',
      mode:'Режим',classic:'Классика',cricket:'Крикет',around:'По кругу',
      start:'Старт',closing:'Завершение',
      doubleOut:'Double-out',tripleOut:'Triple-out',masterOut:'Master-out',
      anyOutHint:'— если ничего не выбрано, разрешён любой финиш',
      order:'Порядок',fixed:'Фикс',random:'Случайно', playThrough:'Доиграть круг',
      robot:'Робот',off:'Выкл.',easy:'Лёгкий',medium:'Средний',hard:'Сложный',
      startGame:'▶ Начать игру',continueGame:'Продолжить',saveGame:'Сохранить игру',restart:'Перезапуск',
      rules:'Правила',addPlayer:'Добавить игрока',
      saved:'Сохранённые игры',share:'Поделиться',clear:'Удалить всё',
      player:'Игрок',game:'Игра',darts:'дротиков',avg:'ср./дротик',last:'Последний бросок',
      undo:'Отмена',next:'Далее',bust:'без очков',checkout:'чекаут',
      youWinPrefix:'Победа', outLabel:'Finish', zeroWord:'ноль'}
};
const LANG_LABEL = {cs:'Čeština',en:'English',de:'Deutsch',es:'Español',nl:'Nederlands',ru:'Русский'};
const t = (lang, key) => (T[lang] && T[lang][key]) || T.cs[key] || key;

/* ===== Utils ===== */
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

  /* obrazovky + perzistence */
  const [screen,setScreen] = useState(()=>localStorage.getItem('screen')||'lobby');
  useEffect(()=>{ localStorage.setItem('screen', screen); },[screen]);

  const [lang,setLang]     = useState(((navigator.language||'cs').slice(0,2))||'cs');
  const [soundOn,setSoundOn] = useState(true);
  const [voiceOn,setVoiceOn] = useState(true);

  const [mode,setMode] = useState('classic');
  const [startScore,setStartScore] = useState(501);

  /* out pravidla – přepínače */
  const [outDouble,setOutDouble] = useState(true);
  const [outTriple,setOutTriple] = useState(false);
  const [outMaster,setOutMaster] = useState(false);

  const [randomOrder,setRandomOrder] = useState(false);
  const [playThrough,setPlayThrough] = useState(false);
  const [ai,setAi] = useState('off'); // off | easy | medium | hard

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
    if(typeof s.outDouble==='boolean') setOutDouble(s.outDouble);
    if(typeof s.outTriple==='boolean') setOutTriple(s.outTriple);
    if(typeof s.outMaster==='boolean') setOutMaster(s.outMaster);
    if(typeof s.randomOrder==='boolean') setRandomOrder(s.randomOrder);
    if(typeof s.playThrough==='boolean') setPlayThrough(s.playThrough);
    if(s.ai) setAi(s.ai);
    if(s.players) setPlayers(s.players);
  }catch{} },[]);
  useEffect(()=>{ try{
    localStorage.setItem('lobby', JSON.stringify({
      lang,mode,startScore,
      outDouble,outTriple,outMaster,
      randomOrder,playThrough,ai,players
    }));
  }catch{} },[lang,mode,startScore,outDouble,outTriple,outMaster,randomOrder,playThrough,ai,players]);

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

  /* BOT v lobby (přidat/odebrat) */
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
  const [order,setOrder] = useState([]);
  const [scores,setScores] = useState([]);
  const [darts,setDarts] = useState([]);
  const [currIdx,setCurrIdx] = useState(0);
  const [mult,setMult] = useState(1);
  const [actions,setActions] = useState([]);
  const [thrown,setThrown] = useState([]);
  const [lastTurn,setLastTurn] = useState([]);
  const [winner,setWinner] = useState(null);
  const [pendingWin,setPendingWin] = useState(null);

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
    setPendingWin(null);
    setMult(1);
    setScreen('game');
  };
  const restartGame = () => startGame();

  function shuffle(a){
    const arr=[...a];
    for(let i=arr.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }

  /* out pravidla */
  const anyOutSelected = outDouble || outTriple || outMaster;
  const isFinishAllowed = (m) => {
    if(!anyOutSelected) return true; // libovolné uzavření
    if(m===2 && outDouble) return true;
    if(m===3 && outTriple) return true;
    if((m===2||m===3) && outMaster) return true;
    return false;
  };
  const isBustLeavingOne = (newScore) => (anyOutSelected ? newScore===1 : false);

  const playHitSound = () => {
    if(soundOn && hitAudioRef.current){
      try { hitAudioRef.current.currentTime = 0; hitAudioRef.current.play(); } catch {}
    }
  };
  const pushAction = (payload) => setActions(st=>[...st, payload]);

  const isInvalidCombo = (v,m) => (m>1 && (v===0 || v===25 || v===50));

  // commit s volitelným mOverride (kvůli b otovi – nečekáme na setState)
  const commitDart = (value, mOverride) => {
    let v=value; let m=(mOverride ?? mult);
    if(isInvalidCombo(v,m)) return;

    if(value===25 || value===50){ m=1; v=value; }
    const hit = v*m;
    const pIdx = currentPlayerIndex;
    const prev = scores[pIdx];
    let tentative = prev - hit;

    const resetMult = () => setMult(1);

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

    const dartsUsed = darts.length+1;

    if(tentative === 0){
      if(isFinishAllowed(m)){
        playHitSound();
        pushAction({type:'dart', pIdx, prevScore:prev, newScore:tentative, hit:{v,m,score:hit}});
        setScores(sc=>sc.map((x,i)=> i===pIdx ? 0 : x));
        const newD = [...darts,{v,m,score:hit}];
        setDarts(newD);
        setThrown(th=>th.map((x,i)=> i===pIdx ? x+1 : x));
        setLastTurn(ls=>ls.map((x,i)=> i===pIdx ? sumScores(newD) : x));

        if(!playThrough){
          const name = players[pIdx]?.name || '';
          speak(lang, `${t(lang,'youWinPrefix')} ${name}`, voiceOn);
          finalizeWin(pIdx);
          resetMult();
          return;
        } else {
          setPendingWin(prevBest=>{
            if(!prevBest || dartsUsed < prevBest.dartsUsed) return {pIdx, dartsUsed};
            return prevBest;
          });
          resetMult();
          nextPlayer();
          return;
        }
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
    const newD = [...darts,{v,m,score:hit}];
    setDarts(newD);
    setThrown(th=>th.map((x,i)=> i===pIdx ? x+1 : x));
    setLastTurn(ls=>ls.map((x,i)=> i===pIdx ? sumScores(newD) : x));
    resetMult();

    // po třetí šipce řekni součet (včetně 0)
    setTimeout(()=>{
      setDarts(current=>{
        if(current.length>=3){
          const total = sumScores(current);
          speak(lang, total===0 ? t(lang,'zeroWord') : total, voiceOn);
          nextPlayer();
          return [];
        }
        return current;
      });
    }, 30);
  };

  const finalizeWin = (pIdx) => {
    const name = players[pIdx]?.name || '';
    speak(lang, `${t(lang,'youWinPrefix')} ${name}`, voiceOn);
    setWinner(pIdx);
    try{
      const list = JSON.parse(localStorage.getItem('finishedGames')||'[]');
      list.unshift({
        ts: Date.now(),
        mode, startScore,
        outDouble,outTriple,outMaster,
        randomOrder, playThrough,
        players: players.map(p=>p.name),
        winner: players[pIdx]?.name || '',
      });
      localStorage.setItem('finishedGames', JSON.stringify(list.slice(0,100)));
    }catch{}
  };

  const sumScores = (arr) => arr.reduce((s,a)=>s+(a?.score||0),0);

  const nextPlayer = () => {
    setCurrIdx(i => {
      const next = (i+1) % order.length;
      if(next===0 && playThrough && pendingWin && winner==null){
        finalizeWin(pendingWin.pIdx);
        setPendingWin(null);
      }
      return next;
    });
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

  /* AUTO SCROLL na aktivního hráče */
  const cardRefs = useRef({});
  useEffect(()=>{
    const activeIdx = order[currIdx];
    const el = cardRefs.current[activeIdx];
    if(el && el.scrollIntoView){
      el.scrollIntoView({behavior:'smooth', block:'nearest'});
    }
  },[order, currIdx]);

  /* BOT—háže s mOverride (3 šipky) */
  useEffect(()=>{
    const pIdx = order[currIdx];
    const p = players[pIdx];
    if(!p || !p.bot || winner!=null) return;

    let cancelled=false;
    const delays = [350, 900, 1450];
    const tables = {
      easy:   { miss:0.25, single:0.6, double:0.12, triple:0.03 },
      medium: { miss:0.15, single:0.6, double:0.18, triple:0.07 },
      hard:   { miss:0.08, single:0.55, double:0.22, triple:0.15 }
    };
    const tb = tables[p.level || 'easy'];

    const pickThrow = () => {
      const r = Math.random();
      let m = 1;
      if(r > 1 - tb.triple) m = 3;
      else if(r > 1 - (tb.triple + tb.double)) m = 2;
      else if(r <= tb.miss) return {v:0,m:1};
      const pool = [20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,25,50];
      let v = pool[Math.floor(Math.random()*pool.length)];
      if(m>1 && (v===0 || v===25 || v===50)) m = 1;
      return {v,m};
    };

    const fire = (i) => {
      if(cancelled || winner!=null) return;
      const th = pickThrow();
      if(!th) return;
      setTimeout(()=>{
        if(!cancelled){ commitDart(th.v, th.m); }
      }, delays[i]);
    };

    fire(0); fire(1); fire(2);
    return ()=>{ cancelled=true };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[currIdx, order, players, winner]);

  /* Uložení snapshotu při návratu do lobby (aby šlo „Pokračovat“) */
  const saveSnapshot = () => {
    try{
      const snapshot = {version:1, mode,startScore,
        outDouble,outTriple,outMaster,
        randomOrder,playThrough,players,order,scores,currIdx,thrown,lastTurn};
      localStorage.setItem('savedGame', JSON.stringify(snapshot));
    }catch{}
  };
  const continueSaved = () => {
    try{
      const s=JSON.parse(localStorage.getItem('savedGame')||'{}');
      if(!s || !s.order) return alert('Nic k pokračování.');
      setMode(s.mode||'classic');
      setStartScore(s.startScore||501);
      setPlayers(s.players||players);
      setOrder(s.order||[]);
      setScores(s.scores||[]);
      setCurrIdx(s.currIdx||0);
      setThrown(s.thrown||[]);
      setLastTurn(s.lastTurn||[]);
      setWinner(null);
      setPendingWin(null);
      setMult(1);
      setScreen('game');
    }catch{}
  };

  return (
    <div className="container">
      {/* HEADER */}
      <div className="header">
        <div className="left">
          {screen==='game' && (
            <button type="button" className="btn ghost" onClick={()=>{saveSnapshot(); setScreen('lobby')}} title={t(lang,'back')}>←</button>
          )}
          <div className="logo"><span className="dart"></span><span>{t(lang,'app')}</span></div>
        </div>
        <div className="controls">
          <button type="button" className={`iconBtn ${!soundOn?'muted':''}`} onClick={()=>setSoundOn(v=>!v)} aria-label={t(lang,'sound')}>
            <IconSpeaker/>
          </button>
          <button type="button" className={`iconBtn ${!voiceOn?'muted':''}`} onClick={()=>setVoiceOn(v=>!v)} aria-label={t(lang,'voice')}>
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

      {screen==='lobby' ? (
        <Lobby
          lang={lang} t={t}
          mode={mode} setMode={setMode}
          startScore={startScore} setStartScore={setStartScore}
          outDouble={outDouble} setOutDouble={setOutDouble}
          outTriple={outTriple} setOutTriple={setOutTriple}
          outMaster={outMaster} setOutMaster={setOutMaster}
          randomOrder={randomOrder} setRandomOrder={setRandomOrder}
          playThrough={playThrough} setPlayThrough={setPlayThrough}
          ai={ai} setAi={setAi}
          players={players} setPlayers={setPlayers}
          addPlayer={addPlayer} deletePlayer={deletePlayer}
          movePlayer={movePlayer}
          startGame={startGame}
          continueSaved={continueSaved}
        />
      ) : (
        <Game
          lang={lang} t={t}
          outDesc={(() => {
            const arr=[];
            if(outDouble) arr.push('Double-out');
            if(outTriple) arr.push('Triple-out');
            if(outMaster) arr.push('Master-out');
            if(arr.length===0) return 'Any-out';
            return arr.join(' + ');
          })()}
          players={players} order={order} currIdx={currIdx}
          scores={scores} thrown={thrown} lastTurn={lastTurn}
          averages={averages}
          darts={darts} mult={mult} setMult={setMult}
          commitDart={commitDart} undo={undo}
          winner={winner}
          saveGame={()=>{ saveSnapshot(); alert('Uloženo.'); }}
          restartGame={restartGame}
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
  outDouble,setOutDouble, outTriple,setOutTriple, outMaster,setOutMaster,
  randomOrder,setRandomOrder, playThrough,setPlayThrough,
  ai,setAi, players,setPlayers, addPlayer,deletePlayer,movePlayer,
  startGame, continueSaved
}){
  const hasSaved = !!localStorage.getItem('savedGame');
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
              <button type="button" key={s} className={`tab ${startScore===s?'active':''}`} style={{padding:'4px 8px',lineHeight:1.1}} onClick={()=>setStartScore(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Ukončení – tři přepínače (na jednom řádku) */}
      {mode==='classic' && (
        <div className="lobbyCard">
          <div className="lobbyControls">
            <span>{t(lang,'closing')}</span>
            <label className={`tab ${outDouble?'active':''}`}>
              <input type="checkbox" checked={outDouble} onChange={e=>setOutDouble(e.target.checked)} style={{marginRight:6}}/>
              {t(lang,'doubleOut')}
            </label>
            <label className={`tab ${outTriple?'active':''}`}>
              <input type="checkbox" checked={outTriple} onChange={e=>setOutTriple(e.target.checked)} style={{marginRight:6}}/>
              {t(lang,'tripleOut')}
            </label>
            <label className={`tab ${outMaster?'active':''}`}>
              <input type="checkbox" checked={outMaster} onChange={e=>setOutMaster(e.target.checked)} style={{marginRight:6}}/>
              {t(lang,'masterOut')}
            </label>
            <div style={{opacity:.8,fontSize:12}}>{t(lang,'anyOutHint')}</div>
          </div>
        </div>
      )}

      {/* Pořadí & Dohrávat */}
      <div className="lobbyCard">
        <div className="lobbyControls">
          <span>{t(lang,'order')}</span>
          <select className="input" value={randomOrder?'random':'fixed'} onChange={e=>setRandomOrder(e.target.value==='random')} style={{height:34}}>
            <option value="fixed">{t(lang,'fixed')}</option>
            <option value="random">{t(lang,'random')}</option>
          </select>
          <label style={{display:'inline-flex',alignItems:'center',gap:8,marginLeft:12}}>
            <input type="checkbox" checked={playThrough} onChange={e=>setPlayThrough(e.target.checked)} />
            {t(lang,'playThrough')}
          </label>
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

      {/* Start & Pokračovat – nad hráči */}
      <div className="lobbyCard">
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <button type="button" className="btn green" onClick={startGame}>{t(lang,'startGame')}</button>
          {hasSaved && <button type="button" className="btn" onClick={continueSaved}>{t(lang,'continueGame')}</button>}
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
                onFocus={e=>e.target.select()}
                onMouseUp={e=>e.preventDefault()}
              />
            </div>
            <div className="playerActions">
              <button type="button" className="btn ghost" onClick={()=>movePlayer(i,-1)} title="Up" style={{padding:'4px 8px',lineHeight:1.1}}>↑</button>
              <button type="button" className="btn ghost" onClick={()=>movePlayer(i,1)}  title="Down" style={{padding:'4px 8px',lineHeight:1.1}}>↓</button>
            </div>
            <div><span className="score">{startScore}</span></div>
            <div className="playerDelete">
              <button type="button" className="trash" onClick={()=>deletePlayer(i)} title="Delete">🗑️</button>
            </div>
          </div>
        ))}
        <button type="button" className="btn" onClick={addPlayer}>+ {t(lang,'addPlayer')}</button>
      </div>

      {/* Pravidla */}
      <div className="lobbyCard">
        <details>
          <summary className="btn ghost">📖 {t(lang,'rules')}</summary>
          <dl className="rules">
            <dt>{t(lang,'classic')}</dt>
            <dd>Single = ×1, Double = ×2, Triple = ×3, Bull 25/50. Cíl: přesně na 0.
              <em> Double-out, Triple-out, Master-out</em>.  
              {t(lang,'anyOutHint')}. Přestřelení nebo zbyde 1 (pokud je aktivní některé out pravidlo) = {t(lang,'bust')}.</dd>
            <dt>{t(lang,'cricket')}</dt>
            <dd>15–20 a Bull. Single 1 bod, Double 2, Triple 3. Otevři číslo (3 body), skóruj, zavírej. Vyhraješ, když zavřeš vše a vedeš na body.</dd>
            <dt>{t(lang,'around')}</dt>
            <dd>1→20→Bull. Jakýkoli zásah požadovaného čísla se počítá. Vyhrává kdo první dokončí Bull.</dd>
          </dl>
        </details>
      </div>

      {/* Uložené hry */}
      <SavedGames lang={lang} t={t}/>
    </div>
  );
}

/* Uložené hry – seznam a sdílení */
function SavedGames({lang,t}){
  const [list,setList]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('finishedGames')||'[]')}catch{return []}
  });
  const shareItem = async (it)=>{
    const text = `${t(lang,'saved')}: ${new Date(it.ts).toLocaleString()} — Classic ${it.startScore} (rules: ${[
      it.outDouble?'D':'', it.outTriple?'T':'', it.outMaster?'M':''
    ].filter(Boolean).join('+') || 'Any'})\n${it.players.join(', ')}\n${t(lang,'youWinPrefix')}: ${it.winner}`;
    try{
      if(navigator.share){ await navigator.share({text}); }
      else {
        await navigator.clipboard.writeText(text);
        alert('Zkopírováno do schránky.');
      }
    }catch{}
  };
  const clearAll = ()=>{
    if(!confirm('Smazat všechny uložené hry?')) return;
    localStorage.removeItem('finishedGames');
    setList([]);
  };
  if(list.length===0) return (
    <div className="lobbyCard"><strong>{t(lang,'saved')}:</strong> —</div>
  );
  return (
    <div className="lobbyCard">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
        <strong>{t(lang,'saved')}</strong>
        <button type="button" className="btn" onClick={clearAll}>{t(lang,'clear')}</button>
      </div>
      <div className="savedList">
        {list.map((it,idx)=>(
          <div key={idx} className="savedRow">
            <div>
              <div className="savedTitle">{new Date(it.ts).toLocaleString()}</div>
              <div className="savedSub">{`Classic ${it.startScore} (rules: ${[
                it.outDouble?'D':'', it.outTriple?'T':'', it.outMaster?'M':''
              ].filter(Boolean).join('+') || 'Any'}) • ${it.players.join(', ')}`}</div>
              <div className="savedSub">{t(lang,'youWinPrefix')}: {it.winner}</div>
            </div>
            <button type="button" className="btn" onClick={()=>shareItem(it)}>{t(lang,'share')}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== GAME ===== */
function Game({
  lang,t,outDesc, players, order, currIdx,
  scores, averages, thrown, lastTurn,
  darts, mult, setMult, commitDart, undo, winner,
  saveGame, restartGame, cardRefs, setScreen
}){
  const keypad = [
    [1,2,3,4,5,6,7],
    [8,9,10,11,12,13,14],
    [15,16,17,18,19,20,25],
    [0,50]
  ];

  return (
    <div className="gameWrap">
      {/* horní lišta */}
      <div className="gameTopBar">
        <span className="badge">{t(lang,'outLabel')}: {outDesc}</span>
        <div className="gameTopBtns">
          <button type="button" className="btn" onClick={restartGame}>{t(lang,'restart')}</button>
          <button type="button" className="btn" onClick={saveGame}>{t(lang,'saveGame')}</button>
          <button type="button" className="btn ghost" onClick={()=>setScreen('lobby')}>{t(lang,'back')}</button>
        </div>
      </div>

      <div className="playersPane">
        {order.map((pIdx,i)=>{
          const p=players[pIdx];
          const active = i===currIdx && winner==null;
          const currentDarts = active ? darts : [];
          return (
            <div
              key={p.id}
              ref={node=>{ if(node) cardRefs.current[pIdx]=node; }}
              className={`playerCard ${active?'active':''} ${winner===pIdx?'winner':''}`}
            >
              {winner===pIdx && (
                <>
                  <div className="starburst" aria-hidden="true">
                    {Array.from({length:12}).map((_,k)=><span key={k} style={{'--k':k}} />)}
                  </div>
                  <div className="confetti" aria-hidden="true">
                    {Array.from({length:50}).map((_,k)=><span key={k} style={{'--i':k}}/>)}
                  </div>
                </>
              )}
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
                  const d = currentDarts[ix];
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
          <button type="button" className={`multBtn mult-2 ${mult===2?'active':''}`} onClick={()=>setMult(m=>m===2?1:2)}>DOUBLE</button>
          <button type="button" className={`multBtn mult-3 ${mult===3?'active':''}`} onClick={()=>setMult(m=>m===3?1:3)}>TRIPLE</button>
          {/* Backspace s křížkem doprostřed */}
          <button type="button" className="multBtn backspace" onClick={undo} title={t(lang,'undo')} aria-label={t(lang,'undo')}>
            <svg viewBox="0 0 24 24" className="iconBackspace" aria-hidden="true">
              <path d="M7 5L3 12l4 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7z" fill="none" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 9l4 4m0-4-4 4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {keypad.slice(0,3).map((row,ri)=>(
          <div key={ri} className="padRow">
            {row.map(n=>(
              <button type="button" key={n} className="key" onClick={()=>commitDart(n)}>{n}</button>
            ))}
          </div>
        ))}
        <div className="padRow">
          <button type="button" className="key" onClick={()=>commitDart(0)}>0</button>
          <button type="button" className="key" onClick={()=>commitDart(50)}>50</button>
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
function sumScores(a){ return a.reduce((s,x)=>s+(x?.score||0),0); }
