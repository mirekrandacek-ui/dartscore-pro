import React, { useEffect, useRef, useState } from 'react'
import './app.css'
import Keypad from './ui/Keypad.jsx'
import { RULES } from './rules'
import { botThrow } from './bots'
import { aggregate, saveGame } from './stats'

function uid(){ return Math.random().toString(36).slice(2,9) }
const colors = ['#16a34a','#3b82f6','#ef4444','#14b8a6','#8b5cf6','#e11d48','#f59e0b','#22c55e']
const LANGS=[{code:'cs',label:'Čeština'},{code:'en',label:'English'},{code:'de',label:'Deutsch'},{code:'ru',label:'Русский'},{code:'nl',label:'Nederlands'},{code:'es',label:'Español'}]

export default function App(){
  const [screen,setScreen]=useState('lobby')
  const [mode,setMode]=useState('x01')
  const [startScore,setStartScore]=useState(501)
  const [outMode,setOutMode]=useState('double') // single|double|triple|master
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
  const [buffer,setBuffer]=useState([])
  const [bufferSpoken,setBufferSpoken]=useState([])
  const [history,setHistory]=useState([])
  const [mult,setMult]=useState(1)
  const [showWin,setShowWin]=useState(false)

  const hitRef=useRef(null); const fanfareRef=useRef(null)
  useEffect(()=>{ const a=new Audio('/dart-hit.mp3'); a.preload='auto'; a.oncanplay=()=>hitRef.current=a; a.onerror=()=>hitRef.current='fallback'; a.load();
                  const f=new Audio('https://cdn.jsdelivr.net/gh/napars/dummy-audio/fanfare.mp3'); fanfareRef.current=f;},[])
  const vibrate=(ms=20)=>{ if(navigator.vibrate) try{navigator.vibrate(ms)}catch{} }
  const playHit =()=>{ if(!soundOn) return; const r=hitRef.current; if(r&&r.play){ r.currentTime=0; r.play().catch(()=>{}) } }
  const speak   =(t)=>{ if(!voiceOn || !('speechSynthesis'in window))return; const u=new SpeechSynthesisUtterance(t); u.lang=lang; u.rate=1.05; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u)}

  useEffect(()=>{ if(screen==='lobby'){ setPlayers(ps=>ps.map(p=>({...p,remaining:startScore,darts:[],last:0}))) } },[startScore,screen])

  const sum=a=>a.reduce((s,x)=>s+x,0)
  const ensureRobot=(lvl)=>{
    const name=`Robot (${lvl})`
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
    let order=[...players]
    if(randomOrder) order.sort(()=>Math.random()-0.5)
    setPlayers(order.map(p=>({...p,remaining: mode==='x01'?startScore:0, darts:[], last:0})))
    setBuffer([]); setBufferSpoken([]); setHistory([]); setCurrent(0); setScreen('game')
    if(ai!=='off') ensureRobot(ai)
  }

  function onNumber(n){
    const val=(n===25? (mult===1?25:50) : n*mult)
    const notation=(mult===1?'S':mult===2?'D':'T')+n
    enter(notation,val,n)
  }
  function onMiss(){ enter('0',0,0) }
  function onBack(){ undo() }
  function onDouble(){ setMult(2); setTimeout(()=>setMult(1),700) }
  function onTriple(){ setMult(3); setTimeout(()=>setMult(1),700) }

  function enter(notation,value,spoken){
    const p=players[current]
    const subtotal=sum(buffer)
    const remainBefore=p.remaining - subtotal

    playHit(); vibrate()
    speak(spoken!==0? String(spoken) : (lang==='cs'?'nula':'zero'))

    if(remainBefore - value < 0){
      speak(lang==='cs'?'bez skóre':'no score')
      setHistory(h=>[...h,{player:p.name,darts:[...buffer,value],total:0,bust:true,remaining:p.remaining}])
      setBuffer([]); setBufferSpoken([]); return next()
    }

    if(mode==='x01' && canClose(remainBefore,value,notation)){
      const newBuffer=[...buffer,value]; const total=sum(newBuffer)
      setPlayers(ps=>ps.map((x,i)=> i===current ? {...x,remaining:0,darts:[...x.darts,...newBuffer],last:total} : x))
      setHistory(h=>[...h,{player:p.name,darts:newBuffer,total,remaining:0}])
      setBuffer([]); setBufferSpoken([])
      try{fanfareRef.current?.play?.()}catch{}; setShowWin(true); setTimeout(()=>setShowWin(false),800)
      saveGame({mode:`x01-${outMode}`,ppd:total/3,darts:newBuffer.length})
      return setTimeout(()=> setCurrent((current+1)%players.length),260)
    }

    const nb=[...buffer,value]; const ns=[...bufferSpoken,spoken]
    setBuffer(nb); setBufferSpoken(ns)
    if(nb.length>=3){
      const total=sum(nb)
      const newRemain = mode==='x01' ? (p.remaining - total) : p.remaining
      speak(String(total))
      setPlayers(ps=>ps.map((x,i)=> i===current ? {...x,remaining:newRemain,darts:[...x.darts,...nb],last:total} : x))
      setHistory(h=>[...h,{player:p.name,darts:nb,total,remaining:newRemain}])
      setBuffer([]); setBufferSpoken([]); next()
    }
  }

  function next(){
    const idx=(current+1)%players.length
    setCurrent(idx)
    const ridx=players.findIndex(p=>p.name.startsWith('Robot'))
    if(ai!=='off' && ridx>-1 && idx===ridx){
      setTimeout(()=>{ for(let i=0;i<3;i++){ const t=botThrow(ai,20); setTimeout(()=>enter(t.notation,t.value,t.value),i*150)} },180)
    }
  }

  function undo(){
    if(buffer.length>0){ setBuffer(b=>b.slice(0,-1)); setBufferSpoken(b=>b.slice(0,-1)); return }
    const last=history[history.length-1]; if(!last) return
    setHistory(h=>h.slice(0,-1))
    const idx=(current-1+players.length)%players.length; setCurrent(idx)
    setPlayers(ps=>ps.map((p,i)=> i===idx ? {...p,remaining:p.remaining + (mode==='x01'?(last.total||0):0),darts:p.darts.slice(0,-(last.darts?.length||0)),last:0} : p))
  }

  function movePlayer(i,dir){
    setPlayers(ps=>{ const a=[...ps]; const j=i+dir; if(j<0||j>=a.length) return a; [a[i],a[j]]=[a[j],a[i]]; return a })
  }
  function deletePlayer(i){ setPlayers(ps=>ps.filter((_,ix)=>ix!==i)) }

  const statsToday=aggregate(1).totals, stats7=aggregate(7).totals, stats30=aggregate(30).totals, statsAll=aggregate().totals
  const Tab=({active,children,onClick})=>(<button className={'tab'+(active?' active':'')} onClick={onClick}>{children}</button>)

  /* ====== RENDER ====== */
  return (
    <div className="container">
      {/* HLAVIČKA – v herní obrazovce ukáže šipku „zpět“ */}
      <div className="header">
        <div className="left">
          {screen==='game' && <button className="btn ghost" onClick={()=>setScreen('lobby')} title="Zpět">←</button>}
          <div className="logo"><span className="dart"></span><span>DartScore Pro</span></div>
        </div>
        <div className="controls">
          <button className="btn ghost" onClick={()=>setSoundOn(v=>!v)} title="Zvuk">{soundOn?'🔊':'🔈'}</button>
          <button className="btn ghost" onClick={()=>setVoiceOn(v=>!v)} title="Hlas">{voiceOn?'🗣️':'🤐'}</button>
          <select value={lang} onChange={e=>setLang(e.target.value)} className="input">
            {LANGS.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
      </div>

      {/* reklamy nízké */}
      <div className="adstrip">
        <div className="adcard">AdMob (placeholder)</div>
        <div className="adcard">Ad</div><div className="adcard">Ad</div>
      </div>

      <div className="main">
        {screen==='lobby' ? (
          <div className="panel">
            {/* 1) výběr hry */}
            <div className="card">
              <div className="controls" style={{flexWrap:'wrap'}}>
                <span>Režim</span>
                <select className="input" value={mode} onChange={e=>setMode(e.target.value)}>
                  <option value="x01">X01 (301/501)</option>
                  <option value="cricket">Cricket</option>
                  <option value="around">Around the Clock</option>
                  <option value="shanghai">Shanghai</option>
                </select>

                {mode==='x01' && <>
                  <span style={{marginLeft:8}}>Start</span>
                  <Tab active={startScore===301} onClick={()=>setStartScore(301)}>301</Tab>
                  <Tab active={startScore===501} onClick={()=>setStartScore(501)}>501</Tab>

                  <span style={{marginLeft:8}}>Ukončení</span>
                  <Tab active={outMode==='single'} onClick={()=>setOutMode('single')}>Single</Tab>
                  <Tab active={outMode==='double'} onClick={()=>setOutMode('double')}>Double</Tab>
                  <Tab active={outMode==='triple'} onClick={()=>setOutMode('triple')}>Triple</Tab>
                  <Tab active={outMode==='master'} onClick={()=>setOutMode('master')}>Master</Tab>
                </>}

                <span style={{marginLeft:8}}>Pořadí</span>
                <Tab active={randomOrder} onClick={()=>setRandomOrder(!randomOrder)}>{randomOrder?'Náhodné':'Fixní'}</Tab>

                <span style={{marginLeft:8}}>Robot</span>
                <select className="input" value={ai} onChange={e=>{ setAi(e.target.value); if(e.target.value!=='off') ensureRobot(e.target.value) }}>
                  <option value="off">Vypn.</option>
                  <option value="easy">Snadná</option>
                  <option value="medium">Střední</option>
                  <option value="hard">Těžká</option>
                </select>
              </div>
            </div>

            {/* 2) hráči – ovládání vpravo v řádku */}
            <div className="card">
              {players.map((p,i)=>(
                <div key={p.id} className="playerRow">
                  <div className="playerName">
                    <input className="input" value={p.name} onChange={e=>setPlayers(ps=>ps.map((x,ix)=>ix===i?{...x,name:e.target.value}:x))}/>
                  </div>
                  <div className="controls">
                    <button className="btn ghost" onClick={()=>movePlayer(i,-1)} title="Nahoru">↑</button>
                    <button className="btn ghost" onClick={()=>movePlayer(i,1)} title="Dolů">↓</button>
                    <button className="btn red" onClick={()=>deletePlayer(i)} title="Smazat">🗑️</button>
                  </div>
                  <div><span className="score">{p.remaining}</span></div>
                </div>
              ))}
              <button className="btn" onClick={()=>setPlayers(ps=>[...ps,{id:uid(),name:`Hráč ${ps.length+1}`,color:colors[ps.length%colors.length],remaining:startScore,darts:[],last:0}])}>+ Přidat hráče</button>
            </div>

            {/* Start */}
            <div style={{display:'flex',justifyContent:'flex-end'}}>
              <button className="btn green" onClick={startGame}>▶ Start hry</button>
            </div>

            <details className="card" style={{marginTop:6}}>
              <summary className="btn ghost">📖 Pravidla her</summary>
              <dl className="rules">{RULES.map(r=>(<React.Fragment key={r.key}><dt>{r.name}</dt><dd>{r.text}</dd></React.Fragment>))}</dl>
            </details>
          </div>
        ) : (
          <>
            {/* Hráči – jsou vždy vidět, scrolluje pouze seznam */}
            <div className="scroll">
              {players.map((p,idx)=>(
                <div key={p.id} className={'playerRow '+(idx===current?'active':'')}>
                  <div className="playerName">
                    <strong>{p.name}</strong>
                    {idx===current && (
                      <>
                        <div className="slots">
                          <div className="slot">{bufferSpoken[0] ?? ''}</div>
                          <div className="slot">{bufferSpoken[1] ?? ''}</div>
                          <div className="slot">{bufferSpoken[2] ?? ''}</div>
                        </div>
                        {buffer.length===3 && <div className="turnTotal">{sum(buffer)}</div>}
                      </>
                    )}
                    {idx!==current && p.last>0 && <div style={{marginTop:4,color:'#cfd6df'}}>Poslední: <strong>{p.last}</strong></div>}
                  </div>
                  <div className="controls">
                    {idx===current && <button className="btn" onClick={undo} title="Zpět">←</button>}
                  </div>
                  <div><span className="score">{p.remaining}</span></div>
                </div>
              ))}
            </div>

            <div className="keypadDock">
              <Keypad
                onNumber={onNumber}
                onMiss={onMiss}
                onBack={onBack}
                onDouble={onDouble}
                onTriple={onTriple}
              />
            </div>
          </>
        )}
      </div>

      {showWin && <div className="fireworks"></div>}
    </div>
  )
}
