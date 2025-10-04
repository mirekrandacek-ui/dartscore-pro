import React, { useEffect, useRef, useState } from 'react'
import './app.css'
import Keypad from './ui/Keypad.jsx'
import { RULES } from './rules'
import { botThrow } from './bots'
import { aggregate, saveGame } from './stats'

function uid(){ return Math.random().toString(36).slice(2,9) }
const colors=['#16a34a','#3b82f6','#ef4444','#14b8a6','#8b5cf6','#e11d48','#f59e0b','#22c55e']

/* === i18n slovník === */
const I18N={
  cs:{mode:'Režim',x01:'X01 (301/501)',cricket:'Cricket',around:'Around the Clock',shanghai:'Shanghai',
      start:'Start',closing:'Ukončení',single:'Single',double:'Double',triple:'Triple',master:'Master',
      order:'Pořadí',random:'Náhodné',fixed:'Fixní',robot:'Robot',off:'Vypn.',easy:'Snadná',medium:'Střední',hard:'Těžká',
      startGame:'▶ Start hry',rules:'Pravidla her',lastThrow:'Poslední hod',avg:'Ø/šipka',sound:'Zvuk',voice:'Hlas',
      noScore:'bez skóre'},
  en:{mode:'Mode',x01:'X01 (301/501)',cricket:'Cricket',around:'Around the Clock',shanghai:'Shanghai',
      start:'Start',closing:'Finish',single:'Single',double:'Double',triple:'Triple',master:'Master',
      order:'Order',random:'Random',fixed:'Fixed',robot:'Bot',off:'Off',easy:'Easy',medium:'Medium',hard:'Hard',
      startGame:'▶ Start Game',rules:'Rules',lastThrow:'Last throw',avg:'Ø/dart',sound:'Sound',voice:'Voice',
      noScore:'no score'},
  de:{mode:'Modus',x01:'X01 (301/501)',cricket:'Cricket',around:'Around the Clock',shanghai:'Shanghai',
      start:'Start',closing:'Finish',single:'Single',double:'Double',triple:'Triple',master:'Master',
      order:'Reihenfolge',random:'Zufällig',fixed:'Fix',robot:'Bot',off:'Aus',easy:'Leicht',medium:'Mittel',hard:'Schwer',
      startGame:'▶ Spiel starten',rules:'Regeln',lastThrow:'Letzter Wurf',avg:'Ø/Pfeil',sound:'Ton',voice:'Stimme',
      noScore:'kein Score'},
  ru:{mode:'Режим',x01:'X01 (301/501)',cricket:'Крикет',around:'По кругу',shanghai:'Шанхай',
      start:'Старт',closing:'Финиш',single:'Сингл',double:'Дабл',triple:'Трипл',master:'Мастер',
      order:'Порядок',random:'Случайно',fixed:'Фикс',robot:'Бот',off:'Выкл',easy:'Лёгкий',medium:'Средний',hard:'Сложный',
      startGame:'▶ Начать игру',rules:'Правила',lastThrow:'Последний бросок',avg:'Ø/дротик',sound:'Звук',voice:'Голос',
      noScore:'без очков'},
  nl:{mode:'Modus',x01:'X01 (301/501)',cricket:'Cricket',around:'Rondje',shanghai:'Shanghai',
      start:'Start',closing:'Finish',single:'Single',double:'Double',triple:'Triple',master:'Master',
      order:'Volgorde',random:'Willekeurig',fixed:'Vast',robot:'Bot',off:'Uit',easy:'Makkelijk',medium:'Gemiddeld',hard:'Moeilijk',
      startGame:'▶ Start spel',rules:'Regels',lastThrow:'Laatste worp',avg:'Ø/pijl',sound:'Geluid',voice:'Stem',
      noScore:'geen score'},
  es:{mode:'Modo',x01:'X01 (301/501)',cricket:'Cricket',around:'Alrededor',shanghai:'Shanghái',
      start:'Inicio',closing:'Cierre',single:'Single',double:'Doble',triple:'Triple',master:'Master',
      order:'Orden',random:'Aleatorio',fixed:'Fijo',robot:'Bot',off:'Off',easy:'Fácil',medium:'Medio',hard:'Difícil',
      startGame:'▶ Iniciar',rules:'Reglas',lastThrow:'Último tiro',avg:'Ø/dardo',sound:'Sonido',voice:'Voz',
      noScore:'sin puntuación'}
}
const LANGS=[{code:'cs',label:'Čeština'},{code:'en',label:'English'},{code:'de',label:'Deutsch'},{code:'ru',label:'Русский'},{code:'nl',label:'Nederlands'},{code:'es',label:'Español'}]
const t=(lang,key)=> (I18N[lang]&&I18N[lang][key]) || I18N.cs[key] || key

