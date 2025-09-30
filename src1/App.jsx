import React, { useEffect, useState } from 'react'
import { t, getLang, setLang } from './i18n'

function uid(){ return Math.random().toString(36).slice(2,9) }

export default function App(){
  const [players,setPlayers] = useState([{id:uid(),name:'Player 1',remaining:501,scores:[]},{id:uid(),name:'Player 2',remaining:501,scores:[]}])
  const [currentIdx,setCurrentIdx] = useState(0)
  const [dartIdx,setDartIdx] = useState(1)
  const [buffer,setBuffer] = useState([])
  const [adsRemoved,setAdsRemoved] = useState(()=>localStorage.getItem('ads_removed')==='1')
  const [lang,setLangState] = useState(getLang())

  useEffect(()=>{
    localStorage.setItem('ads_removed', adsRemoved?'1':'0')
  },[adsRemoved])

  function addPlayer(){
    setPlayers(p=>[...p,{id:uid(),name:'Player '+(p.length+1),remaining:501,scores:[]}])
  }
  function setName(id,name){
    setPlayers(ps=>ps.map(p=>p.id===id?{...p,name}:p))
  }
  function sum(a){return a.reduce((s,x)=>s+x,0)}
  function enterDart(score){
    const p = players[currentIdx]
    const before = p.remaining - sum(buffer)
    const after = before - score
    if(after<0){
      // bust - end turn no change
      finalizeTurn([], true)
      return
    }
    if(after===0){
      // win leg - finalize
      finalizeTurn([...buffer,score], false, true)
      return
    }
    const newBuf = [...buffer, score]
    setBuffer(newBuf)
    if(newBuf.length>=3){
      finalizeTurn(newBuf,false)
    }else{
      setDartIdx(newBuf.length+1)
    }
  }
  function finalizeTurn(values, bust=false, win=false){
    const i=currentIdx; const p=players[i]
    if(!bust){
      const total = sum(values)
      setPlayers(ps=>ps.map((x,ix)=> ix===i?{...x,remaining:Math.max(0,x.remaining-total),scores:[...x.scores,...values]}:x))
    }
    setBuffer([])
    setDartIdx(1)
    if(!win){
      setCurrentIdx(i=>(i+1)%players.length)
    }
  }

  function keypadAdd(n){
    n = Math.max(0, Math.min(60, n))
    enterDart(n)
  }

  function changeLang(l){
    setLang(l).then(()=>{
      setLangState(l)
      document.title = t('app_title')
    })
  }

  return <div style={{maxWidth:900, margin:'0 auto', padding:'16px 12px'}}>
    <header style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}>
      <h1 style={{margin:0}}>{t('app_title')}</h1>
      <div style={{display:'flex',gap:8,alignItems:'center'}}>
        <select value={lang} onChange={e=>changeLang(e.target.value)}>
          <option value='cs'>Čeština</option>
          <option value='en'>English</option>
          <option value='de'>Deutsch</option>
          <option value='ru'>Русский</option>
          <option value='nl'>Nederlands</option>
          <option value='es'>Español</option>
        </select>
        <button onClick={()=>alert('Share not implemented in this demo')}>{t('share')}</button>
        <button onClick={()=>alert('History placeholder')}>{t('history')}</button>
        <button onClick={()=>alert('Settings placeholder')}>{t('settings')}</button>
      </div>
    </header>

    <section style={{marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
      <div style={{background:'#111827',border:'1px solid #1f2937',borderRadius:12,padding:12}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
          <strong>{t('players')}</strong>
          <button onClick={addPlayer}>{t('add_player')}</button>
        </div>
        {players.map((p,idx)=>(
          <div key={p.id} style={{display:'flex',alignItems:'center',gap:8, padding:8, borderRadius:10, background: idx===currentIdx?'#0f766e33':'#0b132033', marginBottom:8}}>
            <input value={p.name} onChange={e=>setName(p.id,e.target.value)} />
            <div style={{marginLeft:'auto', textAlign:'right'}}>
              <div style={{fontVariantNumeric:'tabular-nums', fontWeight:700}}>{p.remaining}</div>
              <small>PPD {((501 - p.remaining)/(p.scores.length||1)).toFixed(2)}</small>
            </div>
          </div>
        ))}
      </div>

      <div style={{background:'#111827',border:'1px solid #1f2937',borderRadius:12,padding:12}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
          <strong>{t('current_turn')}</strong>
          <div><small>{t('dart')} {dartIdx}/3</small></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
          {[20,19,18,17,16,15,14,13,12].map(n=>(
            <button key={n} onClick={()=>keypadAdd(n)}>{n}</button>
          ))}
          <button onClick={()=>keypadAdd(25)}>25</button>
          <button onClick={()=>keypadAdd(50)}>50</button>
          <button onClick={()=>keypadAdd(0)}>0</button>
        </div>
        <div style={{marginTop:8}}>
          <button onClick={()=>alert('Undo in full app')}>{t('undo')}</button>
          <button onClick={()=>window.location.reload()} style={{marginLeft:8}}>{t('new_leg')}</button>
        </div>
      </div>
    </section>

    {!adsRemoved && (
      <div style={{position:'fixed',left:0,right:0,bottom:0, background:'#0f172a', borderTop:'1px solid #1f2937', padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
        <div>{t('ads_banner')}</div>
        <button onClick={()=>document.getElementById('paywall').showModal()}>{t('remove_ads')}</button>
      </div>
    )}
    {adsRemoved && (
      <div style={{position:'fixed',left:0,right:0,bottom:0, background:'#0f172a', borderTop:'1px solid #1f2937', padding:'6px 12px', textAlign:'center'}}>
        <small>{t('ads_removed')}</small>
      </div>
    )}

    <dialog id="paywall">
      <h3>{t('paywall_title')}</h3>
      <p>{t('paywall_body')}</p>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
        <button onClick={()=>document.getElementById('paywall').close()}>{t('close')}</button>
        <button onClick={()=>{ setAdsRemoved(true); document.getElementById('paywall').close(); }}>{t('pay')}</button>
      </div>
      <p style={{marginTop:8,fontSize:12,opacity:.7}}>Pozn.: Tohle je jen simulace. Skutečný nákup nastavíme v Google Play/App Store (viz návod).</p>
    </dialog>
  </div>
}
