export function botThrow(level, target){
  const base = {easy:0.55, medium:0.7, hard:0.82}[level] || 0.6;
  const hit = Math.random() < base;

  let n = hit ? target : Math.max(1, Math.min(20, target + (Math.random()<0.5?-1:1)));
  let mult = 1;
  const r = Math.random();

  if(r > base+0.1) mult = 1;
  else if(r > base-0.15) mult = 2;
  else mult = 3;

  if(target===25){
    n = 25;
    mult = (Math.random()<base?2:1);
  }
  if(target===50){
    n = 25;
    mult = 2;
  }

  return {notation:(mult===1?'S':mult===2?'D':'T')+n, value: n*mult};
}
