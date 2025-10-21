import React from 'react'

export default function Keypad({ onNumber, onMiss, onDouble, onTriple }){
  const nums = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,25,0]
  return (
    <div className="grid grid-keys">
      {nums.map(n=>(
        <button key={n} className="key" onClick={()=> onNumber(n)} aria-label={`Zadat ${n}`}>{n}</button>
      ))}
      <button className="key red"   onClick={onDouble} aria-label="Double">DOUBLE</button>
      <button className="key green" onClick={onTriple} aria-label="Triple">TRIPLE</button>
    </div>
  )
}
