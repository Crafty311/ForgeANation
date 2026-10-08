export const SAVE_VERSION = 3;
export const SAVE_KEY = 'forgeNationSave';
export const BACKUP_KEY = 'forgeNationSaveBackup';
export const LEGACY_KEYS = ['forgeNationV81','forgeNationV80','forgeNationV74','forgeNationV73','forgeNationV72','forgeNationV71','forgeNationV70'];

export const DEFAULT_STATE = {
  screen:'landing',
  nation:null,
  lastSeen:Date.now(),
  toast:'',
  ui:{sidebarCollapsed:false,mobileNav:false,soundMuted:false,storeFilter:'All',buildFilter:'All',achievementFilter:'All'}
};

const GAME_SCREENS=new Set(['home','map','cities','citybuilder','buildings','skills','development','store','statistics','progress','history','settings','diplomacy']);

export function createDefaultState(){
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function parseCandidate(raw){
  if(!raw) return null;
  try{
    const x=JSON.parse(raw);
    return x?.nation ? x : null;
  }catch{return null;}
}

function normalize(s){
  const out={...createDefaultState(),...s};
  out.ui={...DEFAULT_STATE.ui,...(s?.ui||{})};
  out.screen=GAME_SCREENS.has(out.screen)?out.screen:'home';
  out.saveVersion=SAVE_VERSION;
  return out;
}

export function loadState(){
  if(typeof localStorage==='undefined') return createDefaultState();
  const keys=[SAVE_KEY,BACKUP_KEY,...LEGACY_KEYS];
  for(const key of keys){
    let raw=null;
    try{raw=localStorage.getItem(key);}catch{}
    const candidate=parseCandidate(raw);
    if(candidate) return normalize(candidate);
  }
  return createDefaultState();
}

export function saveState(state){
  const payload=JSON.stringify({...state,saveVersion:SAVE_VERSION,lastSeen:Date.now()});
  try{
    localStorage.setItem(SAVE_KEY,payload);
    localStorage.setItem(BACKUP_KEY,payload);
    return true;
  }catch(err){
    console.warn('Nation save failed',err);
    return false;
  }
}

export function clearSaves(){
  if(typeof localStorage==='undefined') return;
  for(const key of [SAVE_KEY,BACKUP_KEY,...LEGACY_KEYS]){
    try{localStorage.removeItem(key);}catch{}
  }
}
