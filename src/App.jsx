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
      youWinPrefix:'Výhra', outLabel:'Ukončení', zeroWord:'nula',
      points:'Body', target:'Cíl'},

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
      youWinPrefix:'Win', outLabel:'Finish', zeroWord:'zero',
      points:'Points', target:'Target'},

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
      youWinPrefix:'Sieg', outLabel:'Finish', zeroWord:'null',
      points:'Punkte', target:'Ziel'},

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
      youWinPrefix:'Victoria', outLabel:'Finish', zeroWord:'cero',
      points:'Puntos', target:'Objetivo'},

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
      youWinPrefix:'Winst', outLabel:'Finish', zeroWord:'nul',
      points:'Punten', target:'Doel'},

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
      youWinPrefix:'Победа', outLabel:'Finish', zeroWord:'ноль',
      points:'Очки', target:'Цель'},

  zh:{app:'DartScore Pro',sound:'声音',voice:'语音',back:'返回',
      mode:'模式',classic:'经典',cricket:'Cricket',around:'顺时靶位',
      start:'开始',closing:'收尾',
      doubleOut:'双倍出',tripleOut:'三倍出',masterOut:'大师出',
      anyOutHint:'— 如果没有选择限制，可以任意收尾',
      order:'顺序',fixed:'固定',random:'随机', playThrough:'打完本轮',
      robot:'机器人',off:'关',easy:'简单',medium:'中等',hard:'困难',
      startGame:'▶ 开始游戏',continueGame:'继续游戏',saveGame:'保存对局',restart:'重新开始',
      rules:'规则',addPlayer:'添加玩家',
      saved:'已保存的对局',share:'分享',clear:'全部清除',
      player:'玩家',game:'对局',darts:'镖',avg:'均分/镖',last:'上轮合计',
      undo:'撤销',next:'下一位',bust:'爆掉',checkout:'收尾',
      youWinPrefix:'胜利', outLabel:'收尾', zeroWord:'零',
      points:'分数', target:'目标'}
};

const LANG_LABEL = {
  cs:'Čeština',
  en:'English',
  de:'Deutsch',
  es:'Español',
  nl:'Nederlands',
  ru:'Русский',
  zh:'中文'
};

const t = (lang, key) => (T[lang] && T[lang][key]) || T.cs[key] || key;

/* ===== Utils ===== */
const deepClone = (obj) => {
  try {
    return structuredClone(obj);
  } catch {
    return JSON.parse(JSON.stringify(obj));
  }
};

const uid = () => Math.random().toString(36).slice(2,9);
const colors = ['#16a34a','#3b82f6','#ef4444','#14b8a6','#8b5cf6','#e11d48','#f59e0b','#22c55e'];
const defaultNameFor=(lang,n)=>({cs:`Hráč ${n}`,en:`Player ${n}`,de:`Spieler ${n}`,es:`Jugador ${n}`,nl:`Speler ${n}`,ru:`Игрок ${n}`,zh:`玩家 ${n}`}[lang]||`Player ${n}`);
const autoNameRx = [/^Hráč (\d+)$/, /^Player (\d+)$/, /^Spieler (\d+)$/, /^Jugador (\d+)$/, /^Speler (\d+)$/, /^Игрок (\d+)$/, /^玩家 (\d+)$/];