export default function App(){
  const [screen,setScreen]=useState('lobby')
  const [mode,setMode]=useState('x01')
  const [startScore,setStartScore]=useState(501)
  const [outMode,setOutMode]=useState('double')
  const [lang,setLang]=useState(((navigator.language||'cs').slice(0,2))||'cs')
  const [soundOn,setSoundOn]=useState(true)
  const [voiceOn,setVoiceOn]=useState(true)
  const [ai,setAi]=useState('off')
  const [randomOrder,setRandomOrder]=useState(false)

  const [players,setPlayers]=useState([
    {id:uid(),name:'Mirek',color:colors[1],remaining:startScore,darts:[],last:0},
    {id:uid(),name:'Pepa', color:colors[0],remaining:startScore,darts:[],last:0},
  ])
  const [current,setCurrent]=useState(0)
  const [buffer,setBuffer]=useState([])          // skutečné body (např. 60 u T20)
  const [bufferShown,setBufferShown]=useState([]) // co zobrazit ve slotech (taky body)
  const [history,setHistory]=useState([])
  const [mult,setMult]=useState(1)
  const [showWin,setShowWin]=useState(false)

  // fix výšky viewportu na mobilech
  useEffect(()=>{
    const setVh=()=>{ document.documentElement.style.setProperty('--vh', `${window.innerHeight*0.01}px`) }
    setVh(); window.addEventListener('resize',setVh); return ()=>window.removeEventListener('resize',setVh)
  },[])

  // audio
  const hitRef=useRef(null), fanfareRef=useRef(null)
  useEffect(()=>{ const a=new Audio('/dart-hit.mp3'); a.preload='auto'; a.oncanplay=()=>hitRef.current=a; a.onerror=()=>hitRef.current='fallback'; a.load();
                  const f=new Audio('https://cdn.jsdelivr.net/gh/napars/dummy-audio/fanfare.mp3'); fanfareRef.current=f;},[])
  const vibrate=(ms=20)=>{ if(navigator.vibrate) try{navigator.vibrate(ms)}catch{} }
  const playHit=()=>{ if(!soundOn) return; const r=hitRef.current; if(r&&r.play){ r.currentTime=0; r.play().catch(()=>{}) } }
  const speak=(txt)=>{ if(!voiceOn || !('speechSynthesis'in window)) return; const u=new SpeechSynthesisUtterance(txt); u.lang=lang; u.rate=1.05; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u) }

  // lobby sync
  useEffect(()=>{ if(screen==='lobby'){ setPlayers(ps=>ps.map(p=>({...p,remaining:startScore,darts:[],last:0}))) } },[startScore,screen])
  const sum=a=>a.reduce((s,x)=>s+x,0)

  const ensureRobot=(lvl)=>{
    const name=`Robot (${t(lang,lvl)})`
    setPlayers(ps=>{
      const i=ps.findIndex(p=>p.name.startsWith('Robot'))
      if(i>=0) return ps.map((p,ix)=>ix===i?{...p,name}:p)
      return [...ps,{id:uid(),name,color:'#888',remaining:startScore,darts:[],last:0}]
    })
  }

  const canClose=(remainBefore,value,notation)=>{
    const after=remainBefore-value
    if(after!==0) return false
    if(outMode==='single') return true
    if(outMode==='double') return notation?.startsWith('D') || value===50
    if(outMode==='triple') return notation?.startsWith('T')
    if(outMode==='master') return notation?.startsWith('D') || notation?.startsWith('T') || value===50
    return true
  }

  function startGame(){
    let order=[...players]; if(randomOrder) order.sort(()=>Math.random()-0.5)
    setPlayers(order.map(p=>({...p,remaining:startScore,darts:[],last:0})))
    setBuffer([]); setBufferShown([]); setHistory([]); setCurrent(0); setScreen('game')
    if(ai!=='off') ensureRobot(ai)
  }

  function onNumber(n){
    const val=(n===25? (mult===1?25:50) : n*mult)   // reálné body
    const notation=(mult===1?'S':mult===2?'D':'T')+n
    enter(notation,val,val) // mluv i zobrazuj skutečné body (např. 60)
  }
  const onMiss=()=>enter('0',0,0)
  const onDouble=()=>{ setMult(2); setTimeout(()=>setMult(1),650) }
  const onTriple=()=>{ setMult(3); setTimeout(()=>setMult(1),650) }

  function enter(notation,value,spokenVal){
    const p=players[current]
    const subtotal=sum(buffer)
    const remainBefore=p.remaining - subtotal

    playHit(); vibrate()
    speak(String(spokenVal))

    if(remainBefore - value < 0){
      speak(t(lang,'noScore'))
      setHistory(h=>[...h,{player:p.name,darts:[...buffer,value],total:0,bust:true,remaining:p.remaining}])
      setBuffer([]); setBufferShown([]); return next()
    }

    if(canClose(remainBefore,value,notation)){
      const newBuffer=[...buffer,value]; const total=sum(newBuffer)
      setPlayers(ps=>ps.map((x,i)=> i===current ? {...x,remaining:0,darts:[...x.darts,...newBuffer],last:total} : x))
      setHistory(h=>[...h,{player:p.name,darts:newBuffer,total,remaining:0}])
      setBuffer([]); setBufferShown([])
      try{fanfareRef.current?.play?.()}catch{}; setShowWin(true); setTimeout(()=>setShowWin(false),800)
      saveGame({mode:`x01-${outMode}`,ppd:total/3,darts:newBuffer.length})
      return setTimeout(()=> setCurrent((current+1)%players.length),260)
    }

    const nb=[...buffer,value], ns=[...bufferShown, spokenVal]
    setBuffer(nb); setBufferShown(ns)
    if(nb.length>=3){
      const total=sum(nb), newRemain=p.remaining - total
      speak(String(total))
      setPlayers(ps=>ps.map((x,i)=> i===current ? {...x,remaining:newRemain,darts:[...x.darts,...nb],last:total} : x))
      setHistory(h=>[...h,{player:p.name,darts:nb,total,remaining:newRemain}])
      setBuffer([]); setBufferShown([]); next()
    }
  }

  function next(){
    const idx=(current+1)%players.length; setCurrent(idx)
    const ridx=players.findIndex(p=>p.name.startsWith('Robot'))
    if(ai!=='off' && ridx>-1 && idx===ridx){
      setTimeout(()=>{ for(let i=0;i<3;i++){ const t=botThrow(ai,20); setTimeout(()=>enter(t.notation,t.value,t.value),i*150)} },180)
    }
  }

  function undo(){
    if(buffer.length>0){ setBuffer(b=>b.slice(0,-1)); setBufferShown(b=>b.slice(0,-1)); return }
    const last=history[history.length-1]; if(!last) return
    setHistory(h=>h.slice(0,-1))
    const idx=(current-1+players.length)%players.length; setCurrent(idx)
    setPlayers(ps=>ps.map((p,i)=> i===idx ? {...p,remaining:p.remaining + (last.total||0),darts:p.darts.slice(0,-(last.darts?.length||0)),last:0} : p))
  }

  function movePlayer(i,dir){
    setPlayers(ps=>{ const a=[...ps]; const j=i+dir; if(j<0||j>=a.length) return a; [a[i],a[j]]=[a[j],a[i]]; return a })
  }
  const deletePlayer=i=> setPlayers(ps=>ps.filter((_,ix)=>ix!==i))

  // průměr na šipku pro hráče (aktuální leg)
  const ppd = p => (p.darts.length ? (sum(p.darts)/p.darts.length) : 0)

  const Tab=({active,children,onClick})=>(<button className={'tab'+(active?' active':'')} onClick={onClick}>{children}</button>)

  return (
    <div className="container">
      {/* header */}
      <div className="header">
        <div className="left">
          {screen==='game' && <button className="btn ghost" onClick={()=>setScreen('lobby')} title="Zpět">←</button>}
          <div className="logo"><span className="dart"></span><span>DartScore Pro</span></div>
        </div>
        <div className="controls">
          <button className="btn ghost" onClick={()=>setSoundOn(v=>!v)} title={t(lang,'sound')}>{soundOn?'🔊':'🔈'}</button>
          <button className="btn ghost" onClick={()=>setVoiceOn(v=>!v)} title={t(lang,'voice')}>{voiceOn?'🗣️':'🤐'}</button>
          <select value={lang} onChange={e=>setLang(e.target.value)} className="input">
            {LANGS.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
      </div>

      {/* ads */}
      <div className="adstrip">
        <div className="adcard">AdMob (placeholder)</div>
        <div className="adcard">Ad</div><div className="adcard">Ad</div>
      </div>

      <div className="main">
        {screen==='lobby' ? (
          <div className="panel">
            {/* výběr hry */}
            <div className="card">
              <div className="controls" style={{flexWrap:'wrap'}}>
                <span>{t(lang,'mode')}</span>
                <select className="input" value={mode} onChange={e=>setMode(e.target.value)}>
                  <option value="x01">{t(lang,'x01')}</option>
                  <option value="cricket">{t(lang,'cricket')}</option>
                  <option value="around">{t(lang,'around')}</option>
                  <option value="shanghai">{t(lang,'shanghai')}</option>
                </select>

                {mode==='x01' && <>
                  <span style={{marginLeft:8}}>{t(lang,'start')}</span>
                  <Tab active={startScore===301} onClick={()=>setStartScore(301)}>301</Tab>
                  <Tab active={startScore===501} onClick={()=>setStartScore(501)}>501</Tab>

                  <span style={{marginLeft:8}}>{t(lang,'closing')}</span>
                  <Tab active={outMode==='single'} onClick={()=>setOutMode('single')}>{t(lang,'single')}</Tab>
                  <Tab active={outMode==='double'} onClick={()=>setOutMode('double')}>{t(lang,'double')}</Tab>
                  <Tab active={outMode==='triple'} onClick={()=>setOutMode('triple')}>{t(lang,'triple')}</Tab>
                  <Tab active={outMode==='master'} onClick={()=>setOutMode('master')}>{t(lang,'master')}</Tab>
                </>}

                <span style={{marginLeft:8}}>{t(lang,'order')}</span>
                <Tab active={randomOrder} onClick={()=>setRandomOrder(!randomOrder)}>{randomOrder?t(lang,'random'):t(lang,'fixed')}</Tab>

                <span style={{marginLeft:8}}>{t(lang,'robot')}</span>
                <select className="input" value={ai} onChange={e=>{ setAi(e.target.value); if(e.target.value!=='off') ensureRobot(e.target.value) }}>
                  <option value="off">{t(lang,'off')}</option>
                  <option value="easy">{t(lang,'easy')}</option>
                  <option value="medium">{t(lang,'medium')}</option>
                  <option value="hard">{t(lang,'hard')}</option>
                </select>
              </div>
            </div>

            {/* hráči */}
            <div className="card">
              {players.map((p,i)=>(
                <div key={p.id} className="playerRow">
                  <div className="playerName"><input className="input" value={p.name} onChange={e=>setPlayers(ps=>ps.map((x,ix)=>ix===i?{...x,name:e.target.value}:x))}/></div>
                  <div className="controls">
                    <button className="btn ghost" onClick={()=>movePlayer(i,-1)}>↑</button>
                    <button className="btn ghost" onClick={()=>movePlayer(i,1)}>↓</button>
                    <button className="btn red" onClick={()=>deletePlayer(i)}>🗑️</button>
                  </div>
                  <div><span className="score">{p.remaining}</span></div>
                </div>
              ))}
              <button className="btn" onClick={()=>setPlayers(ps=>[...ps,{id:uid(),name:`Hráč ${ps.length+1}`,color:colors[ps.length%colors.length],remaining:startScore,darts:[],last:0}])}>+ Přidat hráče</button>
            </div>

            <div style={{display:'flex',justifyContent:'flex-end'}}>
              <button className="btn green" onClick={startGame}>{t(lang,'startGame')}</button>
            </div>

            <details className="card" style={{marginTop:6}}>
              <summary className="btn ghost">📖 {t(lang,'rules')}</summary>
              <dl className="rules">{RULES.map(r=>(<React.Fragment key={r.key}><dt>{r.name}</dt><dd>{r.text}</dd></React.Fragment>))}</dl>
            </details>
          </div>
        ) : (
          /* ===== GAME 50/50 layout ===== */
          <div className="gameSplit">
            <div className="gameTop">
              {players.map((p,idx)=>(
                <div key={p.id} className={'playerRow '+(idx===current?'active':'')}>
                  <div className="playerName">
                    <strong>{p.name}</strong>
                    {idx===current && (
                      <>
                        <div className="slots">
                          <div className="slot">{bufferShown[0] ?? ''}</div>
                          <div className="slot">{bufferShown[1] ?? ''}</div>
                          <div className="slot">{bufferShown[2] ?? ''}</div>
                        </div>
                        {buffer.length===3 && <div className="turnTotal">{sum(buffer)}</div>}
                      </>
                    )}
                    {idx!==current && p.last>0 && (
                      <div className="meta">{t(lang,'lastThrow')}: <strong>{p.last}</strong> • {t(lang,'avg')}: <strong>{ppd(p).toFixed(2)}</strong></div>
                    )}
                    {idx===current && p.darts.length>0 && (
                      <div className="meta">{t(lang,'avg')}: <strong>{ppd(p).toFixed(2)}</strong></div>
                    )}
                  </div>
                  <div className="controls">
                    {idx===current && <button className="btn" onClick={undo} title="Zpět">←</button>}
                  </div>
                  <div><span className="score">{p.remaining}</span></div>
                </div>
              ))}
            </div>

            <div className="gameBottom">
              <div className="keypadDock">
                <Keypad
                  onNumber={onNumber}
                  onMiss={onMiss}
                  onDouble={onDouble}
                  onTriple={onTriple}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {showWin && <div className="fireworks"></div>}
    </div>
  )
}
