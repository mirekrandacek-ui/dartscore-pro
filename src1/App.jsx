import React, { useEffect, useState } from 'react'
import './app.css'

/* ==== SVG ikony (megafon + silueta hlavy) ==== */
const IconSpeaker = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3 9v6h4l5 4V5L7 9H3zM16.5 12a3.5 3.5 0 0 0-2.13-3.22v6.44A3.5 3.5 0 0 0 16.5 12z"/>
    <path d="M14.37 5.29a7 7 0 0 1 0 13.42v-2.02a5 5 0 0 0 0-9.38V5.29z"/>
  </svg>
)
const IconHead = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2a6 6 0 0 0-6 6v1.2c0 .7-.3 1.34-.8 1.79A4 4 0 0 0 3 14v1a2 2 0 0 0 2 2h3v2a2 2 0 0 0 2 2h2v-4h2.8a3.2 3.2 0 0 0 3.2-3.2V8a6 6 0 0 0-6-6z"/>
    {/* „echo“ vlnky u úst */}
    <path d="M18 8c1.8.9 1.8 3.1 0 4" />
    <path d="M19.5 6.5c3 1.5 3 6.5 0 8" />
  </svg>
)

/* ==== i18n ==== */
const I18N = {
  cs:{
    mode:'Režim', classic:'Klasická hra', cricket:'Cricket', around:'Around the Clock',
    start:'Start', closing:'Ukončení', singleOut:'Single-out', doubleOut:'Double-out', tripleOut:'Triple-out', masterOut:'Master-out',
    order:'Pořadí', random:'Náhodné', fixed:'Fixní',
    robot:'Robot', off:'Vypn.', easy:'Snadná', medium:'Střední', hard:'Těžká',
    startGame:'▶ Start hry', rules:'Pravidla her',
    addPlayer:'Přidat hráče', player:'Hráč',
    rulesClassic:'Cíl: z počátečního skóre přesně na nulu. Single = ×1, Double = ×2, Triple = ×3, Bull 25/50. Ukončení určuje, jakým zásahem smíš hru uzavřít (Single-out / Double-out / Triple-out / Master-out). Přestřelení = bez skóre.',
    rulesCricket:'Cíl: čísla 15–20 a Bull. Single = 1 bod, Double = 2 body, Triple = 3 body. Číslo se uzavře po třech bodech. Můžeš bodovat na číslech, která máš otevřená a soupeř ne. Vyhrává ten, kdo uzavře všechna čísla a vede na body.',
    rulesAround:'Cíl: postupně zasáhnout 1 → 20 → Bull. Postup stačí jakýkoli zásah čísla (Single/Double/Triple). Vyhrává ten, kdo první dokončí Bull.',
    sound:'Zvuk', voice:'Hlas'
  },
  en:{
    mode:'Mode', classic:'Classic', cricket:'Cricket', around:'Around the Clock',
    start:'Start', closing:'Finish', singleOut:'Single-out', doubleOut:'Double-out', tripleOut:'Triple-out', masterOut:'Master-out',
    order:'Order', random:'Random', fixed:'Fixed',
    robot:'Bot', off:'Off', easy:'Easy', medium:'Medium', hard:'Hard',
    startGame:'▶ Start Game', rules:'Rules',
    addPlayer:'Add player', player:'Player',
    rulesClassic:'Goal: reduce from starting score to exactly zero. Single ×1, Double ×2, Triple ×3, Bull 25/50. Finish mode defines closing (Single-out / Double-out / Triple-out / Master-out). Overshoot = no score.',
    rulesCricket:'Goal: numbers 15–20 and Bull. Single 1, Double 2, Triple 3. A number closes after three points. You can score on numbers you opened while opponents have not. Win when all are closed and you lead.',
    rulesAround:'Goal: hit 1 → 20 → Bull in order. Any hit on the current number counts. First to finish Bull wins.',
    sound:'Sound', voice:'Voice'
  },
  de:{
    mode:'Modus', classic:'Klassisch', cricket:'Cricket', around:'Around the Clock',
    start:'Start', closing:'Finish', singleOut:'Single-out', doubleOut:'Double-out', tripleOut:'Triple-out', masterOut:'Master-out',
    order:'Reihenfolge', random:'Zufällig', fixed:'Fix',
    robot:'Bot', off:'Aus', easy:'Leicht', medium:'Mittel', hard:'Schwer',
    startGame:'▶ Spiel starten', rules:'Regeln',
    addPlayer:'Spieler hinzufügen', player:'Spieler',
    rulesClassic:'Ziel: vom Startscore genau auf Null. Single ×1, Double ×2, Triple ×3, Bull 25/50. Finish-Modus definiert den Abschluss (Single-out / Double-out / Triple-out / Master-out). Überschuss = kein Score.',
    rulesCricket:'Ziel: Zahlen 15–20 und Bull. Single 1, Double 2, Triple 3. Zahl schließt nach drei Punkten. Punkte auf geöffneten Zahlen. Gewinnt, wer alles schließt und führt.',
    rulesAround:'Ziel: 1 → 20 → Bull der Reihe nach. Jeder Treffer zählt. Wer zuerst Bull beendet, gewinnt.',
    sound:'Ton', voice:'Stimme'
  },
  ru:{
    mode:'Режим', classic:'Классика', cricket:'Крикет', around:'По кругу',
    start:'Старт', closing:'Финиш', singleOut:'Сингл-аут', doubleOut:'Дабл-аут', tripleOut:'Трипл-аут', masterOut:'Мастер-аут',
    order:'Порядок', random:'Случайно', fixed:'Фикс',
    robot:'Бот', off:'Выкл', easy:'Лёгкий', medium:'Средний', hard:'Сложный',
    startGame:'▶ Начать игру', rules:'Правила',
    addPlayer:'Добавить игрока', player:'Игрок',
    rulesClassic:'Цель: от старта до нуля. Сингл ×1, Дабл ×2, Трипл ×3, Булл 25/50. Режим финиша: Single-out / Double-out / Triple-out / Master-out. Перебор = без очков.',
    rulesCricket:'Цель: 15–20 и Булл. Сингл 1, Дабл 2, Трипл 3. Закрытие после 3 очков. Побеждает закрывший всё и ведущий.',
    rulesAround:'Цель: 1 → 20 → Булл по порядку. Любое попадание засчитывается. Побеждает завершивший Булл первым.',
    sound:'Звук', voice:'Голос'
  },
  nl:{
    mode:'Modus', classic:'Klassiek', cricket:'Cricket', around:'Rondje',
    start:'Start', closing:'Finish', singleOut:'Single-out', doubleOut:'Double-out', tripleOut:'Triple-out', masterOut:'Master-out',
    order:'Volgorde', random:'Willekeurig', fixed:'Vast',
    robot:'Bot', off:'Uit', easy:'Makkelijk', medium:'Gemiddeld', hard:'Moeilijk',
    startGame:'▶ Start spel', rules:'Regels',
    addPlayer:'Speler toevoegen', player:'Speler',
    rulesClassic:'Doel: van startscore naar exact nul. Single ×1, Double ×2, Triple ×3, Bull 25/50. Finishmodus: Single-out / Double-out / Triple-out / Master-out. Overshoot = geen score.',
    rulesCricket:'Doel: nummers 15–20 en Bull. Single 1, Double 2, Triple 3. Nummer sluit na drie punten. Win als alles dicht is en je leidt.',
    rulesAround:'Doel: 1 → 20 → Bull op volgorde. Elke treffer telt. Wie Bull eerst voltooit, wint.',
    sound:'Geluid', voice:'Stem'
  },
  es:{
    mode:'Modo', classic:'Clásico', cricket:'Cricket', around:'Alrededor',
    start:'Inicio', closing:'Cierre', singleOut:'Single-out', doubleOut:'Double-out', tripleOut:'Triple-out', masterOut:'Master-out',
    order:'Orden', random:'Aleatorio', fixed:'Fijo',
    robot:'Bot', off:'Off', easy:'Fácil', medium:'Medio', hard:'Difícil',
    startGame:'▶ Iniciar', rules:'Reglas',
    addPlayer:'Añadir jugador', player:'Jugador',
    rulesClassic:'Objetivo: bajar desde el puntaje inicial hasta cero exacto. Single ×1, Doble ×2, Triple ×3, Bull 25/50. Cierre: Single-out / Double-out / Triple-out / Master-out. Exceso = sin puntaje.',
    rulesCricket:'Objetivo: 15–20 y Bull. Single 1, Doble 2, Triple 3. Un número se cierra con tres puntos. Gana quien cierre todo y vaya ganando.',
    rulesAround:'Objetivo: 1 → 20 → Bull en orden. Cualquier acierto cuenta. Gana quien complete Bull primero.',
    sound:'Sonido', voice:'Voz'
  }
}
const t=(lang,key)=> (I18N[lang]&&I18N[lang][key]) || I18N.cs[key] || key

