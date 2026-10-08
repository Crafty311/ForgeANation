export const SEASONS=['Summer','Monsoon','Autumn','Winter','Spring'];
export const DAYS_PER_SEASON=5;
export const DAYS_PER_YEAR=25;

export function internalDate(n){
  const day=Math.max(1,Number(n?.cozy?.dayIndex)||1);
  const dayOfYear=((day-1)%DAYS_PER_YEAR)+1;
  const year=Math.floor((day-1)/DAYS_PER_YEAR)+1;
  const season=SEASONS[Math.floor((dayOfYear-1)/DAYS_PER_SEASON)]||SEASONS[4];
  const dayOfSeason=((dayOfYear-1)%DAYS_PER_SEASON)+1;
  return {day,year,dayOfYear,season,dayOfSeason};
}

export function dayKey(n){return `day-${internalDate(n).day}`;}

export function advanceDay(n,count=1){
  n.cozy=n.cozy||{};
  n.cozy.dayIndex=Math.max(1,(Number(n.cozy.dayIndex)||1)+Math.max(0,Math.floor(count)));
  return internalDate(n);
}
