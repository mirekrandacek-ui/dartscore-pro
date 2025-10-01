export default function Keypad({onNumber,onMiss,onBack,onDouble,onTriple}){
  const nums = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,25,50,0];
  return (
    <div className="grid grid-keys">
      {nums.map(n=>(
        <button key={n} className="key" onClick={()=> n===0 ? onMiss?.() : onNumber?.(n)}>{n}</button>
      ))}
      <button className="key green big" onClick={onDouble}>DOUBLE</button>
      <button className="key red big" onClick={onTriple}>TRIPLE</button>
      <button className="key back big" onClick={onBack}>← ZPĚT</button>
    </div>
  )
}
