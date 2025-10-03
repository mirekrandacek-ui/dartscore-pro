import React, { useEffect, useRef, useState } from 'react'
import './app.css'
import Keypad from './ui/Keypad.jsx'
import { RULES } from './rules'
import { botThrow } from './bots'
import { aggregate, saveGame } from './stats'

function uid(){ return Math.random().toString(36).slice(2,9) }
const colors = ['#22c55e','#3b82f6','#ef4444','#16a34a','#8b5cf6','#14b8a6','#e11d48','#f59e0b']
const LANGS=[{code:'cs',label:'Čeština'},{code:'en',label:'English'},{code:'de',label:'Deutsch'},{code:'ru',label:'Русский'},{code:'nl',label:'Nederlands'},{code:'es',label:'Español'}]

export default function App(){
  const [screen,setScreen]=useState('lobby')
  const [mode,setMode]=useState('x01')
  const [startScore,setStartScore]=useState(501)
  const [doubleOut,setDoubleOut]=useState(true)   // u X01
  const [lang,setLang]=useState(((navigator.language||'cs').slice(0,2))||'cs')
  const [soundOn,setSoundOn]=useState(true)       // všechen zvuk
  const [voiceOn,setVoiceOn]=useState(true)       // jen hlas
  const [ai,setAi]=useState('off')                // off|easy|medium|hard
  const [randomOrder,setRandomOrder]=useState(false)

  const [players,setPlayers]=useState([
    {id:uid(),name:'Mirek', color:colors[1], remaining:startScore, darts:[], legs:0},
    {id:uid(),name:'Pepa',  color:colors[0], remaining:startScore, darts:[], legs:0},
  ])
  const [current,setCurrent]=useState(0)
  const [buffer,setBuffer]=useState([])           // 3 hody v tomto kole
  const [history,setHistory]=useState([])
  const [mult,setMult]=useState(1)                // 1/2/3
  const [showWin,setShowWin]=useState(false)

  // ====== AUDIO ======
  const hitRef=useRef(null); const fanfareRef=useRef(null)
  useEffect(()=>{ const a=new Audio('/dart-hit.mp3'); a.preload='auto'; a.oncanplay=()=>hitRef.current=a; a.onerror=()=>hitRef.current='fallback'; a.load();
                  const f=new Audio('https://cdn.jsdelivr.net/gh/napars/dummy-audio/fanfare.mp3'); fanfareRef.current=f; },[])
  function vibrate(ms=30){ if(navigator.vibrate) try{ navigator.vibrate(ms) }catch{} }
  function playHit(){ if(!soundOn) return; const r=hitRef.current; if(r&&r.play){ r.currentTime=0; r.play().catch(()=>{}); } }
  function speak(text){ if(!voiceOn || !('speechSynthesis' in window))return; const u=new SpeechSynthesisUtterance(text); u.lang=lang; u.rate=1.05; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); }

  // ====== LOBBY SYNC ======
  useEffect(()=>{ if(screen==='lobby'){ setPlayers(ps=>ps.map(p=>({...p,remaining:startScore,darts:[]}))) } },[startScore,screen])

  // ====== HELPERS ======
  const sum = a => a.reduce((s,x)=>s+x,0)
  const ensureRobot = (lvl)=>{
    const name = `Robot (${lvl})`
    setPlayers(ps=>{
      const exists = ps.some(p=>p.name.startsWith('Robot'))
      if(exists) return ps.map(p=>p.name.startsWith('Robot')? {...p,name} : p)
      return [...ps,{id:uid(),name,color:'#888',remaining:startScore,darts:[],legs:0}]
    })
  }

  function finishOk(remainBefore,value,notation){
    const after = remainBefore - value
    if(after<0) return {ok:false,bust:true}
    if(after>0) return {ok:true,bust:false}
    // after === 0
    if(mode!=='x01') return {ok:true,bust:false}
    // Master/Double/Single out – teď držíme Double-Out (později přidáme přepínač triple out)
    if(!doubleOut)  return {ok:true,bust:false}
    const isDouble = notation.startsWith('D') || value===50
    return {ok:isDouble,bust:!isDouble}
  }

  function startGame(){
    let order=[...players]
    if(randomOrder) order.sort(()=>Math.random()-0.5)
    setPlayers(order.map(p=>({...p,remaining: mode==='x01'?startScore:0, darts:[]})))
    setBuffer([]); setHistory([]); setCurrent(0); setScreen('game')
    if(ai!=='off') ensureRobot(ai)
  }

  // ====== INPUT ======
  function onNumber(n){
    const val = (n===25? (mult===1?25:50) : n*mult)
    const notation=(mult===1?'S':mult===2?'D':'T')+n
    enter(notation,val,n)
  }
  function onMiss(){ enter('0',0,0) }
  function onBack(){ undo() }
  function onDouble(){ setMult(2); setTimeout(()=>setMult(1),800) }
  function onTriple(){ setMult(3); setTimeout(()=>setMult(1),800) }

  function enter(notation,value,spoken){
    const p=players[current]
    const before = p.remaining - sum(buffer)
    playHit(); vibrate(15)
    // hlas po KAŽDÉM hodu: jen číslo
    if(spoken!==0){ speak(String(spoken)) } else { speak(lang==='cs'?'nula':'zero') }

    const check = finishOk(before,value,notation)
    if(!check.ok && check.bust){
      speak(lang==='cs'?'bez skóre':'no score')
      setHistory(h=>[...h,{player:p.name,darts:[...buffer,notation],total:0,bust:true,remaining:p.remaining}])
      setBuffer([]); return next()
    }

    const nb=[...buffer,value]; setBuffer(nb)
    // zavření přes double out – povol reakci tlačítek a ukaž výhru
    if(mode==='x01' && before - value === 0){
      const total = sum(nb)
      saveGame({mode:'x01', ppd: total/3, darts: nb.length})
      try{ fanfareRef.current?.play?.() }catch{}
      setShowWin(true); setTimeout(()=>setShowWin(false),900)
      setTimeout(()=>{ 
        setPlayers(ps=>ps.map(x=>({...x,remaining:startScore,darts:[]})))
        setBuffer([]); setCurrent((current+1)%players.length)
      },250)
      return
    }

    // po 3. šipce
    if(nb.length>=3){
      const total = sum(nb)
      // po třetí řekni jen číslo součtu (bez „celkem“)
      speak(String(total))
      setPlayers(ps=>ps.map((x,i)=> i===current ? {...x, remaining: mode==='x01'? x.remaining-total : x.remaining, darts:[...x.darts,...nb]} : x ))
      setHistory(h=>[...h,{player:p.name,darts:nb,total,remaining: mode==='x01'? p.remaining-total : p.remaining}])
      setBuffer([]); next()
    }
  }

  function next(){
    const idx=(current+1)%players.length
    setCurrent(idx)
    // robot = poslední v poli začínající „Robot“
    const robotIndex = players.findIndex(p=>p.name.startsWith('Robot'))
    if(ai!=='off' && robotIndex>-1 && idx===robotIndex){
      setTimeout(()=>{ 
        for(let i=0;i<3;i++){
          const t=botThrow(ai,20)
          setTimeout(()=>enter(t.notation,t.value, t.value), i*160)
        }
      },220)
    }
  }

  function undo(){
    if(buffer.length>0){ setBuffer(b=>b.slice(0,-1)); return }
    const last=history[history.length-1]; if(!last) return
    setHistory(h=>h.slice(0,-1))
    const idx=(current-1+players.length)%players.length; setCurrent(idx)
    setPlayers(ps=>ps.map((p,i)=> i===idx ? {
      ...p,
      remaining: p.remaining + (mode==='x01'?(last.total||0):0),
      darts: p.darts.slice(0,-(last.darts?.length||0))
    } : p))
  }

  function movePlayer(i,dir){
    setPlayers(ps=>{ const a=[...ps]; const j=i+dir; if(j<0||j>=a.length) return a; [a[i],a[j]]=[a[j],a[i]]; return a })
  }
  function deletePlayer(i){ setPlayers(ps=>ps.filter((_,ix)=>ix!==i)) }

  // Stats
  const statsToday = aggregate(1).totals, stats7=aggregate(7).totals, stats30=aggregate(30).totals, statsAll=aggregate().totals

  // UI helpers
  const Tab = ({active,children,onClick})=>(<button className={'tab'+(active?' active':'')} onClick={onClick}>{children}</button>)

  return (
    <div className="container">
      {/* HLAVIČKA */}
      <header className="header">
        <div className="logo"><span className="dart"></span><span>DartScore Pro</span></div>
        <div className="row">
          <button className="btn ghost" onClick={()=>setSoundOn(v=>!v)} title="Zvuk zásahu">{soundOn?'🔊':'🔈'}</button>
          <button className="btn ghost" onClick={()=>setVoiceOn(v=>!v)} title="Hlas">{voiceOn?'🗣️':'🤐'}</button>
          <select value={lang} onChange={e=>setLang(e.target.value)} className="input">
            {LANGS.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
      </header>

      {/* REKLAMNÍ PÁS (nahoře) */}
      <div className="adstrip">
        <div className="adcard">AdMob banner (placeholder)</div>
        <div className="adcard">Ad</div><div className="adcard">Ad</div>
      </div>

      <div className="main">
        {screen==='lobby' ? (
          <div className="panel">
            {/* POŘADÍ: 1) výběr hry 2) hráči 3) start */}
            <div className="card">
              <h3>Výběr hry</h3>
              <div className="row">
                <label>Režim</label>
                <select className="input" value={mode} onChange={e=>setMode(e.target.value)}>
                  <option value="x01">X01 (301/501)</option>
                  <option value="cricket">Cricket</option>
                  <option value="around">Around the Clock</option>
                  <option value="shanghai">Shanghai</option>
                </select>
              </div>

              {mode==='x01' && (
                <>
                  <div className="row" style={{marginTop:8}}>
                    <span className="badge">Start skóre</span>
                    <Tab active={startScore===301} onClick={()=>setStartScore(301)}>301</Tab>
                    <Tab active={startScore===501} onClick={()=>setStartScore(501)}>501</Tab>
                  </div>
                  <div className="row" style={{marginTop:8}}>
                    <span className="badge">Double-Out</span>
                    <Tab active={doubleOut} onClick={()=>setDoubleOut(true)}>ON</Tab>
                    <Tab active={!doubleOut} onClick={()=>setDoubleOut(false)}>OFF</Tab>
                  </div>
                </>
              )}
              <div className="row" style={{marginTop:8}}>
                <span className="badge">Náhodné pořadí</span>
                <Tab active={randomOrder} onClick={()=>setRandomOrder(!randomOrder)}>{randomOrder?'ANO':'NE'}</Tab>
              </div>
              <div className="row" style={{marginTop:8}}>
                <label>Robot</label>
                <select className="input" value={ai} onChange={e=>{ setAi(e.target.value); if(e.target.value!=='off') ensureRobot(e.target.value) }}>
                  <option value="off">Vypnuto</option>
                  <option value="easy">Snadná</option>
                  <option value="medium">Střední</option>
                  <option value="hard">Těžká</option>
                </select>
                {players.some(p=>p.name.startsWith('Robot')) && <span className="badge">Robot je v seznamu hráčů</span>}
              </div>
            </div>

            <div className="card">
              <h3>Hráči</h3>
              {players.map((p,i)=>(
                <div key={p.id} className="player" style={{borderLeft:`6px solid ${p.color}`}}>
                  <div className="row" style={{justifyContent:'space-between',gap:8}}>
                    <input className="input" value={p.name} onChange={e=>setPlayers(ps=>ps.map((x,ix)=>ix===i?{...x,name:e.target.value}:x))} />
                    <div className="row">
                      <button className="btn ghost" onClick={()=>movePlayer(i,-1)}>↑</button>
                      <button className="btn ghost" onClick={()=>movePlayer(i,1)}>↓</button>
                      <button className="btn red" onClick={()=>deletePlayer(i)}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
              <button className="btn" onClick={()=>setPlayers(ps=>[...ps,{id:uid(),name:`Hráč ${ps.length+1}`,color:colors[ps.length%colors.length],remaining:startScore,darts:[],legs:0}])}>+ Přidat hráče</button>
            </div>

            <div className="row" style={{justifyContent:'flex-end'}}>
              <button className="btn green" onClick={startGame}>▶ Start hry</button>
            </div>

            <details className="card" style={{marginTop:10}}>
              <summary className="btn ghost">📖 Pravidla her</summary>
              <dl className="rules">{RULES.map(r=>(<React.Fragment key={r.key}><dt>{r.name}</dt><dd>{r.text}</dd></React.Fragment>))}</dl>
            </details>
          </div>
        ) : (
          <>
            {/* scrollují jen hráči, keypad je napevno dole */}
            <div className="playersScroll">
              {players.map((p,idx)=>(
                <div key={p.id} className={'player '+(idx===current?'active':'')} style={{borderLeft:`6px solid ${p.color}`}}>
                  <div className="row" style={{justifyContent:'space-between'}}>
                    <strong style={{fontSize:22}}>{p.name}</strong>
                    <span className="score">{p.remaining}</span>
                  </div>
                  {/* 3 sloty pro aktuální hody pouze u aktivního */}
                  {idx===current && (
                    <div className="slots">
                      <div className="slot">{buffer[0]??''}</div>
                      <div className="slot">{buffer[1]??''}</div>
                      <div className="slot">{buffer[2]??''}</div>
                    </div>
                  )}
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
