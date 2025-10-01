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
  const [mode,setMode]=useState('x01')          // x01 | cricket | around | shanghai (scaffold)
  const [startScore,setStartScore]=useState(501)
  const [doubleOut,setDoubleOut]=useState(true)  // u X01
  const [lang,setLang]=useState(((navigator.language||'cs').slice(0,2))||'cs')
  const [soundOn,setSoundOn]=useState(true)
  const [ai,setAi]=useState('off')              // off | easy | medium | hard (bot je poslední hráč)
  const [randomOrder,setRandomOrder]=useState(false)

  const [players,setPlayers]=useState([
    {id:uid(),name:'Pepa', color:colors[0], remaining:startScore, darts:[], legs:0},
    {id:uid(),name:'Mirek',color:colors[1], remaining:startScore, darts:[], legs:0},
  ])
  const [current,setCurrent]=useState(0)
  const [buffer,setBuffer]=useState([])          // aktuální 3 šipky
  const [history,setHistory]=useState([])        // uzavřené tahy
  const [mult,setMult]=useState(1)               // 1/2/3 = S/D/T

  // Zvuk
  const hitRef=useRef(null)
  useEffect(()=>{ const a=new Audio('/dart-hit.mp3'); a.preload='auto'; a.oncanplay=()=>hitRef.current=a; a.onerror=()=>hitRef.current='fallback'; a.load(); },[])
  const playHit=()=>{ if(!soundOn) return; const r=hitRef.current; if(r&&r.play){ r.currentTime=0; r.play().catch(()=>{}); } }
  const speakTotal=(total)=>{ if(!soundOn || !('speechSynthesis' in window))return; const u=new SpeechSynthesisUtterance((lang==='cs'?'Celkem ':'Total ')+total); u.lang=lang; u.rate=1.05; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); }

  // Lobby → drž stejné startovní skóre
  useEffect(()=>{ if(screen==='lobby'){ setPlayers(ps=>ps.map(p=>({...p,remaining:startScore,darts:[]}))) } },[startScore,screen])

  const sum = a => a.reduce((s,x)=>s+x,0)

  function finishOk(remainBefore,value,notation){
    const after = remainBefore - value
    if(after<0) return {ok:false,bust:true}
    if(after>0) return {ok:true,bust:false}
    // after === 0
    if(mode!=='x01') return {ok:true,bust:false}
    if(!doubleOut)  return {ok:true,bust:false}
    const isDouble = notation.startsWith('D') || value===50
    return {ok:isDouble,bust:!isDouble}
  }

  function startGame(){
    let order=[...players]
    if(randomOrder) order.sort(()=>Math.random()-0.5)
    setPlayers(order.map(p=>({...p,remaining: mode==='x01'?startScore:0, darts:[]})))
    setBuffer([]); setHistory([]); setCurrent(0); setScreen('game')
  }

  // Vstup z Keypadu
  function onNumber(n){
    const val = (n===25? (mult===1?25:50) : n*mult)
    const notation=(mult===1?'S':mult===2?'D':'T')+n
    enter(notation,val)
  }
  function onMiss(){ enter('0',0) }
  function onBack(){ undo() }
  function onDouble(){ setMult(2); setTimeout(()=>setMult(1),800) }
  function onTriple(){ setMult(3); setTimeout(()=>setMult(1),800) }

  function enter(notation,value){
    const p=players[current]
    const before = p.remaining - sum(buffer)
    playHit()
    const check = finishOk(before,value,notation)
    if(!check.ok && check.bust){
      setHistory(h=>[...h,{player:p.name,darts:[...buffer,notation],total:0,bust:true,remaining:p.remaining}])
      setBuffer([]); return next()
    }
    const nb=[...buffer,value]; setBuffer(nb)

    // Zavření (X01)
    if(mode==='x01' && before - value === 0){
      const total = sum(nb)
      speakTotal(total)
      saveGame({mode:'x01', ppd: total/3, darts: nb.length})
      setTimeout(()=>{ 
        setPlayers(ps=>ps.map(x=>({...x,remaining:startScore,darts:[]})))
        setBuffer([]); setCurrent((current+1)%players.length)
      },200)
      return
    }

    // Po 3. šipce uzavři tah
    if(nb.length>=3){
      const total = sum(nb)
      setPlayers(ps=>ps.map((x,i)=> i===current ? {...x, remaining: mode==='x01'? x.remaining-total : x.remaining, darts:[...x.darts,...nb]} : x ))
      setHistory(h=>[...h,{player:p.name,darts:nb,total,remaining: mode==='x01'? p.remaining-total : p.remaining}])
      setBuffer([])
      speakTotal(total)
      next()
    }
  }

  function next(){
    const idx=(current+1)%players.length
    setCurrent(idx)
    // Robot = poslední hráč, když zapnutý
    if(ai!=='off' && idx===players.length-1){
      setTimeout(()=>{ 
        for(let i=0;i<3;i++){
          const t=botThrow(ai,20) // jednoduchý cíl; později chytřejší
          const val = t.value, notation = t.notation
          // voláme enter sekvenčně s malou prodlevou
          setTimeout(()=>enter(notation,val), i*160)
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

  // Statistiky
  const statsToday = aggregate(1).totals
  const stats7     = aggregate(7).totals
  const stats30    = aggregate(30).totals
  const statsAll   = aggregate().totals

  return (
    <div className="container">
      {/* Horní lišta */}
      <header className="header">
        <div className="logo"><span className="dart"></span><span>DartScore Pro</span></div>
        <div className="row">
          <select value={lang} onChange={e=>setLang(e.target.value)} className="input">
            {LANGS.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <button className="btn ghost" onClick={()=>setSoundOn(v=>!v)}>{soundOn?'🔊':'🔈'}</button>
        </div>
      </header>

      {/* Reklamní pás (placeholder) */}
      <div className="adstrip">
        <div className="adcard">AdMob banner (placeholder)</div>
        <div className="adcard">Ad</div><div className="adcard">Ad</div>
      </div>

      {screen==='lobby' ? (
        <div className="card">
          <div className="row wrap" style={{justifyContent:'space-between'}}>
            {/* Hráči */}
            <div className="card" style={{flex:'1 1 320px'}}>
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
              <button className="btn" onClick={()=>setPlayers(ps=>[...ps,{id:uid(),name:`Player ${ps.length+1}`,color:colors[ps.length%colors.length],remaining:startScore,darts:[],legs:0}])}>+ Přidat hráče</button>
            </div>

            {/* Nastavení */}
            <div className="card" style={{flex:'1 1 260px'}}>
              <h3>Nastavení</h3>
              <div className="row wrap">
                <label>Režim</label>
                <select className="input" value={mode} onChange={e=>setMode(e.target.value)}>
                  <option value="x01">X01 (301/501)</option>
                  <option value="cricket">Cricket</option>
                  <option value="around">Around the Clock</option>
                  <option value="shanghai">Shanghai</option>
                </select>
              </div>
              {mode==='x01' && (
                <div className="row wrap" style={{marginTop:8}}>
                  <button className="btn" onClick={()=>setStartScore(301)} disabled={startScore===301}>301</button>
                  <button className="btn" onClick={()=>setStartScore(501)} disabled={startScore===501}>501</button>
                  <div className="row"><span className="badge">Double-Out</span><button className="btn" onClick={()=>setDoubleOut(v=>!v)}>{doubleOut?'ON':'OFF'}</button></div>
                </div>
              )}
              <div className="row wrap" style={{marginTop:8}}>
                <span className="badge">Náhodné pořadí</span>
                <button className="btn" onClick={()=>setRandomOrder(v=>!v)}>{randomOrder?'ANO':'NE'}</button>
              </div>
              <div className="row wrap" style={{marginTop:8}}>
                <label>Robot</label>
                <select className="input" value={ai} onChange={e=>setAi(e.target.value)}>
                  <option value="off">Vypnuto</option>
                  <option value="easy">Snadná</option>
                  <option value="medium">Střední</option>
                  <option value="hard">Těžká</option>
                </select>
              </div>
            </div>

            {/* Statistiky */}
            <div className="card" style={{flex:'1 1 220px'}}>
              <h3>Statistiky</h3>
              <div className="kpi">
                <div className="tag">Dnes: {statsToday.games} • Ø {statsToday.avg}</div>
                <div className="tag">7 dní: {stats7.games} • Ø {stats7.avg}</div>
                <div className="tag">30 dní: {stats30.games} • Ø {stats30.avg}</div>
                <div className="tag">Celkem: {statsAll.games} • Ø {statsAll.avg}</div>
              </div>
            </div>
          </div>

          <details className="card">
            <summary className="btn ghost">📖 Pravidla her</summary>
            <dl className="rules">{RULES.map(r=>(<React.Fragment key={r.key}><dt>{r.name}</dt><dd>{r.text}</dd></React.Fragment>))}</dl>
          </details>

          <div className="row" style={{justifyContent:'space-between'}}>
            <span c