function speak(lang, text, enabled){
  if(!enabled || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(text.toString());
  const map = {
    cs:'cs-CZ',
    en:'en-US',
    de:'de-DE',
    es:'es-ES',
    nl:'nl-NL',
    ru:'ru-RU',
    zh:'zh-CN'
  };
  u.lang = map[lang] || 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/* Cricket značky */
const markSymbol = (n) => (n<=0?'':(n===1?'/':(n===2?'✕':'Ⓧ')));

/* ===== ErrorBoundary ===== */
class ErrorBoundary extends React.Component {
  constructor(props){
    super(props);
    this.state = { hasError:false, info:'' };
  }
  static getDerivedStateFromError(err){
    return { hasError:true, info:String(err) };
  }
  componentDidCatch(err, info){
    console.error('App crashed:', err, info);
  }
  render(){
    if(this.state.hasError){
      return (
        <div style={{padding:16,color:'#fff',background:'#111',minHeight:'100vh'}}>
          <h2>Ups, něco se pokazilo.</h2>
          <div style={{opacity:.8,whiteSpace:'pre-wrap',fontFamily:'monospace',fontSize:12,marginTop:12}}>
            {this.state.info}
          </div>
          <button
            onClick={()=>location.reload()}
            style={{marginTop:16}}
          >
            Zkusit znovu načíst
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ===== Helpers ===== */
function formatHit(d){
  if(!d) return '-';
  const base = d.v === 0 ? '0' : d.v;
  if(d.m===2) return `D${base}`;
  if(d.m===3) return `T${base}`;
  return `${base}`;
}
function formatAvg(a){
  if(!a && a!==0) return '0.0';
  return a.toFixed(1);
}

/* ===== AdMob interstitial handler ===== */
import { AdMobInterstitial } from "expo-ads-admob";

const ADMOB_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712"; // test ID od Googlu

async function showInterstitialAd() {
  try {
    await AdMobInterstitial.setAdUnitID(ADMOB_INTERSTITIAL_ID);
    await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
    await AdMobInterstitial.showAdAsync();
  } catch (err) {
    console.warn("Interstitial Ad failed:", err);
  }
}

/* ===== MAIN APP ===== */
export default function App(){

  /* viewport fix */
  useEffect(()=>{
    const setVh=()=>document.documentElement.style.setProperty('--vh',`${window.innerHeight*0.01}px`);
    setVh();
    window.addEventListener('resize',setVh);
    return()=>window.removeEventListener('resize',setVh);
  },[]);

  /* === STATE === */

  /* obrazovky + perzistence lobby */
  const [screen,setScreen] = useState(()=>localStorage.getItem('screen')||'lobby');

  const [toast,setToast] = useState(null);
  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null), 1600); };

  const [lang,setLang]       = useState(((navigator.language||'cs').slice(0,2))||'cs');
  const [soundOn,setSoundOn] = useState(true);
  const [voiceOn,setVoiceOn] = useState(true);

  const [mode,setMode] = useState('classic');
  const [startScore,setStartScore] = useState(501);

  /* premium režim (bez reklam + vzhled appky odemčený) */
  const [isPremium,setIsPremium] = useState(false);

  /* THEME STATE (premium skin) */
  const [themeColor, setThemeColor] = useState('default');

  /* stav pro náš vlastní overlay po výhře */
  const [showAd, setShowAd] = useState(false);        // jestli je overlay vidět
  const [adSecondsLeft, setAdSecondsLeft] = useState(20); // zbývající sekundy
  const adTimerRef = useRef(null); // timer intervalu

  /* out pravidla – jen pro Classic */
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
  const winAudioRef = useRef(null);

  /* persist screen */
  useEffect(()=>{ localStorage.setItem('screen', screen); },[screen]);

  /* načti lobby z localStorage */
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
    if(typeof s.isPremium==='boolean') setIsPremium(s.isPremium);
  }catch{} },[]);

  /* ukládej lobby */
  useEffect(()=>{ try{
    localStorage.setItem('lobby', JSON.stringify({
      lang,mode,startScore,
      outDouble,outTriple,outMaster,
      randomOrder,playThrough,ai,players,
      isPremium
    }));
  }catch{} },[
    lang,mode,startScore,
    outDouble,outTriple,outMaster,
    randomOrder,playThrough,ai,players,
    isPremium
  ]);

  /* přelož auto-jména když změním jazyk */
  useEffect(()=>{
    setPlayers(ps=>ps.map(p=>{
      for(const rx of autoNameRx){
        const m=p.name.match(rx);
        if(m){
          const n=parseInt(m[1],10);
          return {...p, name:defaultNameFor(lang,n)};
        }
      }
      return p;
    }));
  },[lang]);

  /* robot do lobby / ven z lobby */
  useEffect(()=>{
    setPlayers(ps=>{
      const hasBot = ps.some(p=>p.bot);
      if(ai==='off'){
        return hasBot ? ps.filter(p=>!p.bot) : ps;
      }
      if(!hasBot){
        return [
          ...ps,
          {
            id:uid(),
            name:`🤖 ${t(lang,'robot')} (${t(lang,ai)})`,
            color:colors[ps.length%colors.length],
            bot:true,
            level:ai
          }
        ];
      }
      return ps.map(p=>p.bot
        ? {...p, name:`🤖 ${t(lang,'robot')} (${t(lang,ai)})`, level:ai}
        : p
      );
    });
  },[ai,lang]);

  /* Dynamická barevná hlavička / skin */
  useEffect(()=>{
    const root = document.documentElement;

    // výchozí free skin (tmavý)
    let bg     = '#0e0e0e';
    let panel  = '#181a1f';
    let line   = '#2b2f36';
    let accent = '#16a34a';

    if (isPremium) {
      if (themeColor === 'blue') {
        bg     = '#0c1a36';
        panel  = '#12284a';
        line   = '#27406a';
        accent = '#3b82f6';
      } else if (themeColor === 'red') {
        bg     = '#3b0d0d';
        panel  = '#551414';
        line   = '#752222';
        accent = '#ef4444';
      } else if (themeColor === 'purple') {
        bg     = '#28104d';
        panel  = '#3b176f';
        line   = '#5b2aa3';
        accent = '#8b5cf6';
      } else if (themeColor === 'green') {
        bg     = '#0e2d17';
        panel  = '#154220';
        line   = '#236633';
        accent = '#16a34a';
      }
    }
    root.style.setProperty('--bg', bg);
    root.style.setProperty('--panel', panel);
    root.style.setProperty('--line', line);
    root.style.setProperty('--accent', accent);
  }, [themeColor, isPremium]);

  const movePlayer = (i,dir) => setPlayers(ps=>{
    const a=[...ps];
    const j=i+dir;
    if(j<0||j>=a.length) return a;
    [a[i],a[j]]=[a[j],a[i]];
    return a;
  });

  const deletePlayer = (i) => {
    setPlayers(ps=>{
      const toDelete = ps[i];
      if(toDelete?.bot){ setAi('off'); }
      return ps.filter((_,ix)=>ix!==i);
    });
  };

  const addPlayer = () => setPlayers(ps=>[
    ...ps,
    {
      id:uid(),
      name:defaultNameFor(lang, ps.length+1),
      color:colors[ps.length%colors.length],
      bot:false
    }
  ]);

  /* ===== GAME STATE ===== */
  const [order,setOrder] = useState([]);
  const [scores,setScores] = useState([]);     // Classic
  const [darts,setDarts] = useState([]);       // aktuální 3 šipky
  const [currIdx,setCurrIdx] = useState(0);    // index do order[]
  const [mult,setMult] = useState(1);
  const [actions,setActions] = useState([]);   // undo stack
  const [thrown,setThrown] = useState([]);     // kolik šipek hodil hráč celkem
  const [lastTurn,setLastTurn] = useState([]); // součet posledního kola
  const [winner,setWinner] = useState(null);
  const [pendingWin,setPendingWin] = useState(null);

  const [cricket,setCricket] = useState(null);
  const [around,setAround] = useState(null);

  const currentPlayerIndex = order[currIdx] ?? 0;

  /* startGame => připraví stav podle módu */
  const startGame = () => {
    const baseOrder = players.map((_,i)=>i);
    const ord = randomOrder ? shuffle(baseOrder) : baseOrder;

    setOrder(ord);
    setCurrIdx(0);
    setActions([]);
    setWinner(null);
    setPendingWin(null);
    setMult(1);
    setDarts([]);

    if(mode==='classic'){
      const sc  = players.map(()=>startScore);
      const dartsCnt = players.map(()=>0);
      const last = players.map(()=>0);
      setScores(sc);
      setThrown(dartsCnt);
      setLastTurn(last);
      setCricket(null);
      setAround(null);
    } else if(mode==='cricket'){
      const init = players.map(() => ({
        marks:{20:0,19:0,18:0,17:0,16:0,15:0,bull:0},
        points:0
      }));
      setCricket(init);
      setAround(null);
      setScores([]);
      setThrown(players.map(()=>0));
      setLastTurn(players.map(()=>0));
    } else { // around
      const init = players.map(()=>({next:1}));
      setAround(init);
      setCricket(null);
      setScores([]);
      setThrown(players.map(()=>0));
      setLastTurn(players.map(()=>0));
    }

    // reset stavu reklamy
    setShowAd(false);
    setAdSecondsLeft(20);

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

  /* Classic – out pravidla */
  const anyOutSelected = outDouble || outTriple || outMaster;
  const isFinishAllowed = (m) => {
    if(!anyOutSelected) return true;
    if(m===2 && outDouble) return true;
    if(m===3 && outTriple) return true;
    if((m===2||m===3) && outMaster) return true;
    return false;
  };
  const isBustLeavingOne = (newScore) => (anyOutSelected ? newScore===1 : false);

  const playHitSound = () => {
    if(soundOn && hitAudioRef.current){
      try {
        hitAudioRef.current.currentTime = 0;
        hitAudioRef.current.play();
      } catch {}
    }
  };

  const pushAction = (payload) => setActions(st=>[...st, payload]);

  const isInvalidComboClassic = (v,m) => (m>1 && (v===0 || v===25 || v===50));

  /* ===== Classic commit ===== */
  const commitClassic = (value, mOverride) => {
    let v = value;
    let m = (mOverride ?? mult);

    // guard proti pádům při nekonzistenci order/scores
    const pIdx = currentPlayerIndex;
    if (pIdx == null || scores[pIdx] == null) return;

    if (isInvalidComboClassic(v, m)) return;
    if (v === 25 || v === 50) { m = 1; }

    const hit = v * m;
    const prev = scores[pIdx];
    const tentative = prev - hit;

    const resetMult = () => setMult(1);

    // bust
    if (tentative < 0 || isBustLeavingOne(tentative)) {
      speak(lang, t(lang, 'bust'), voiceOn);
      playHitSound();
      pushAction({
        type: 'bust',
        mode: 'classic',
        pIdx,
        prevScore: prev,
        dartsBefore: [...darts]
      });
      setDarts([]);
      setLastTurn(ls => ls.map((x, i) => i === pIdx ? 0 : x));
      resetMult();
      nextPlayer();
      return;
    }

    // přesná nula -> pokus o win
    if (tentative === 0) {
      if (isFinishAllowed(m)) {
        playHitSound();
        pushAction({
          type: 'dart',
          mode: 'classic',
          pIdx,
          prevScore: prev,
          newScore: tentative,
          hit: { v, m, score: hit }
        });

        setScores(sc => sc.map((x, i) => i === pIdx ? 0 : x));

        setDarts(prevD => {
          const nd = [...prevD, { v, m, score: hit }];
          const total = nd.reduce((s, a) => s + (a?.score || 0), 0);
          setThrown(th => th.map((x, i) => i === pIdx ? x + 1 : x));
          setLastTurn(ls => ls.map((x, i) => i === pIdx ? total : x));
          return nd;
        });

        if (!playThrough) {
          finalizeWin(pIdx);
          resetMult();
          return;
        } else {
          const dartsUsed = (darts?.length ?? 0) + 1;
          setPendingWin(prevBest => (
            !prevBest || dartsUsed < prevBest.dartsUsed
              ? { pIdx, dartsUsed }
              : prevBest
          ));
          resetMult();
          nextPlayer();
          return;
        }
      } else {
        // zakázané ukončení
        speak(lang, t(lang, 'bust'), voiceOn);
        pushAction({
          type: 'bust',
          mode: 'classic',
          pIdx,
          prevScore: prev,
          dartsBefore: [...darts]
        });
        setDarts([]);
        setLastTurn(ls => ls.map((x, i) => i === pIdx ? 0 : x));
        resetMult();
        nextPlayer();
        return;
      }
    }

    // normální hod
    playHitSound();
    pushAction({
      type: 'dart',
      mode: 'classic',
      pIdx,
      prevScore: prev,
      newScore: tentative,
      hit: { v, m, score: hit }
    });

    setScores(sc => sc.map((x, i) => i === pIdx ? tentative : x));

    setDarts(prevD => {
      const nd = [...prevD, { v, m, score: hit }];
      const total = nd.reduce((s, a) => s + (a?.score || 0), 0);

      setThrown(th => th.map((x, i) => i === pIdx ? x + 1 : x));
      setLastTurn(ls => ls.map((x, i) => i === pIdx ? total : x));

      if (nd.length >= 3) {
        speak(lang, total === 0 ? t(lang, 'zeroWord') : total, voiceOn);
        nextPlayer();
        return [];
      }
      return nd;
    });

    resetMult();
  };

  /* ===== Cricket commit ===== */
  const commitCricket = (value, mOverride) => {
    let v = value;
    let m = (mOverride ?? mult);

    if (!cricket || !Array.isArray(cricket)) return;
    const pIdx = currentPlayerIndex;
    if (pIdx == null || !cricket[pIdx]) return;

    if (v === 0) m = 1;
    if (v === 25) m = 1;
    if (![0,15,16,17,18,19,20,25].includes(v)) return;

    const prevState = deepClone(cricket);
    const st = deepClone(cricket);
    const me = st[pIdx];

    // MISS
    if (v === 0) {
      playHitSound();
      setThrown(th => th.map((x, i) => (i === pIdx ? x + 1 : x)));
      setDarts(cur => {
        const nd = [...cur, { v:0, m:1, score:0 }];
        if (nd.length >= 3) {
          nextPlayer();
          return [];
        }
        return nd;
      });
      setMult(1);
      return;
    }

    // trefený target
    const key = (v === 25 ? 'bull' : String(v));
    const before = me.marks?.[key] ?? 0;

    const add = Math.max(1, Math.min(3, m)); // bull i tak m=1
    const newMarks = Math.min(3, before + add);

    const overflow = Math.max(0, before + add - 3);

    const opponentsOpen = st.some(
      (pl, ix) => ix !== pIdx && (pl.marks?.[key] ?? 0) < 3
    );
    const pointsPerMark = v === 25 ? 25 : v;
    const gained = overflow > 0 && opponentsOpen ? overflow * pointsPerMark : 0;

    me.marks[key] = newMarks;
    if (gained > 0) {
      me.points = (me.points || 0) + gained;
    }

    setCricket(st);
    playHitSound();
    pushAction({
      type:'dart',
      mode:'cricket',
      pIdx,
      prev: prevState,
      delta:{ v, add }
    });

    setThrown(th => th.map((x, i) => (i === pIdx ? x + 1 : x)));
    setLastTurn(ls => ls.map((x, i) => (i === pIdx ? (x + gained) : x)));

    // výhra?
    const closedAll = Object.values(me.marks || {}).every(n => n >= 3);
    if (closedAll) {
      const myPts = me.points || 0;
      const lead = st.every(
        (pl, ix) => ix === pIdx || myPts >= (pl.points || 0)
      );
      if (lead) {
        finalizeWin(pIdx, { silentVoice:false });
        return;
      }
    }

    setDarts(cur => {
      const nd = [...cur, { v, m:add, score:gained }];
      if (nd.length >= 3) {
        nextPlayer();
        return [];
      }
      return nd;
    });
    setMult(1);
  };

  /* ===== Around commit ===== */
  const commitAround = (value, mOverride) => {
    let v = value;
    let m = (mOverride ?? mult);
    if(v===50) v=25; // bull = 25

    const pIdx = currentPlayerIndex;
    if (!around || !Array.isArray(around)) return;
    if (pIdx == null || !around[pIdx]) return;

    const st = deepClone(around);
    const me = st[pIdx];
    const target = me.next;

    let hit = false;
    if(target <= 20){
      if(v === target) hit = true;
    } else {
      if(v===25) hit = true;
    }

    setThrown(th => th.map((x,i)=> i===pIdx ? x+1 : x));

    if(hit){
      if(target < 20){
        me.next = target + 1;
      } else if(target === 20){
        me.next = 25; // bull
      } else if(target === 25){
        // výhra
        playHitSound();
        pushAction({type:'dart', mode:'around', pIdx, prev:around, hit:true});
        setAround(st);
        setDarts(cur=>{
          const nd=[...cur,{v, m, score:0}];
          return nd.length>=3 ? [] : nd;
        });
        setMult(1);
        finalizeWin(pIdx, { silentVoice:true });
        return;
      }
      playHitSound();
      pushAction({type:'dart', mode:'around', pIdx, prev:around, hit:true});
    } else {
      pushAction({type:'dart', mode:'around', pIdx, prev:around, hit:false});
    }

    setAround(st);
    setDarts(cur=>{
      const nd=[...cur,{v, m, score: hit?1:0}];
      if (nd.length >= 3) {
        nextPlayer();
        return [];
      }
      return nd;
    });

    setMult(1);
  };

  /* router commit */
  const commitDart = (value, mOverride) => {
    if(winner!=null) return;
    if(mode==='classic') return commitClassic(value, mOverride);
    if(mode==='cricket') return commitCricket(value, mOverride);
    return commitAround(value, mOverride);
  };

  /* výhra */
  const finalizeWin = (pIdx, opts={}) => {
    if(!opts.silentVoice){
      speak(lang, 'Vítěz!', voiceOn);
    }
    try{
      if(winAudioRef.current){
        winAudioRef.current.currentTime=0;
        winAudioRef.current.play();
      }
    }catch{}

    setWinner(pIdx);

    // FREE verze: po výhře zobrazíme interstitial + náš overlay s odpočtem
    if (!isPremium) {
      showInterstitialAd();      // AdMob interstitial
      setAdSecondsLeft(20);      // resetovat overlay countdown
      setShowAd(true);           // ukázat overlay
    }

    // ulož do historie
    try{
      const list = JSON.parse(localStorage.getItem('finishedGames')||'[]');
      list.unshift({
        ts: Date.now(),
        mode, startScore,
        outDouble,outTriple,outMaster,
        randomOrder, playThrough,
        players: players.map(p=>p.name),
        winner: players[pIdx]?.name || ''
      });
      localStorage.setItem('finishedGames', JSON.stringify(list.slice(0,100)));
    }catch{}
  };

  const nextPlayer = () => {
    setCurrIdx(i => {
      const next = (i+1) % order.length;
      if(mode==='classic' && next===0 && playThrough && pendingWin && winner==null){
        finalizeWin(pendingWin.pIdx);
        setPendingWin(null);
      }
      return next;
    });
    setDarts([]);
  };

  const undo = () => {
    if(winner!=null) return;
    setActions(st=>{
      if(st.length===0) return st;
      const last = st[st.length-1];

      if(last.mode==='classic'){
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
      } else if(last.mode==='cricket'){
        setCricket(last.prev);
        setThrown(th=>th.map((x,i)=> i===last.pIdx ? Math.max(0,x-1) : x));
        setDarts(ds=>{
          const d=[...ds];
          if(d.length>0) d.pop();
          return d;
        });
      } else if(last.mode==='around'){
        setAround(last.prev);
        setThrown(th=>th.map((x,i)=> i===last.pIdx ? Math.max(0,x-1) : x));
        setDarts(ds=>{
          const d=[...ds];
          if(d.length>0) d.pop();
          return d;
        });
      }

      return st.slice(0,-1);
    });
    setMult(1);
  };

  const averages = useMemo(()=>{
    if(mode!=='classic'){ return players.map(()=>0); }
    return players.map((_,i)=>{
      const thrownDarts = thrown[i] || 0;
      const done = startScore - (scores[i] ?? startScore);
      return thrownDarts>0 ? (done / thrownDarts) : 0;
    });
  },[players, thrown, scores, startScore, mode]);

  const cardRefs = useRef({});
  useEffect(()=>{
    const activeIdx = order[currIdx];
    const el = cardRefs.current[activeIdx];
    if(el && el.scrollIntoView){
      el.scrollIntoView({behavior:'smooth', block:'nearest', inline:'center'});
    }
  },[order, currIdx, mode]);

  /* ===== BOT TURN (AI) ===== */
  useEffect(()=>{
    const pIdx = order[currIdx];
    const p = players[pIdx];

    if(!p || !p.bot || winner!=null) return;

    const tables = {
      easy:   { miss:0.55, single:0.40, double:0.04, triple:0.01 },
      medium: { miss:0.18, single:0.58, double:0.16, triple:0.08 },
      hard:   { miss:0.09, single:0.50, double:0.24, triple:0.17 }
    };
    const tb = tables[p.level || 'easy'];

    let cancelled=false;

    const delays = [800, 1600, 2400];

    const rollMult = () => {
      const r = Math.random();
      if (r < tb.miss) return { m:1, miss:true };
      if (r < tb.miss + tb.triple) return { m:3, miss:false };
      if (r < tb.miss + tb.triple + tb.double) return { m:2, miss:false };
      return { m:1, miss:false };
    };

    const chooseTargetClassic = () => {
      const myScore = scores[pIdx];

      const finishAllowed = (m)=> {
        if(!anyOutSelected) return true;
        if(m===2 && outDouble) return true;
        if(m===3 && outTriple) return true;
        if((m===2||m===3) && outMaster) return true;
        return false;
      };

      const checkouts = [
        {v:20,m:2,need:40},{v:10,m:2,need:20},{v:12,m:2,need:24},{v:16,m:2,need:32},
        {v:8,m:2,need:16},{v:6,m:2,need:12},{v:4,m:2,need:8},{v:2,m:2,need:4}
      ];
      for(const co of checkouts){
        if(myScore===co.need && finishAllowed(co.m)) return co;
      }

      if(myScore <= 62){
        if(finishAllowed(2) && myScore%2===0){
          const d = Math.min(20, Math.max(2, (myScore/2)|0));
          return { v:d, m:2 };
        }
        const s = Math.min(20, Math.max(1, myScore-40));
        return { v:(s||1), m:1 };
      }

      if((p.level||'easy')==='easy'){
        if(Math.random() < tb.miss){
          return { v:0, m:1 };
        }
        return { v:20, m:1 };
      }

      return { v:20, m:3 };
    };

    const chooseTargetCricket = () => {
      const me = cricket?.[pIdx];
      if (!me) return { v:20, m:1 };

      const orderArr = [20,19,18,17,16,15,25];

      for(const v of orderArr){
        const key = v===25 ? 'bull' : String(v);
        const marks = me.marks?.[key] ?? 0;
        if(marks < 3){
          const {m, miss} = rollMult();
          const mAdj = (v===25 ? 1 : m); // bull jen single
          if(miss) return { v:0, m:1 };
          return { v, m:mAdj };
        }
      }

      const opponentsOpen = (v)=>{
        const key = v===25 ? 'bull' : String(v);
        return cricket?.some(
          (pl,ix)=> ix!==pIdx && (pl.marks?.[key]??0) < 3
        );
      };
      for(const v of orderArr){
        if(opponentsOpen(v)){
          const {m, miss} = rollMult();
          const mAdj = (v===25 ? 1 : m);
          if(miss) return { v:0, m:1 };
          return { v, m:mAdj };
        }
      }

      return { v:20, m:1 };
    };

    const chooseTargetAround = () => {
      const me = around?.[pIdx];
      const target = me?.next ?? 1;

      if(Math.random() < tb.miss){
        return { v:0, m:1 };
      }
      if(target <= 20) return { v:target, m:1 };
      return { v:25, m:1 };
    };

    const pickThrow = () => {
      if(mode==='classic') return chooseTargetClassic();
      if(mode==='cricket') return chooseTargetCricket();
      return chooseTargetAround();
    };

    const myIdx = pIdx;

    const throwOnce = (i) => {
      if(cancelled || winner!=null) return;
      if(order[currIdx] !== myIdx) return;

      let {v, m} = pickThrow();

      if(mode==='classic'){
        if((v===0 || v===25 || v===50) && m>1) m=1;
      } else if(mode==='cricket'){
        if(v===0) m=1;
        if(v===25) m=1;
      }

      setTimeout(()=>{
        if(cancelled || winner!=null) return;
        if(order[currIdx] !== myIdx) return;
        commitDart(v, m);

        if(i < 2){
          setTimeout(()=>{
            if(order[currIdx] === myIdx && winner==null){
              throwOnce(i+1);
            }
          }, 200);
        }
      }, delays[i]);
    };

    throwOnce(0);

    return ()=>{ cancelled=true; };

  },[
    currIdx, order, players, winner, mode, scores,
    cricket, around,
    outDouble, outTriple, outMaster, anyOutSelected
  ]);

  /* ===== reklama odpočet (overlay po výhře) ===== */
  useEffect(()=>{
    if(!showAd){
      if(adTimerRef.current){
        clearInterval(adTimerRef.current);
        adTimerRef.current=null;
      }
      return;
    }
    adTimerRef.current = setInterval(()=>{
      setAdSecondsLeft(s=>{
        if(s<=1){
          clearInterval(adTimerRef.current);
          adTimerRef.current=null;
          return 0;
        }
        return s-1;
      });
    },1000);

    return ()=>{
      if(adTimerRef.current){
        clearInterval(adTimerRef.current);
        adTimerRef.current=null;
      }
    };
  },[showAd]);

  const closeAdNow = () => {
    setShowAd(false);
  };

  /* ===== ULOŽ / CONTINUE ===== */
  const makeSnapshot = () => ({
    version:2, screen:'game',
    lang, soundOn, voiceOn,
    mode, startScore,
    outDouble,outTriple,outMaster,
    randomOrder,playThrough,ai,
    players, order, currIdx,
    scores, darts, mult, actions, thrown, lastTurn,
    winner, pendingWin,
    cricket, around,
    isPremium
  });

  const saveSnapshot = () => {
    try{
      const snap = makeSnapshot();
      localStorage.setItem('savedGame', JSON.stringify(snap));
    }catch{}
  };

  const continueSaved = () => {
    try{
      const s=JSON.parse(localStorage.getItem('savedGame')||'{}');
      if(!s || !s.order){
        showToast('Nic k pokračování');
        return;
      }
      setLang(s.lang||lang);
      setMode(s.mode||'classic');
      setStartScore(s.startScore||501);
      setPlayers(s.players||players);
      setOrder(s.order||[]);
      setCurrIdx(s.currIdx||0);
      setScores(s.scores||[]);
      setDarts(s.darts||[]);
      setMult(s.mult||1);
      setActions(s.actions||[]);
      setThrown(s.thrown||[]);
      setLastTurn(s.lastTurn||[]);
      setWinner(s.winner??null);
      setPendingWin(s.pendingWin??null);
      setCricket(s.cricket??null);
      setAround(s.around??null);
      setIsPremium(!!s.isPremium);

      setShowAd(false);
      setAdSecondsLeft(20);

      setScreen('game');
    }catch(e){
      console.error(e);
      showToast('Obnova selhala');
    }
  };

  // autosave při zavření / schování
  useEffect(()=>{
    const handler = () => {
      try{
        const snap = makeSnapshot();
        localStorage.setItem('savedGame', JSON.stringify(snap));
      }catch{}
    };
    window.addEventListener('pagehide', handler);
    document.addEventListener('visibilitychange', ()=>{
      if(document.hidden) handler();
    });
    return ()=>{
      window.removeEventListener('pagehide', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const hasSaved = !!localStorage.getItem('savedGame');

  /* ===== RENDER APP ===== */
  return (
    <ErrorBoundary>
      <div className="container" data-mode={mode}>

        {/* HEADER */}
        <div className="header" style={{flexWrap:'wrap'}}>
          {/* LEVÁ STRANA: logo + Premium badge */}
          <div
            className="left"
            style={{
              display:'flex',
              alignItems:'center',
              gap:'8px',
              minWidth:0,
              flexWrap:'wrap'
            }}
          >
            {screen === 'game' && (
              <button
                type="button"
                className="btn ghost"
                onClick={()=>{
                  saveSnapshot();
                  setScreen('lobby');
                }}
                title={t(lang,'back')}
                style={{flexShrink:0}}
              >
                ←
              </button>
            )}

            {/* logo + název aplikace */}
            <div
              className="logo"
              style={{
                display:'flex',
                alignItems:'center',
                gap:'8px',
                flexShrink:0,
                minWidth:0,
                fontWeight:900,
                whiteSpace:'nowrap'
              }}
            >
              <span className="dart"></span>
              <span style={{fontWeight:900,whiteSpace:'nowrap'}}>{t(lang,'app')}</span>
            </div>

            {/* badge Premium */}
            {isPremium && (
              <span
                style={{
                  fontSize:12,
                  fontWeight:800,
                  lineHeight:1.2,
                  background:'#0f1318',
                  border:'1px solid var(--accent)',
                  color:'var(--accent)',
                  padding:'4px 8px',
                  borderRadius:'999px',
                  flexShrink:0,
                  display:'inline-flex',
                  alignItems:'center',
                  justifyContent:'center'
                }}
              >
                Premium
              </span>
            )}
          </div>

          {/* PRAVÁ STRANA: zvuk / hlas / jazyk */}
          <div
            className="controls"
            style={{
              display:'flex',
              alignItems:'center',
              gap:'6px',
              flexShrink:0,
              flexWrap:'wrap'
            }}
          >
            <button
              type="button"
              className={`iconBtn ${!soundOn?'muted':''}`}
              onClick={()=>setSoundOn(v=>!v)}
              aria-label={t(lang,'sound')}
            >
              <IconSpeaker/>
            </button>

            <button
              type="button"
              className={`iconBtn ${!voiceOn?'muted':''}`}
              onClick={()=>setVoiceOn(v=>!v)}
              aria-label={t(lang,'voice')}
            >
              <span className="iconHead" aria-hidden="true"></span>
            </button>

            <select
              className="input"
              value={lang}
              onChange={e=>setLang(e.target.value)}
              style={{height:34}}
            >
              {['cs','en','de','es','nl','ru','zh'].map(code=>(
                <option key={code} value={code}>{LANG_LABEL[code]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ADS banner strip in lobby */}
        {screen === 'lobby' && !isPremium && (
          <div className="adstrip">
            <div className="adcard">Reklamní pauza</div>
            <div className="adcard">Podporuje vývoj hry</div>
            <div className="adcard">Díky ❤️</div>
          </div>
        )}

        {screen === 'lobby' ? (
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
            showToast={showToast}
            hasSaved={hasSaved}
            isPremium={isPremium} setIsPremium={setIsPremium}
            themeColor={themeColor} setThemeColor={setThemeColor}
          />
        ) : (
          <Game
            lang={lang} t={t}
            mode={mode}
            outDesc={(() => {
              if (mode !== 'classic') {
                return mode === 'cricket' ? 'Cricket' : 'Around the Clock';
              }
              const arr = [];
              if (outDouble) arr.push('Double-out');
              if (outTriple) arr.push('Triple-out');
              if (outMaster) arr.push('Master-out');
              if (arr.length === 0) return 'Any-out';
              return arr.join(' + ');
            })()}
            players={players} order={order} currIdx={currIdx}
            scores={scores} thrown={thrown} lastTurn={lastTurn}
            cricket={cricket} around={around}
            averages={averages}
            darts={darts} mult={mult} setMult={setMult}
            commitDart={commitDart} undo={undo}
            winner={winner}
            saveGame={() => {
              saveSnapshot();
              showToast('Uloženo');
            }}
            restartGame={restartGame}
            cardRefs={cardRefs}
            setScreen={(scr) => {
              if (scr === 'lobby') saveSnapshot();
              setScreen(scr);
            }}
          />
        )}

        <audio ref={hitAudioRef} src="/dart-hit.mp3" preload="auto" />
        <audio ref={winAudioRef} src="/tada-fanfare-a-6313.mp3" preload="auto" />

        {/* FULLSCREEN OVERLAY PO VÝHŘE */}
        {showAd && (
          <div
            style={{
              position:'fixed',
              inset:0,
              background:'rgba(0,0,0,0.9)',
              color:'#fff',
              zIndex:9998,
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
              justifyContent:'center',
              padding:'16px',
              textAlign:'center'
            }}
          >
            {/* obsah reklamní pauzy / upsell */}
            <div
              style={{
                background:'#111',
                border:'2px solid var(--accent)',
                borderRadius:'12px',
                width:'100%',
                maxWidth:'320px',
                minHeight:'180px',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                fontWeight:'900',
                fontSize:'20px',
                boxShadow:'0 20px 40px #000',
                textAlign:'center'
              }}
            >
              Reklamní pauza – děkujeme za podporu hry
            </div>

            <div style={{marginTop:'16px',fontSize:'14px',opacity:.8,fontWeight:600}}>
              Pokračovat za {adSecondsLeft}s
            </div>

            <button
              type="button"
              disabled={adSecondsLeft > 0}
              onClick={()=>{
                closeAdNow();
              }}
              style={{
                marginTop:'20px',
                minWidth:'160px',
                minHeight:'44px',
                borderRadius:'10px',
                fontWeight:'800',
                fontSize:'16px',
                background: adSecondsLeft > 0 ? '#444' : 'var(--accent)',
                border: '2px solid var(--line)',
                color:'#fff',
                opacity: adSecondsLeft > 0 ? 0.5 : 1,
                boxShadow: adSecondsLeft > 0 ? 'none' : '0 0 12px var(--accent)',
                cursor: adSecondsLeft > 0 ? 'default' : 'pointer'
              }}
            >
              Pokračovat
            </button>

            {!isPremium && (
              <div
                style={{
                  marginTop:'16px',
                  fontSize:'12px',
                  lineHeight:1.4,
                  maxWidth:'260px',
                  opacity:.8
                }}
              >
                Žádné pauzy a vlastní vzhled?
                <br/>
                Odemkni Premium.
              </div>
            )}
          </div>
        )}

        {toast && <div className="toast ok">✔️ {toast}</div>}
      </div>
    </ErrorBoundary>
  );
} // konec App komponenty

/* ===== LOBBY ===== */
function Lobby({
  lang,t,
  mode,setMode,
  startScore,setStartScore,
  outDouble,setOutDouble,
  outTriple,setOutTriple,
  outMaster,setOutMaster,
  randomOrder,setRandomOrder,
  playThrough,setPlayThrough,
  ai,setAi,
  players,setPlayers,
  addPlayer,deletePlayer,movePlayer,
  startGame, continueSaved,
  showToast,
  hasSaved,
  isPremium, setIsPremium,
  themeColor, setThemeColor
}){
  return (
    <div className="lobbyWrap">

      {/* Režim */}
      <div className="lobbyCard">
        <div className="lobbyControls">
          <span>{t(lang,'mode')}</span>
          <select
            className="input"
            value={mode}
            onChange={e=>setMode(e.target.value)}
            style={{height:34}}
          >
            <option value="classic">{t(lang,'classic')}</option>
            <option value="cricket">{t(lang,'cricket')}</option>
            <option value="around">{t(lang,'around')}</option>
          </select>
        </div>
      </div>

      {/* StartScore jen pro Classic */}
      {mode==='classic' && (
        <div className="lobbyCard">
          <div className="lobbyControls">
            <span>{t(lang,'start')}</span>
            {[101,301,501,701,901].map(s=>(
              <button
                type="button"
                key={s}
                className={`tab ${startScore===s?'active':''}`}
                style={{padding:'4px 8px',lineHeight:1.1}}
                onClick={()=>setStartScore(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Out pravidla pro Classic */}
      {mode==='classic' && (
        <div className="lobbyCard">
          <div className="lobbyControls">
            <span>{t(lang,'closing')}</span>

            <label className={`tab ${outDouble?'active':''}`}>
              <input
                type="checkbox"
                checked={outDouble}
                onChange={e=>setOutDouble(e.target.checked)}
                style={{marginRight:6}}
              />
              {t(lang,'doubleOut')}
            </label>

            <label className={`tab ${outTriple?'active':''}`}>
              <input
                type="checkbox"
                checked={outTriple}
                onChange={e=>setOutTriple(e.target.checked)}
                style={{marginRight:6}}
              />
              {t(lang,'tripleOut')}
            </label>

            <label className={`tab ${outMaster?'active':''}`}>
              <input
                type="checkbox"
                checked={outMaster}
                onChange={e=>setOutMaster(e.target.checked)}
                style={{marginRight:6}}
              />
              {t(lang,'masterOut')}
            </label>

            <div style={{opacity:.8,fontSize:12}}>
              {t(lang,'anyOutHint')}
            </div>
          </div>
        </div>
      )}

      {/* Pořadí & Robot */}
      <div className="lobbyCard">
        <div
          className="lobbyControls"
          style={{
            flexWrap:'wrap',
            justifyContent:'space-between',
            rowGap:'8px',
            columnGap:'12px',
            width:'100%'
          }}
        >

          {/* část Pořadí / Dohrávat */}
          <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8}}>
            <span>{t(lang,'order')}</span>

            <select
              className="input"
              value={randomOrder ? 'random' : 'fixed'}
              onChange={e=>setRandomOrder(e.target.value==='random')}
              style={{height:34}}
            >
              <option value="fixed">{t(lang,'fixed')}</option>
              <option value="random">{t(lang,'random')}</option>
            </select>

            {mode==='classic' && (
              <label
                style={{
                  display:'inline-flex',
                  alignItems:'center',
                  gap:8
                }}
              >
                <input
                  type="checkbox"
                  checked={playThrough}
                  onChange={e=>setPlayThrough(e.target.checked)}
                />
                {t(lang,'playThrough')}
              </label>
            )}
          </div>

          {/* blok Robot */}
          <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',gap:8}}>
            <span>{t(lang,'robot')}</span>
            <select
              className="input"
              value={ai}
              onChange={e=>setAi(e.target.value)}
              style={{height:34}}
            >
              <option value="off">{t(lang,'off')}</option>
              <option value="easy">{t(lang,'easy')}</option>
              <option value="medium">{t(lang,'medium')}</option>
              <option value="hard">{t(lang,'hard')}</option>
            </select>
          </div>

        </div>
      </div>

      {/* Premium + vzhled */}
      <div className="lobbyCard">
        <div
          style={{
            display:'flex',
            flexWrap:'wrap',
            alignItems:'center',
            justifyContent:'space-between',
            gap:'8px',
            marginBottom:8
          }}
        >
          <span
            style={{
              fontWeight:800,
              fontSize:14,
              color:'#fff',
              lineHeight:1.2
            }}
          >
            Premium režim
          </span>

          <button
            type="button"
            className="btn"
            onClick={()=>{
              setIsPremium(prev=>{
                const next = !prev;
                try{
                  const raw = localStorage.getItem('lobby');
                  const parsed = raw ? JSON.parse(raw) : {};
                  parsed.isPremium = next;
                  localStorage.setItem('lobby', JSON.stringify(parsed));
                }catch{}
                return next;
              });
            }}
            style={{
              minWidth:90,
              fontWeight:800,
              borderColor:'var(--accent)',
              boxShadow: isPremium ? '0 0 6px var(--accent)' : 'none'
            }}
          >
            {isPremium ? 'Premium' : 'Free'}
          </button>
        </div>

        {isPremium && (
          <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
            <div
              style={{
                fontSize:12,
                color:'#fff',
                opacity:.8,
                fontWeight:600
              }}
            >
              Vzhled aplikace:
            </div>

            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>

              {/* ČERNÝ */}
              <button
                type="button"
                onClick={()=>{
                  setThemeColor('black');
                }}
                style={{
                  width:24,
                  height:24,
                  borderRadius:4,
                  border:'2px solid #fff',
                  background:'#0e0e0e',
                  cursor:'pointer',
                  boxShadow: themeColor==='black' ? '0 0 6px #fff' : 'none'
                }}
                title="černá"
              />

              {/* ZELENÝ */}
              <button
                type="button"
                onClick={()=>{
                  setThemeColor('green');
                }}
                style={{
                  width:24,
                  height:24,
                  borderRadius:4,
                  border:'2px solid #14532d',
                  background:'#16a34a',
                  cursor:'pointer',
                  boxShadow: themeColor==='green' ? '0 0 6px #fff' : 'none'
                }}
                title="zelená"
              />

              {/* MODRÝ */}
              <button
                type="button"
                onClick={()=>{
                  setThemeColor('blue');
                }}
                style={{
                  width:24,
                  height:24,
                  borderRadius:4,
                  border:'2px solid #1e3a8a',
                  background:'#3b82f6',
                  cursor:'pointer',
                  boxShadow: themeColor==='blue' ? '0 0 6px #fff' : 'none'
                }}
                title="modrá"
              />

              {/* ČERVENÝ */}
              <button
                type="button"
                onClick={()=>{
                  setThemeColor('red');
                }}
                style={{
                  width:24,
                  height:24,
                  borderRadius:4,
                  border:'2px solid #7f1d1d',
                  background:'#ef4444',
                  cursor:'pointer',
                  boxShadow: themeColor==='red' ? '0 0 6px #fff' : 'none'
                }}
                title="červená"
              />

              {/* FIALOVÝ */}
              <button
                type="button"
                onClick={()=>{
                  setThemeColor('purple');
                }}
                style={{
                  width:24,
                  height:24,
                  borderRadius:4,
                  border:'2px solid #4c1d95',
                  background:'#8b5cf6',
                  cursor:'pointer',
                  boxShadow: themeColor==='purple' ? '0 0 6px #fff' : 'none'
                }}
                title="fialová"
              />
            </div>
          </div>
        )}
      </div>

      {/* Start & Pokračovat */}
      <div className="lobbyCard">
        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
          <button
            type="button"
            className="btn green"
            onClick={startGame}
          >
            {t(lang,'startGame')}
          </button>

          {hasSaved && (
            <button
              type="button"
              className="btn"
              onClick={continueSaved}
            >
              {t(lang,'continueGame')}
            </button>
          )}
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
              <button
                type="button"
                className="btn ghost"
                onClick={()=>movePlayer(i,-1)}
                title="Up"
                style={{padding:'4px 8px',lineHeight:1.1}}
              >
                ↑
              </button>
              <button
                type="button"
                className="btn ghost"
                onClick={()=>movePlayer(i,1)}
                title="Down"
                style={{padding:'4px 8px',lineHeight:1.1}}
              >
                ↓
              </button>
            </div>

            <div>
              <span className="score">
                {mode==='classic'
                  ? startScore
                  : (mode==='cricket'
                      ? t(lang,'points')
                      : `${t(lang,'target')}`)}
              </span>
            </div>

            <div className="playerDelete">
              <button
                type="button"
                className="trash"
                onClick={()=>deletePlayer(i)}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className="btn"
          onClick={addPlayer}
        >
          + {t(lang,'addPlayer')}
        </button>
      </div>

      {/* Pravidla */}
      <div className="lobbyCard">
        <details>
          <summary className="btn ghost">📖 {t(lang,'rules')}</summary>
          <dl className="rules">
            <dt>{t(lang,'classic')}</dt>
            <dd>
              Single = ×1, Double = ×2, Triple = ×3, Bull 25/50.
              Cíl: přesně na 0.
              <em> Double-out, Triple-out, Master-out</em>.
              {t(lang,'anyOutHint')}.
              Přestřelení nebo zbyde 1 (pokud je aktivní některé out pravidlo)
              = {t(lang,'bust')}.
            </dd>

            <dt>{t(lang,'cricket')}</dt>
            <dd>
              Hraje se čísly 15–20 a 25.
              Každý zásah: Single=1 značka „/“, Double=2 (✕), Triple=3 (Ⓧ).
              Po 3 značkách je číslo zavřené.
              Přebytky dávají body, jen pokud soupeř(i) nemají číslo zavřené.
            </dd>

            <dt>{t(lang,'around')}</dt>
            <dd>
              Postupně 1→20→Bull (25).
              Počítá se zásah aktuálního cíle.
              Double/Triple se počítají jako zásah.
              Vyhrává ten, kdo první trefí Bull.
            </dd>
          </dl>
        </details>
      </div>

      {/* Uložené hry */}
      <SavedGames lang={lang} t={t} showToast={showToast}/>
    </div>
  );
}

/* ===== SAVED GAMES ===== */
function SavedGames({lang,t,showToast}){
  const [list,setList]=useState(()=>{
    try{return JSON.parse(localStorage.getItem('finishedGames')||'[]')}catch{return []}
  });

  const shareItem = async (it)=>{
    const text =
`${t(lang,'saved')}: ${new Date(it.ts).toLocaleString()} — ${it.mode} ${it.startScore||''}
${it.players.join(', ')}
${t(lang,'youWinPrefix')}: ${it.winner}`;
    try{
      if(navigator.share){
        await navigator.share({text});
      } else {
        await navigator.clipboard.writeText(text);
        try{ showToast && showToast('Zkopírováno'); }catch{}
      }
    }catch{}
  };

  const clearAll = ()=>{
    try{
      localStorage.removeItem('finishedGames');
      setList([]);
      showToast && showToast('Vše smazáno');
    }catch{}
  };

  if(list.length===0){
    return (
      <div className="lobbyCard">
        <strong>{t(lang,'saved')}:</strong> —
      </div>
    );
  }

  return (
    <div className="lobbyCard">
      <div style={{
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center',
        marginBottom:6
      }}>
        <strong>{t(lang,'saved')}</strong>
        <button
          type="button"
          className="btn"
          onClick={clearAll}
        >
          {t(lang,'clear')}
        </button>
      </div>

      <div className="savedList">
        {list.map((it,idx)=>(
          <div key={idx} className="savedRow">
            <div>
              <div className="savedTitle">
                {new Date(it.ts).toLocaleString()}
              </div>
              <div className="savedSub">
                {`${it.mode} ${it.startScore || ''} • ${it.players.join(', ')}`}
              </div>
              <div className="savedSub">
                {t(lang,'youWinPrefix')}: {it.winner}
              </div>
            </div>
            <button
              type="button"
              className="btn"
              onClick={()=>shareItem(it)}
            >
              {t(lang,'share')}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===== GAME SCREEN ===== */
function Game({
  lang,t,mode,outDesc,
  players, order, currIdx,
  scores, averages, thrown, lastTurn,
  cricket, around,
  darts, mult, setMult, commitDart, undo, winner,
  saveGame, restartGame, cardRefs, setScreen
}){

  // keypad layout
  const keypad = React.useMemo(()=>{
    if(mode==='cricket'){
      return [
        [15,16,17,18,19,20,25],
        [0]
      ];
    }
    if(mode==='around'){
      return [
        [1,2,3,4,5,6,7],
        [8,9,10,11,12,13,14],
        [15,16,17,18,19,20,25],
        [0]
      ];
    }
    // classic
    return [
      [1,2,3,4,5,6,7],
      [8,9,10,11,12,13,14],
      [15,16,17,18,19,20,25],
      [0,50]
    ];
  },[mode]);

  const cricketTargets = ['15','16','17','18','19','20','bull'];

  return (
    <div className="gameWrap">
      {/* horní lišta */}
      <div className="gameTopBar">
        <span className="badge">
          {mode==='classic'
            ? `${t(lang,'outLabel')}: ${outDesc}`
            : outDesc}
        </span>
        <div className="gameTopBtns">
          <button
            type="button"
            className="btn"
            onClick={restartGame}
          >
            {t(lang,'restart')}
          </button>
          <button
            type="button"
            className="btn"
            onClick={saveGame}
          >
            {t(lang,'saveGame')}
          </button>
          <button
            type="button"
            className="btn ghost"
            onClick={()=>{
              saveGame();
              setScreen('lobby');
            }}
          >
            {t(lang,'back')}
          </button>
        </div>
      </div>

      {/* scoreboard */}
      {mode!=='cricket' ? (
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
                      {Array.from({length:12}).map((_,k)=>
                        <span key={k} style={{'--k':k}} />
                      )}
                    </div>
                    <div className="confetti" aria-hidden="true">
                      {Array.from({length:50}).map((_,k)=>
                        <span key={k} style={{'--i':k}}/>
                      )}
                    </div>
                  </>
                )}

                <div className="playerHeader">
                  <div className="playerNameText">{p.name}</div>

                  {mode==='classic' ? (
                    <div className="playerStats">
                      <span>{(thrown[pIdx]||0)} {t(lang,'darts')}</span>
                      <span>•</span>
                      <span>{t(lang,'avg')}: {formatAvg(averages[pIdx])}</span>
                    </div>
                  ) : (
                    <div className="playerStats">
                      <span>
                        {t(lang,'target')}: {around?.[pIdx]?.next ?? 1}
                      </span>
                    </div>
                  )}
                </div>

                {mode==='classic' ? (
                  <>
                    <div className="playerScore">
                      {scores[pIdx] ?? 0}
                    </div>
                    <div className="playerTurn">
                      {[0,1,2].map(ix=>{
                        const d = currentDarts[ix];
                        return (
                          <div key={ix} className="dartBox">
                            {d ? formatHit(d) : '-'}
                          </div>
                        );
                      })}
                      <div className="lastTotal">
                        {t(lang,'last')}: {lastTurn[pIdx]||0}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="playerTurn">
                      <div className="dartBox targetBox">
                        {around?.[pIdx]?.next ?? 1}
                      </div>
                      {[0,1,2].map(ix=>{
                        const d = currentDarts[ix];
                        return (
                          <div key={ix} className="dartBox">
                            {d
                              ? (d.score
                                  ? '✓'
                                  : (d.v===0 ? '0' : '-'))
                              : '-'}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* CRICKET layout */
        <div className="cricketWrap">
          <div className="targetsRail">
            <div className="targetsRailHead"></div>
            <div className="targetsRailMarks">
              {cricketTargets.map(k=>{
                const lbl = k==='bull' ? '25' : k;
                return (
                  <div key={k} className="targetCell">
                    {lbl}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="cricketScroll">
            {order.map((pIdx,i)=>{
              const p=players[pIdx];
              const active = i===currIdx && winner==null;
              return (
                <div
                  key={p.id}
                  ref={node=>{ if(node) cardRefs.current[pIdx]=node; }}
                  className={`playerCol ${active?'active':''} ${winner===pIdx?'winner':''}`}
                >
                  <div className="playerColHead">
                    <div className="playerColName">{p.name}</div>
                    <div className="playerColPts">
                      {cricket?.[pIdx]?.points ?? 0}
                    </div>
                  </div>

                  <div className="playerColMarks">
                    {cricketTargets.map(k=>{
                      const mk = cricket?.[pIdx]?.marks?.[k] ?? 0;
                      return (
                        <div
                          key={k}
                          className={`markCell ${mk>=3?'closed':''}`}
                        >
                          {markSymbol(mk)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PAD / KEYPAD - schovám po výhře */}
      {winner==null && (
        <div className="padPane">
          {/* první řádek: DOUBLE / TRIPLE / undo */}
          <div className="padRow">
            <button
              type="button"
              className={`multBtn mult-2 ${mult===2 ? 'active' : ''}`}
              onClick={() => setMult(m => (m === 2 ? 1 : 2))}
            >
              DOUBLE
            </button>

            <button
              type="button"
              className={`multBtn mult-3 ${mult===3 ? 'active' : ''}`}
              onClick={() => setMult(m => (m === 3 ? 1 : 3))}
            >
              TRIPLE
            </button>

            <button
              type="button"
              className="multBtn backspace"
              onClick={undo}
              title={t(lang,'undo')}
              aria-label={t(lang,'undo')}
            >
              <svg
                viewBox="0 0 24 24"
                className="iconBackspace"
                aria-hidden="true"
              >
                <path
                  d="M7 5L3 12l4 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 9l4 4m0-4-4 4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* čísla */}
          {keypad.map((row, ri) => (
            <div key={`row-${ri}`} className="padRow">
              {row.map(n => (
                <button
                  type="button"
                  key={n}
                  className="key"
                  onPointerDown={e => {
                    e.currentTarget.classList.add('pressed');

                    // Cricket speciály:
                    if (mode === 'cricket') {
                      if (n === 0) {
                        setMult(1);
                        commitDart(0, 1);
                        return;
                      }
                      if (n === 25) {
                        setMult(1);
                        commitDart(25, 1);
                        return;
                      }
                    }

                    commitDart(n);
                  }}
                  onPointerUp={e => {
                    e.currentTarget.classList.remove('pressed');
                  }}
                  onPointerLeave={e => {
                    e.currentTarget.classList.remove('pressed');
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