/* util */
const uid=()=>Math.random().toString(36).slice(2,9)
const colors=['#16a34a','#3b82f6','#ef4444','#14b8a6','#8b5cf6','#e11d48','#f59e0b','#22c55e']

/* default jméno hráče podle jazyka */
const defaultNameFor=(lang,n)=>({
  cs:`Hráč ${n}`, en:`Player ${n}`, de:`Spieler ${n}`, ru:`Игрок ${n}`, nl:`Speler ${n}`, es:`Jugador ${n}`
}[lang]||`Player ${n}`)

/* regexy, abychom poznali „automatická“ jména a přeložili je při změně jazyka */
const autoNamePatterns=[
  /^Hráč (\d+)$/, /^Player (\d+)$/, /^Spieler (\d+)$/, /^Игрок (\d+)$/, /^Speler (\d+)$/, /^Jugador (\d+)$/
]

export default function App(){
  // fix 100vh na mobilech
  useEffect(()=>{ const setVh=()=>document.documentElement.style.setProperty('--vh',`${window.innerHeight*0.01}px`); setVh(); window.addEventListener('resize',setVh); return()=>window.removeEventListener('resize',setVh)},[])

  const [lang,setLang]=useState(((navigator.language||'cs').slice(0,2))||'cs')
  const [soundOn,setSoundOn]=useState(true)
  const [voiceOn,setVoiceOn]=useState(true)

  const [mode,setMode]=useState('classic') // classic|cricket|around
  const [startScore,setStartScore]=useState(501)
  const [outMode,setOutMode]=useState('double') // single|double|triple|master
  const [randomOrder,setRandomOrder]=useState(false)
  const [ai,setAi]=useState('off')

  const [players,setPlayers]=useState([
    {id:uid(),name:defaultNameFor(lang,1),color:colors[1]},
    {id:uid(),name:defaultNameFor(lang,2),color:colors[0]},
  ])

  // načtení uloženého stavu
  useEffect(()=>{ try{
    const st=JSON.parse(localStorage.getItem('lobbyState')||'{}')
    if(st.players) setPlayers(st.players)
    if(st.startScore) setStartScore(st.startScore)
    if(st.outMode) setOutMode(st.outMode)
    if(st.lang) setLang(st.lang)
    if(st.mode) setMode(st.mode)
    if(st.randomOrder!=null) setRandomOrder(st.randomOrder)
    if(st.ai) setAi(st.ai)
  }catch{} },[])
  // ukládání
  useEffect(()=>{ try{
    localStorage.setItem('lobbyState', JSON.stringify({players,startScore,outMode,lang,mode,randomOrder,ai}))
  }catch{} },[players,startScore,outMode,lang,mode,randomOrder,ai])

  // při změně jazyka přelož „auto“ jména hráčů
  useEffect(()=>{
    setPlayers(ps=>ps.map(p=>{
      for(const rx of autoNamePatterns){
        const m=p.name.match(rx); if(m){ const n=parseInt(m[1],10); return {...p, name:defaultNameFor(lang,n)} }
      }
      return p
    }))
  },[lang])

  const movePlayer=(i,dir)=>setPlayers(ps=>{const a=[...ps];const j=i+dir;if(j<0||j>=a.length)return a;[a[i],a[j]]=[a[j],a[i]];return a})
  const deletePlayer=(i)=>setPlayers(ps=>ps.filter((_,ix)=>ix!==i))
  const addPlayer=()=>setPlayers(ps=>[...ps,{id:uid(),name:defaultNameFor(lang,ps.length+1),color:colors[ps.length%colors.length]}])

  /* ===== LOBBY UI ===== */
  return (
    <div className="container">
      {/* HEADER */}
      <div className="header">
        <div className="left">
          <div className="logo"><span className="dart"></span><span>DartScore Pro</span></div>
        </div>
        <div className="controls">
          <button className={`iconBtn ${!soundOn?'muted':''}`} onClick={()=>setSoundOn(v=>!v)} aria-label={t(lang,'sound')}>
            <IconSpeaker/>
          </button>
          <button className={`iconBtn ${!voiceOn?'muted':''}`} onClick={()=>setVoiceOn(v=>!v)} aria-label={t(lang,'voice')}>
            <IconHead/>
          </button>
          <select value={lang} onChange={e=>setLang(e.target.value)} className="input" aria-label="Language">
            <option value="cs">Čeština</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="ru">Русский</option>
            <option value="nl">Nederlands</option>
            <option value="es">Español</option>
          </select>
        </div>
      </div>

      {/* ADS */}
      <div className="adstrip">
        <div className="adcard">AdMob (placeholder)</div>
        <div className="adcard">Ad</div><div className="adcard">Ad</div>
      </div>

      {/* LOBBY */}
      <div className="lobbyWrap">
        {/* 1) ŘÁDEK: Režim */}
        <div className="lobbyCard">
          <div className="lobbyControls">
            <span>{t(lang,'mode')}</span>
            <select className="input" value={mode} onChange={e=>setMode(e.target.value)}>
              <option value="classic">{t(lang,'classic')}</option>
              <option value="cricket">{t(lang,'cricket')}</option>
              <option value="around">{t(lang,'around')}</option>
            </select>
          </div>
        </div>

        {/* 2) ŘÁDEK: Start (jen pro Classic) */}
        {mode==='classic' && (
          <div className="lobbyCard">
            <div className="lobbyControls">
              <span>{t(lang,'start')}</span>
              {[101,301,501,701,901].map(s=>(
                <button key={s} className={`tab ${startScore===s?'active':''}`} onClick={()=>setStartScore(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* 3) ŘÁDEK: Ukončení */}
        {mode==='classic' && (
          <div className="lobbyCard">
            <div className="lobbyControls">
              <span>{t(lang,'closing')}</span>
              <button className={`tab ${outMode==='single'?'active':''}`} onClick={()=>setOutMode('single')}>{t(lang,'singleOut')}</button>
              <button className={`tab ${outMode==='double'?'active':''}`} onClick={()=>setOutMode('double')}>{t(lang,'doubleOut')}</button>
              <button className={`tab ${outMode==='triple'?'active':''}`} onClick={()=>setOutMode('triple')}>{t(lang,'tripleOut')}</button>
              <button className={`tab ${outMode==='master'?'active':''}`} onClick={()=>setOutMode('master')}>{t(lang,'masterOut')}</button>
            </div>
          </div>
        )}

        {/* 4) ŘÁDEK: Pořadí (select s „Náhodné“ aby to bylo vidět) */}
        <div className="lobbyCard">
          <div className="lobbyControls">
            <span>{t(lang,'order')}</span>
            <select className="input" value={randomOrder ? 'random' : 'fixed'}
              onChange={e=>setRandomOrder(e.target.value==='random')}>
              <option value="fixed">{t(lang,'fixed')}</option>
              <option value="random">{t(lang,'random')}</option>
            </select>
          </div>
        </div>

        {/* 5) ŘÁDEK: Robot */}
        <div className="lobbyCard">
          <div className="lobbyControls">
            <span>{t(lang,'robot')}</span>
            <select className="input" value={ai} onChange={e=>setAi(e.target.value)}>
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
                <input className="input" value={p.name}
                  onChange={e=>setPlayers(ps=>ps.map((x,ix)=>ix===i?{...x,name:e.target.value}:x))}/>
              </div>

              <div className="playerActions">
                <button className="btn ghost" onClick={()=>movePlayer(i,-1)} title="Up">↑</button>
                <button className="btn ghost" onClick={()=>movePlayer(i,1)}  title="Down">↓</button>
              </div>

              <div><span className="score">{mode==='classic'? startScore : '-'}</span></div>

              {/* KOŠ úplně vpravo */}
              <div className="playerDelete">
                <button className="trash" onClick={()=>deletePlayer(i)} title="Delete">🗑️</button>
              </div>
            </div>
          ))}
          <button className="btn" onClick={addPlayer}>+ {t(lang,'addPlayer')}</button>
        </div>

        {/* Pravidla (bez Shanghai) */}
        <div className="lobbyCard">
          <details>
            <summary className="btn ghost">📖 {t(lang,'rules')}</summary>
            <dl className="rules">
              <dt>{t(lang,'classic')}</dt>
              <dd>{t(lang,'rulesClassic')}</dd>
              <dt>{t(lang,'cricket')}</dt>
              <dd>{t(lang,'rulesCricket')}</dd>
              <dt>{t(lang,'around')}</dt>
              <dd>{t(lang,'rulesAround')}</dd>
            </dl>
          </details>
        </div>

        {/* Start (zatím jen tlačítko – herní logiku řešíme až potom) */}
        <div style={{display:'flex',justifyContent:'flex-end'}}>
          <button className="btn green">{t(lang,'startGame')}</button>
        </div>
      </div>
    </div>
  )
}
