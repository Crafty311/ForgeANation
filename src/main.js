import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const KEY='forgeNationV80';
const SAVE_KEYS=['forgeNationV80','forgeNationV81','forgeNationSave'];
const OLD_KEYS=['forgeNationV80','forgeNationV74','forgeNationV73','forgeNationV72','forgeNationV71','forgeNationV70'];
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const fmt=n=>new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(n);
const money=n=>n>=1e12?'$'+(n/1e12).toFixed(1)+'T':n>=1e9?'$'+(n/1e9).toFixed(1)+'B':n>=1e6?'$'+(n/1e6).toFixed(1)+'M':'$'+Math.round(n/1e3)+'K';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const esc=s=>String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

const focusDefs={
 industrial:{name:'Industrial',desc:'Manufacturing & Industry',income:1.18,skills:{industry:2}},
 commercial:{name:'Commercial',desc:'Trade & Finance',income:1.14,skills:{commerce:2}},
 agricultural:{name:'Agricultural',desc:'Farming & Food',income:1.10,skills:{health:1,industry:1}},
 technological:{name:'Technological',desc:'Innovation & Research',income:1.16,skills:{technology:2,education:1}},
 cultural:{name:'Cultural',desc:'Arts & Tourism',income:1.09,skills:{culture:2}}
};
const skillDefs=[
 {id:'industry',name:'Industry',icon:'⚙',effect:'+12% Production',base:1200000,gain:.12,cls:'gold'},
 {id:'education',name:'Education',icon:'◆',effect:'+6% Research',base:800000,gain:.07,cls:'blue'},
 {id:'infrastructure',name:'Infrastructure',icon:'⌂',effect:'+10% Efficiency',base:1500000,gain:.10,cls:'green'},
 {id:'technology',name:'Technology',icon:'◈',effect:'+5% Innovation',base:1000000,gain:.09,cls:'cyan'},
 {id:'health',name:'Healthcare',icon:'♥',effect:'+5% Health',base:700000,gain:.055,cls:'red'},
 {id:'commerce',name:'Commerce',icon:'▣',effect:'+6% Trade',base:900000,gain:.08,cls:'teal'},
 {id:'culture',name:'Culture',icon:'✦',effect:'+4% Tourism',base:600000,gain:.06,cls:'purple'}
];
const levels=[
 {level:1,name:'Settling Nation',xp:0,unlock:'Basic economy'},
 {level:2,name:'Growing Nation',xp:1000,unlock:'Development Store'},
 {level:3,name:'Developing Nation',xp:3000,unlock:'Industrial districts'},
 {level:4,name:'Modern Nation',xp:7000,unlock:'Advanced cities'},
 {level:5,name:'Regional Power',xp:15000,unlock:'Major infrastructure'},
 {level:6,name:'Major Power',xp:30000,unlock:'Global trade'},
 {level:7,name:'Global Power',xp:60000,unlock:'World-class districts'},
 {level:8,name:'World-Class Nation',xp:120000,unlock:'National landmarks'}
];
const CITY_STYLES=[
 {name:'Coastal',ground:0x12364a,road:0x31515d,roof:0x9cb6bd,accent:0x46b6c9},
 {name:'River Valley',ground:0x173d32,road:0x4a5550,roof:0xc7b79a,accent:0x65b98b},
 {name:'Highlands',ground:0x24383b,road:0x4c5251,roof:0xb7c6cc,accent:0x7aa6d1},
 {name:'Plains',ground:0x3b4028,road:0x55554a,roof:0xd0b783,accent:0xc8a84e},
 {name:'Modern',ground:0x182b3d,road:0x394a59,roof:0xb8d7e7,accent:0x61d5d9},
 {name:'Garden',ground:0x16382f,road:0x46564c,roof:0xd1c49e,accent:0x74c98d},
 {name:'Industrial',ground:0x2b3034,road:0x4b4e50,roof:0x9b8f87,accent:0xd58d55},
 {name:'Old Quarter',ground:0x3b3028,road:0x5b4d42,roof:0xc5a779,accent:0xd5ad5e}
];
function cityStyle(c){const n=state.nation||{};const seed=hashCity(`${n.name||'nation'}:${c?.name||'city'}`);return CITY_STYLES[seed%CITY_STYLES.length]}
function hashCity(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function citySeed(c){return hashCity(`${state.nation?.name||'nation'}:${c?.name||'city'}:${c?.level||1}`)}
function ensureCityVariants(n){
  if(!n?.cities)return;
  n.cities.forEach(c=>{if(!Number.isInteger(c.citySeed))c.citySeed=hashCity(`${n.name}:${c.name}`);});
  const names=[
    ['Eastport','Coastal Port'],['Westhaven','Industrial City'],['Lakeside','Tourism City'],
    ['Highland','Mountain Town'],['New Meridian','University City'],['Southgate','Satellite City'],
    ['Greenvale','Agricultural Town'],['Old Quarter','Historic City'],['Brighton','Regional City'],
    ['Ironridge','Resource City'],['Meadowbrook','Agricultural Town'],['Harborview','Port City'],
    ['Pinecrest','Mountain Town'],['Centralia','Regional City'],['Grand Junction','Transport City'],
    ['Rivermouth','River City'],['Sunvale','Tourism City'],['Northgate','Satellite City'],
    ['Stonebridge','Historic City'],['Cedar Falls','Regional City'],['Oakridge','Research City'],
    ['Bayview','Coastal City'],['Mapleford','Regional City'],['Kingsway','Metropolitan City']
  ];
  const target=Math.min(25,3+Math.max(0,(n.cityLevel||3)-2)*2);
  for(let i=n.cities.length;i<target;i++){
    const [name,type]=names[i-3]||[`District ${i+1}`,'Regional City'];
    n.cities.push({name,type,level:1,pop:Math.max(18000,Math.round(n.population*(0.025+((i%4)*.004)))),income:380000+i*28000,happiness:62+(i%9),citySeed:hashCity(`${n.name}:${name}`)});
  }
}


const storeDefs=[
 {id:'factory',name:'Factory',desc:'+120K/day · 5x Production',cost:2500000,inc:120000,req:1,cat:'Economic',img:'factory.svg'},
 {id:'university',name:'University',desc:'+Research · +Education',cost:3200000,inc:70000,req:2,cat:'Civic',img:'university.svg'},
 {id:'railway',name:'Railway',desc:'+Logistics · +Trade',cost:4800000,inc:180000,req:2,cat:'Economic',img:'railway.svg'},
 {id:'airport',name:'Airport',desc:'+Tourism · +Trade',cost:6000000,inc:240000,req:3,cat:'Luxury',img:'airport.svg'},
 {id:'hospital',name:'Hospital',desc:'+Health · +Happiness',cost:2800000,inc:65000,req:2,cat:'Civic',img:'hospital.svg'},
 {id:'stadium',name:'Stadium',desc:'+Culture · +Happiness',cost:3500000,inc:85000,req:3,cat:'Culture',img:'stadium.svg'},
 {id:'research',name:'Technology Campus',desc:'+Innovation · +Income',cost:7200000,inc:420000,req:4,cat:'Economic',img:'research.svg'},
 {id:'finance',name:'Financial Center',desc:'+Commerce · +Trade',cost:9500000,inc:520000,req:5,cat:'Luxury',img:'finance.svg'}
];
const BUILD_DEFS=[
 {id:'cottage',name:'Cozy Cottage',icon:'🏡',cat:'Residential',cost:220000,jobs:1,pop:80,happy:1,desc:'Small homes that make a neighborhood feel lived in.'},
 {id:'apartment',name:'Apartment House',icon:'🏢',cat:'Residential',cost:620000,jobs:4,pop:260,happy:.5,desc:'More homes without spreading the city too far.'},
 {id:'shop',name:'Local Shop',icon:'🏪',cat:'Commercial',cost:380000,income:52000,jobs:6,happy:.5,desc:'A little business for the neighborhood.'},
 {id:'cafe',name:'Corner Café',icon:'☕',cat:'Commercial',cost:290000,income:38000,jobs:4,happy:1,desc:'A cozy meeting place for residents.'},
 {id:'school',name:'Neighborhood School',icon:'🏫',cat:'Civic',cost:760000,jobs:12,pop:0,happy:2,education:2,desc:'Improves education and family life.'},
 {id:'clinic',name:'Community Clinic',icon:'🏥',cat:'Civic',cost:680000,jobs:10,happy:2,health:2,desc:'Keeps the neighborhood healthy.'},
 {id:'park',name:'Pocket Park',icon:'🌳',cat:'Nature',cost:180000,happy:3,green:2,desc:'Trees, benches and breathing room.'},
 {id:'market',name:'Market Square',icon:'🧺',cat:'Commercial',cost:460000,income:72000,jobs:8,happy:2,trade:2,desc:'A lively place to buy and sell local goods.'},
 {id:'workshop',name:'Workshop',icon:'🏭',cat:'Industrial',cost:980000,income:130000,jobs:24,industry:3,happy:-1,pollution:1,desc:'Creates jobs and production, with a little pollution.'},
 {id:'warehouse',name:'Warehouse',icon:'📦',cat:'Industrial',cost:720000,income:88000,jobs:14,trade:2,desc:'Stores and moves the goods your city produces.'},
 {id:'station',name:'Rail Station',icon:'🚉',cat:'Infrastructure',cost:1450000,income:110000,jobs:18,trade:4,desc:'Connects the city to the national network.'},
 {id:'museum',name:'Local Museum',icon:'🏛️',cat:'Culture',cost:900000,income:26000,jobs:9,happy:3,culture:3,desc:'Turns local history into a reason to visit.'},
 {id:'stadium',name:'Community Stadium',icon:'🏟️',cat:'Culture',cost:2100000,income:95000,jobs:30,happy:4,culture:4,desc:'A big landmark for sports and celebrations.'},
 {id:'university',name:'University',icon:'🎓',cat:'Civic',cost:2800000,income:160000,jobs:45,happy:2,education:5,technology:3,desc:'Creates research, talent and a younger city.'}
];
const ZONE_DEFS=[
 {id:'residential',name:'Residential',icon:'🏠',effect:'Housing capacity +',desc:'Reserve land for homes.'},
 {id:'commercial',name:'Commercial',icon:'🛍️',effect:'Local trade +',desc:'Reserve land for shops and cafés.'},
 {id:'industrial',name:'Industrial',icon:'🏭',effect:'Jobs & production +',desc:'Keep heavy activity away from homes.'},
 {id:'park',name:'Green Space',icon:'🌿',effect:'Happiness +',desc:'Leave breathing room for parks.'}
];
const OPPORTUNITIES=[
 {id:'deliveries',title:'Sort the Market Deliveries',icon:'📦',cat:'Economy',cost:45000,reward:120000,happy:1,xp:65,steps:['Put food in the grocery stall','Put books in the bookshop','Put flowers in the garden stall']},
 {id:'park',title:'Decorate the Pocket Park',icon:'🌳',cat:'Nature',cost:35000,reward:0,happy:4,xp:60,steps:['Plant a tree','Place a bench','Add a flower bed']},
 {id:'cafe',title:'Help the Corner Café',icon:'☕',cat:'Business',cost:55000,reward:95000,happy:2,xp:70,steps:['Take an order','Serve the customer','Clean the table']},
 {id:'museum',title:'Assemble a Local Artifact',icon:'🖼️',cat:'Culture',cost:30000,reward:65000,happy:2,xp:75,steps:['Find the first fragment','Find the second fragment','Place the artifact in the case']},
 {id:'rail',title:'Connect the Station',icon:'🚉',cat:'Infrastructure',cost:90000,reward:150000,happy:1,xp:90,steps:['Connect the east track','Connect the west track','Open the platform']},
 {id:'neighbors',title:'Listen to Residents',icon:'👥',cat:'People',cost:15000,reward:0,happy:5,xp:80,steps:['Hear the first request','Choose a solution','Tell the neighborhood what changed']},
 {id:'garden',title:'Grow a Community Garden',icon:'🌱',cat:'Nature',cost:25000,reward:30000,happy:4,xp:65,steps:['Prepare the soil','Plant vegetables','Open the garden to neighbors']},
 {id:'construction',title:'Finish a Building',icon:'🔨',cat:'Build',cost:70000,reward:100000,happy:1,xp:85,steps:['Finish the foundation','Raise the walls','Open the doors']}
];

const defaultState={screen:'landing',nation:null,lastSeen:Date.now(),toast:'',awayEarned:0,ui:{sidebarCollapsed:false,mobileNav:false}};
const cozyMoments=[
 {id:'market',title:'Sunday Market',desc:'Set up a little market square. Citizens browse, chat and spend.',cost:180000,reward:260000,happy:3,xp:90,icon:'🧺',costAP:1,cat:'Economy'},
 {id:'park',title:'Plant a Pocket Park',desc:'Give a neighborhood somewhere quiet to sit under the trees.',cost:120000,reward:0,happy:4,xp:80,icon:'🌳',costAP:1,cat:'Improve'},
 {id:'cafe',title:'Open a Corner Café',desc:'A tiny café becomes a favorite meeting place.',cost:150000,reward:210000,happy:2,xp:75,icon:'☕',costAP:1,cat:'Business'},
 {id:'playground',title:'Build a Playground',desc:'Add swings and a little play space for local families.',cost:90000,reward:0,happy:3,xp:65,icon:'🛝',costAP:1,cat:'Improve'},
 {id:'library',title:'Open a Neighborhood Library',desc:'Books, study tables and a warm place to spend an afternoon.',cost:220000,reward:0,happy:4,xp:110,icon:'📚',costAP:1,cat:'People'},
 {id:'festival',title:'Lantern Evening',desc:'A small evening festival fills the streets with music and lights.',cost:250000,reward:330000,happy:6,xp:130,icon:'🏮',costAP:2,cat:'Fun'},
 {id:'clean',title:'Clean-Up Day',desc:'Citizens volunteer to tidy streets and public spaces.',cost:45000,reward:0,happy:2,xp:55,icon:'🧹',costAP:1,cat:'Improve'},
 {id:'street',title:'Pretty Up a Street',desc:'Fresh paving, planters and lights turn an ordinary street into a favorite walk.',cost:140000,reward:0,happy:3,xp:70,icon:'🌷',costAP:1,cat:'Improve'},
 {id:'museum',title:'Open a Tiny Exhibit',desc:'Display a local treasure and attract curious visitors.',cost:175000,reward:120000,happy:3,xp:95,icon:'🖼️',costAP:1,cat:'Culture'},
 {id:'neighbors',title:'Neighborhood Gathering',desc:'Listen to residents and help them solve a small local problem.',cost:60000,reward:0,happy:5,xp:85,icon:'👥',costAP:1,cat:'People'},
 {id:'garden',title:'Community Garden',desc:'Turn an empty corner into a shared garden.',cost:80000,reward:40000,happy:4,xp:70,icon:'🌱',costAP:1,cat:'Improve'},
 {id:'concert',title:'Small Street Concert',desc:'Local musicians bring the square to life.',cost:190000,reward:150000,happy:5,xp:105,icon:'🎵',costAP:2,cat:'Fun'}
];
const dailyEvents=[
 {id:'sunny',icon:'☀️',title:'A Bright Day',desc:'People are out and about. Parks and cafés feel especially lively.',bonus:{happy:1}},
 {id:'rain',icon:'🌧️',title:'A Rainy Day',desc:'The streets are wet, but cafés and libraries are unusually busy.',bonus:{income:0.08}},
 {id:'festival',icon:'🎪',title:'Festival Weekend',desc:'Festive spirit fills the streets. Fun activities give extra happiness.',bonus:{happy:2,fun:0.25}},
 {id:'market',icon:'🧺',title:'Market Day',desc:'Local stalls are everywhere. Economy activities earn more today.',bonus:{reward:0.18}},
 {id:'garden',icon:'🌱',title:'Green Week',desc:'Residents want a greener neighborhood. Improvement activities feel extra rewarding.',bonus:{happy:2,improve:0.25}},
 {id:'heritage',icon:'🏛️',title:'Heritage Day',desc:'People are curious about the stories behind your cities.',bonus:{culture:0.25}}
];
const seasons=['Summer','Monsoon','Autumn','Winter','Spring'];
function internalDate(n){const day=Math.max(1,n?.cozy?.dayIndex||1),year=Math.floor((day-1)/25)+1,dayOfYear=((day-1)%25)+1,season=seasons[Math.floor((dayOfYear-1)/5)]||'Spring';return {day,year,dayOfYear,season};}
function dayKey(n=state?.nation){return `day-${Math.max(1,n?.cozy?.dayIndex||1)}`}
function cozyFor(n){
 n.cozy=n.cozy||{};
 n.cozy.dayIndex=Math.max(1,n.cozy.dayIndex||1);
 n.cozy.done=Array.isArray(n.cozy.done)?n.cozy.done:[];
 n.cozy.streak=Number(n.cozy.streak)||0;
 n.cozy.collection=Array.isArray(n.cozy.collection)?n.cozy.collection:[];
 n.cozy.selectedCity=clamp(Number(n.cozy.selectedCity)||0,0,Math.max(0,(n.cities?.length||1)-1));
 n.cozy.activeOpportunity=n.cozy.activeOpportunity||null;
 n.cozy.opportunityStep=Number(n.cozy.opportunityStep)||0;
 if(n.cozy.day!==dayKey(n)) startCozyDay(n);
 return n.cozy;
}
function dailyEvent(n){return dailyEvents[hashCity(`${n.name}:${n.cozy?.dayIndex||1}`)%dailyEvents.length]||dailyEvents[0]}
function selectedCity(){const n=state.nation;cozyFor(n);return n.cities[clamp(Number(n.cozy.selectedCity)||0,0,Math.max(0,n.cities.length-1))]||n.cities[0]}
function chooseCity(i){const n=state.nation;cozyFor(n);n.cozy.selectedCity=clamp(Number(i)||0,0,n.cities.length-1);save();renderGame()}
function startCozyDay(n){
 n.cozy=n.cozy||{};n.cozy.day=n.cozy.day||dayKey(n);n.cozy.done=[];n.cozy.failed=[];n.cozy.won=[];n.cozy.dayEnded=false;n.cozy.activeOpportunity=null;n.cozy.opportunityStep=0;
 const seed=hashCity(`${n.name}:${n.cozy.dayIndex}`);const picks=[];for(let i=0;i<5;i++)picks.push(OPPORTUNITIES[(seed+i*3)%OPPORTUNITIES.length].id);n.cozy.tasks=[...new Set(picks)];while(n.cozy.tasks.length<5){const extra=OPPORTUNITIES[(seed+n.cozy.tasks.length*7+11)%OPPORTUNITIES.length].id;if(!n.cozy.tasks.includes(extra))n.cozy.tasks.push(extra);}
 n.cozy.eventId=dailyEvents[seed%dailyEvents.length].id;n.cozy.mailbox=n.cozy.mailbox||[];
}
function activeOpportunity(n){cozyFor(n);return OPPORTUNITIES.find(x=>x.id===n.cozy.activeOpportunity)||null}
const MINI_GAMES=[
 {id:'rps',name:'Rock, Paper, Scissors',icon:'✊',desc:'Beat the town challenger. Play as many rounds as you like.'},
 {id:'ttt',name:'Tic-Tac-Toe',icon:'⭕',desc:'Outsmart the town champion on a little 3×3 board.'},
 {id:'coin',name:'Heads or Tails',icon:'🪙',desc:'Call the flip. Keep playing until you feel lucky.'},
 {id:'fingers',name:'Most Fingers Wins',icon:'🖐️',desc:'Choose 0–5 fingers. The town chooses too; highest number wins.'}
];
function gameForOpportunity(n,id){const z=cozyFor(n);const idx=z.tasks.indexOf(id);const seed=hashCity(`${n.name}:${z.dayIndex}:${id}:game`);return MINI_GAMES[(seed+(idx<0?0:idx))%MINI_GAMES.length];}
function randomMiniGame(){return MINI_GAMES[Math.floor(Math.random()*MINI_GAMES.length)];}
function miniGameDef(n){return MINI_GAMES.find(g=>g.id===n?.cozy?.activeGame?.type)||MINI_GAMES[0];}
function freshTtt(){return {board:Array(9).fill(''),turn:'X',winner:null};}
function beginOpportunity(id){
 const n=state.nation,z=cozyFor(n),op=OPPORTUNITIES.find(x=>x.id===id);
 if(!op||z.done.includes(id)||z.failed?.includes(id))return;
 if(n.money<op.cost)return toast(`You need ${money(op.cost)} for this.`);
 const game=gameForOpportunity(n,id);
 z.activeOpportunity=id;z.opportunityStep=0;
 z.activeGame={type:game.id,rounds:0,wins:0,losses:0,draws:0,score:0,streak:0,lastResult:'',ttt:freshTtt(),coin:null,fingers:null,rps:null};
 save();renderGame();
}
function completeWonActivity(op,g){
 const n=state.nation,z=cozyFor(n);n.money-=op.cost;
 const ev=dailyEvent(n),bonus=op.cat==='Nature'?(ev.bonus?.improve||0):op.cat==='Economy'?(ev.bonus?.reward||0):op.cat==='Culture'?(ev.bonus?.culture||0):op.cat==='Fun'?(ev.bonus?.fun||0):0;
 const reward=Math.round(op.reward*(1+bonus));n.money+=reward;n.xp+=op.xp;
 const mood=Math.round(op.happy);n.happiness=clamp(n.happiness+mood+(ev.bonus?.happy||0),0,100);const c=selectedCity();c.happiness=clamp((c.happiness||65)+mood,0,100);
 c.cozy=c.cozy||{projects:[],mood:0,decor:[],requests:[]};c.cozy.projects.push({id:op.id,at:z.dayIndex,game:g.type,wins:g.wins,rounds:g.rounds});c.cozy.mood=(c.cozy.mood||0)+mood;
 if(!z.collection.includes(op.id))z.collection.push(op.id);z.done.push(op.id);z.won.push(op.id);z.activeOpportunity=null;z.activeGame=null;z.opportunityStep=0;
 n.history.unshift(`${op.title}: won ${g.type} after ${g.rounds} round${g.rounds===1?'':'s'}.`);
 save();toast(`🏆 ${op.icon} ${op.title} won · ${money(reward)} earned`);renderGame();
}
function failActivity(op,g){
 const n=state.nation,z=cozyFor(n);z.failed=z.failed||[];if(!z.failed.includes(op.id))z.failed.push(op.id);z.activeOpportunity=null;z.activeGame=null;z.opportunityStep=0;
 n.history.unshift(`${op.title}: failed the ${miniGameDef({cozy:{activeGame:g}}).name}.`);
 save();toast(`❌ ${op.icon} ${op.title} failed. This activity is unavailable today.`);renderGame();
}
function resolveActivityResult(result){
 const n=state.nation,z=cozyFor(n),op=activeOpportunity(n),g=z.activeGame;if(!op||!g||!result||g.pendingResult)return;
 g.rounds++;
 if(result==='draw'){g.draws++;g.lastResult='draw';sfx('draw');save();renderGame();return;}
 g.lastResult=result;
 g.pendingResult=result;
 if(result==='win'){g.wins++;g.streak++;sfx('success');}
 else {g.losses++;g.streak=0;sfx('fail');}
 save();renderGame();
}
function closeActivityResult(){
 const n=state.nation,z=cozyFor(n),op=activeOpportunity(n),g=z.activeGame;if(!op||!g||!g.pendingResult)return;
 const result=g.pendingResult;g.pendingResult=null;
 if(result==='win')completeWonActivity(op,g);
 else failActivity(op,g);
}
function finishOpportunity(){
 const n=state.nation,z=cozyFor(n);if(z.activeOpportunity)return toast('Win or lose the activity first.');
}
function tttWinner(b){
 const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
 for(const [a,c,d] of lines)if(b[a]&&b[a]===b[c]&&b[a]===b[d])return b[a];return b.every(Boolean)?'draw':null;
}
function tttAi(b){
 const empty=b.map((v,i)=>v?null:i).filter(v=>v!==null);if(!empty.length)return;
 // The town champion is intentionally fallible: it should feel like a cozy
 // resident challenge, not an unwinnable minimax puzzle. It only plays a
 // tactical move occasionally, otherwise it chooses a plausible open square.
 if(Math.random()<0.34){
  for(const mark of ['O','X'])for(const i of empty){const x=b.slice();x[i]=mark;if(tttWinner(x)===mark)return i;}
 }
 if(Math.random()<0.35 && empty.includes(4))return 4;
 const preferred=empty.filter(i=>[0,2,6,8].includes(i));
 if(preferred.length&&Math.random()<0.55)return preferred[Math.floor(Math.random()*preferred.length)];
 return empty[Math.floor(Math.random()*empty.length)];
}
function miniGameAction(action,value){
 const n=state.nation,z=cozyFor(n),g=z.activeGame;if(!g||g.revealing)return;let result='';g.revealing=true;
 if(g.type==='rps'){
  const choices=['rock','paper','scissors'],player=String(value),ai=choices[Math.floor(Math.random()*3)];g.rps={player,ai,revealing:true};result=player===ai?'draw':((player==='rock'&&ai==='scissors')||(player==='paper'&&ai==='rock')||(player==='scissors'&&ai==='paper'))?'win':'loss';
 }else if(g.type==='coin'){
  const player=String(value),ai=(window.crypto?.getRandomValues ? (window.crypto.getRandomValues(new Uint32Array(1))[0] % 2 ? 'heads' : 'tails') : (Math.random()<.5?'heads':'tails'));sfx('coin');g.coin={player,ai,flipping:true};result=player===ai?'win':'loss';
 }else if(g.type==='fingers'){
  const player=Math.max(0,Math.min(5,Number(value)||0)),ai=Math.floor(Math.random()*6);g.fingers={player,ai,revealing:true};result=player===ai?'draw':player>ai?'win':'loss';
 }else if(g.type==='ttt'){
  const i=Number(value);if(!Number.isInteger(i)||i<0||i>8||g.ttt.board[i]){g.revealing=false;return;}
  g.ttt.board[i]='X';let w=tttWinner(g.ttt.board);if(!w){const ai=tttAi(g.ttt.board);if(ai!==undefined)g.ttt.board[ai]='O';w=tttWinner(g.ttt.board)||null;}if(w){result=w==='X'?'win':w==='O'?'loss':'draw';g.ttt=freshTtt();}
 }
 if(result){save();renderGame();setTimeout(()=>{if(g.type==='coin'&&g.coin)g.coin.flipping=false;if(g.rps)g.rps.revealing=false;if(g.fingers)g.fingers.revealing=false;g.revealing=false;resolveActivityResult(result);},g.type==='coin'?1250:650);}
 else{g.revealing=false;save();renderGame();}
}
function cancelOpportunity(){const n=state.nation;cozyFor(n);n.cozy.activeOpportunity=null;n.cozy.activeGame=null;n.cozy.opportunityStep=0;save();renderGame()}
function endDay(){
 const n=state.nation,z=cozyFor(n);if(z.dayEnded)return toast('Today has already ended.');
 const wins=z.won?.length||0,losses=z.failed?.length||0;if(wins<3&&losses<3)return toast(`Win 3 activities to move on, or lose 3 and pay ${money(1000000)} to move on.`);
 const penalty=losses>=3&&wins<3?1000000:0;if(penalty&&n.money<penalty)return toast(`You need ${money(penalty)} to move to the next day.`);
 const endingDay=z.dayIndex,ev=dailyEvent(n),daily=Math.max(0,Math.round(income()*(1+(ev.bonus?.income||0))));n.money=Math.max(0,Math.round(n.money+daily-penalty));n.awayEarned=(n.awayEarned||0)+daily;n.xp+=80+wins*28;n.population+=Math.max(25,Math.round(n.population*.000012));
 n.cities.forEach(c=>{const b=c.buildings||[];const incomeBoost=b.reduce((a,x)=>a+(BUILD_DEFS.find(d=>d.id===x.id)?.income||0),0);c.income=(c.income||0)+Math.round((c.level||1)*14000)+incomeBoost*.04;if((c.cozy?.mood||0)>0)c.happiness=clamp((c.happiness||65)+.25,0,100);const homes=b.reduce((a,x)=>a+(BUILD_DEFS.find(d=>d.id===x.id)?.pop||0),0);c.pop=Math.round((c.pop||0)+homes*.006)});
 n.happiness=clamp(n.happiness+(wins>=3?1:.25),0,100);z.streak++;z.dayEnded=true;z.lastReport={day:endingDay,earned:daily-penalty,activities:z.done.length,wins,losses,penalty,event:ev.title,season:internalDate(n).season};
 const city=selectedCity(),names=['Mira','Arif','Nadia','Samir','Lina'],who=names[endingDay%names.length];n.cozy.mailbox=[{icon:'💌',title:`${who} noticed your work`,text:`“${city.name} feels a little more alive today.”`,day:endingDay},...(n.cozy.mailbox||[])].slice(0,8);
 if(endingDay%7===0)z.collection.push(`memory-${endingDay}`);const oldYear=internalDate(n).year;z.dayIndex=endingDay+1;z.day=dayKey(n);startCozyDay(n);const newYear=internalDate(n).year;n.history.unshift(`Day ${endingDay} ended: ${money(daily-penalty)} earned across ${wins} wins and ${losses} failed activities.${penalty?' $1M penalty paid.':''}`);if(newYear>oldYear){n.history.unshift(`Year ${oldYear} complete. ${n.name} begins Year ${newYear}.`);n.xp+=500;}
 save();toast(penalty?`🌙 Day complete · ${money(1000000)} penalty paid`:`🌙 Day complete · ${wins} activities won`);renderGame();
}
function visitCity(i){chooseCity(i);state.screen='citybuilder';save();renderGame();}

let state=load();
window.addEventListener('pagehide',()=>{try{save()}catch{}});
window.addEventListener('beforeunload',()=>{try{save()}catch{}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'){try{save()}catch{}}});
function load(){
  try{
    const keys=[...SAVE_KEYS,...OLD_KEYS].filter((v,i,a)=>a.indexOf(v)===i);
    for(const k of keys){
      const raw=localStorage.getItem(k);
      if(!raw)continue;
      const x=JSON.parse(raw);
      if(x?.nation){
        const restored={...defaultState,...x};
        restored.screen=['home','skills','store','development','buildings','cities','citybuilder','statistics','progress','map','history','settings','diplomacy'].includes(restored.screen)?restored.screen:'home';
        return migrate(restored);
      }
    }
  }catch(e){ console.warn('Nation save could not be read',e); }
  try{const raw=window.name;if(raw){const x=JSON.parse(raw);if(x?.nation)return migrate(x);}}catch(e){console.warn('Fallback nation save could not be read',e)}
  return {...defaultState};
}
function migrate(s){
  const n=s.nation;if(!n)return s;
  n.skills={industry:1,education:1,infrastructure:1,technology:1,health:1,commerce:1,culture:1,...n.skills};
  n.assets={...n.assets};n.cityLevel=n.cityLevel||3;n.reputation=n.reputation??32;n.happiness=n.happiness??68;n.xp=n.xp??384;n.money=n.money??12400000;n.population=n.population??1200000;n.cities=n.cities?.length?n.cities:[{name:n.name+' City',type:'Capital City',level:n.cityLevel,pop:n.population*.45,income:4800000,happiness:72}];
  n.history=n.history||[];n.created=n.created||Date.now();n.focus=n.focus||'industrial';s.ui={sidebarCollapsed:false,mobileNav:false,...(s.ui||{})};n.cozy=n.cozy||{};n.cozy.dayIndex=Math.max(1,n.cozy.dayIndex||1);n.cozy.activityUsed=Number(n.cozy.activityUsed)||0;n.cities.forEach(c=>{c.cozy=c.cozy||{projects:[],mood:0,decor:[],requests:[]};c.buildings=Array.isArray(c.buildings)?c.buildings:[];c.roads=Number(c.roads)||2;c.zones=c.zones||{residential:2,commercial:1,industrial:1,park:2};});cozyFor(n);ensureCityVariants(n);
  return s;
}
function save(){
  state.lastSeen=Date.now();
  const payload=JSON.stringify(state);
  try{for(const k of SAVE_KEYS)localStorage.setItem(k,payload);window.name=payload;}catch(e){try{window.name=payload}catch{} console.warn('Nation save failed',e);}
}
function skillCost(id){const lv=state.nation.skills[id]||1,d=skillDefs.find(x=>x.id===id);return Math.round(d.base*Math.pow(1.48,lv-1));}
function level(){let out=levels[0];for(const x of levels)if(state.nation.xp>=x.xp)out=x;return out;}
function nextLevel(){return levels[level().level]||null;}
function xpPct(){const l=level(),n=nextLevel();return n?clamp((state.nation.xp-l.xp)/(n.xp-l.xp)*100,0,100):100;}
function income(){const n=state.nation;let total=2430000;for(const d of skillDefs)total*=1+(Math.max(0,n.skills[d.id]-1)*d.gain*.18);for(const id in n.assets){const d=storeDefs.find(x=>x.id===id);if(d)total+=n.assets[id]*d.inc}return total*(focusDefs[n.focus]?.income||1)*(1+n.cityLevel*.055);}
function tick(){if(!state.nation)return;state.lastSeen=Date.now();}
function createNation(){
 const name=($('#nationName')?.value||'Novara').trim()||'Novara';
 const focus=$('#focus')?.value||'industrial';const terrain=$('#terrain')?.value||'Coastal';const gov=$('#gov')?.value||'Republic';const pop=Number($('#pop')?.value||1.2);
 const fd=focusDefs[focus]||focusDefs.industrial;
 const govMods={Republic:{money:0,reputation:4,happiness:3,skills:{commerce:1},asset:'market'},Kingdom:{money:800000,reputation:6,happiness:1,skills:{industry:1,culture:1},asset:'cottage'},Federation:{money:300000,reputation:3,happiness:2,skills:{infrastructure:1,education:1},asset:'station'},Commonwealth:{money:500000,reputation:5,happiness:2,skills:{commerce:1,culture:1},asset:'school'}}[gov];
 const terrainMods={Coastal:{money:450000,reputation:1,happiness:1,skills:{commerce:1},resources:{food:68,energy:72,materials:58},cityType:'Coastal Port',asset:'market'},'River Valley':{money:250000,reputation:0,happiness:4,skills:{health:1,commerce:1},resources:{food:84,energy:64,materials:55},cityType:'River Valley',asset:'cottage'},Highlands:{money:150000,reputation:1,happiness:2,skills:{infrastructure:1},resources:{food:62,energy:80,materials:72},cityType:'Highland Town',asset:'workshop'},Plains:{money:350000,reputation:0,happiness:3,skills:{industry:1},resources:{food:88,energy:66,materials:64},cityType:'Plains City',asset:'cottage'}}[terrain];
 const focusAsset={industrial:'workshop',commercial:'shop',agricultural:'market',technological:'university',cultural:'museum'}[focus];
 const baseMoney=12400000, basePop=pop*1e6;
 const startingMoney=Math.round(baseMoney+govMods.money+terrainMods.money+(fd.income-1)*450000);
 const startingRep=32+govMods.reputation+terrainMods.reputation+(focus==='cultural'?4:focus==='commercial'?3:0);
 const startingHappy=clamp(68+govMods.happiness+terrainMods.happiness+(focus==='agricultural'?3:focus==='technological'?1:0),45,90);
 const startingCityLevel=3+(focus==='industrial'||focus==='commercial'?1:0)+(terrain==='Coastal'?1:0);
 const capitalPop=Math.round(basePop*(terrain==='Coastal'?.46:.45));
 const cities=[
  {name:name+' City',type:terrainMods.cityType,level:startingCityLevel,pop:capitalPop,income:Math.round((4800000+startingMoney*.08)*(fd.income)),happiness:startingHappy,citySeed:hashCity(`${name}:${name} City`)},
  {name:'Riverbend',type:'Regional City',level:1,pop:Math.round(basePop*.12),income:720000,happiness:clamp(startingHappy-2,45,100),citySeed:hashCity(`${name}:Riverbend`)},
  {name:'Northfield',type:'Agricultural Town',level:1,pop:Math.round(basePop*.08),income:510000,happiness:clamp(startingHappy+1,45,100),citySeed:hashCity(`${name}:Northfield`)}
 ];
 state.nation={name,capital:name+' City',focus,terrain,government:gov,population:basePop,money:startingMoney,xp:384,skills:{industry:2,education:1,infrastructure:2,technology:1,health:1,commerce:1,culture:1},assets:{},cityLevel:startingCityLevel,reputation:startingRep,happiness:startingHappy,awayEarned:0,history:[`Founded as a ${gov.toLowerCase()} in a ${terrain.toLowerCase()} region. Starting resources were calculated from government, terrain, population and national focus.`],cities,created:Date.now(),cozy:{day:'',tasks:[],streak:0,collection:[],selectedCity:0},resources:{...terrainMods.resources}};
 // Focus, government and terrain all contribute to the starting capability package.
 for(const [k,v] of Object.entries(fd.skills||{}))state.nation.skills[k]=Math.max(state.nation.skills[k],v);
 for(const [k,v] of Object.entries(govMods.skills||{}))state.nation.skills[k]=(state.nation.skills[k]||1)+v;
 for(const [k,v] of Object.entries(terrainMods.skills||{}))state.nation.skills[k]=(state.nation.skills[k]||1)+v;
 state.nation.assets[focusAsset]=1;state.nation.assets[govMods.asset]=(state.nation.assets[govMods.asset]||0)+1;state.nation.assets[terrainMods.asset]=(state.nation.assets[terrainMods.asset]||0)+1;
 // Give the capital a small, calculated starter neighborhood so the city is never empty.
 const starter=[{id:'cottage',slot:0,level:1},{id:'cottage',slot:1,level:1},{id:focus==='commercial'?'shop':focus==='industrial'?'workshop':focus==='technological'?'university':focus==='cultural'?'museum':'market',slot:2,level:1},{id:'park',slot:3,level:1},{id:govMods.asset,slot:4,level:1},{id:terrainMods.asset,slot:5,level:1}];
 cities[0].buildings=starter.filter((x,i,a)=>x.id&&a.findIndex(y=>y.id===x.id&&y.slot===x.slot)===i);
 state.nation.cities.forEach(c=>{c.buildings=c.buildings||[];c.roads=2+(c===cities[0]?1:0);c.zones={residential:2,commercial:1,industrial:1,park:2};c.cozy={projects:[],mood:0,decor:[],requests:[]}});
 state.nation.history.unshift(`Starting package: ${terrain} geography + ${gov} institutions + ${fd.name} focus.`);
 state.screen='home';state.lastSeen=Date.now();save();showGame();sfx('success');toast(`Nation forged. ${terrain} + ${fd.name} starting package applied.`);
}
function newNation(){if(confirm('Start a new nation? Your current nation will be replaced.')){try{[...new Set([...SAVE_KEYS,...OLD_KEYS])].forEach(k=>localStorage.removeItem(k));}catch{}try{window.name='';}catch{}state={...defaultState,screen:'landing'};showLanding();}}
function upgradeSkill(id){const n=state.nation,c=skillCost(id),d=skillDefs.find(x=>x.id===id);if(!Number.isFinite(c)||c<0)return toast('This upgrade cost could not be calculated.');if(n.money<c)return toast('You need more national wealth.');n.money=Math.max(0,Math.round(n.money-c));n.skills[id]++;n.xp+=Math.round(c/28000)+70;n.history.unshift(`${d.name} advanced to Level ${n.skills[id]}.`);save();toast(`${d.name} upgraded`);renderGame();}
function buyAsset(id){const n=state.nation,d=storeDefs.find(x=>x.id===id);if(!d)return;if(level().level<d.req)return toast(`Reach Level ${d.req} to unlock this.`);if(!Number.isFinite(d.cost)||d.cost<0)return toast('This purchase cost could not be calculated.');if(n.money<d.cost)return toast('Not enough national wealth.');n.money=Math.max(0,Math.round(n.money-d.cost));n.assets[id]=(n.assets[id]||0)+1;n.xp+=Math.round(d.cost/20000);if(id==='stadium')n.happiness=Math.min(100,n.happiness+3);if(id==='hospital')n.happiness=Math.min(100,n.happiness+4);if(id==='finance')n.reputation+=4;n.history.unshift(`${d.name} was built in ${n.name}.`);save();toast(`${d.name} built`);renderGame();}
function upgradeCity(){const n=state.nation,c=selectedCity(),cost=Math.round(1800000*Math.pow(1.48,Math.max(0,(c.level||1)-1)));if(!Number.isFinite(cost)||cost<0)return toast('This city upgrade cost could not be calculated.');if(n.money<cost)return toast('Not enough wealth to upgrade this city.');n.money=Math.max(0,Math.round(n.money-cost));c.level=(c.level||1)+1;c.pop=Math.round(c.pop*1.10);c.income=(c.income||0)+420000;c.happiness=Math.min(100,(c.happiness||65)+1);n.cityLevel=Math.max(n.cityLevel||1,c.level);n.happiness=Math.min(100,n.happiness+1);n.xp+=Math.round(cost/18000);n.history.unshift(`${c.name} reached City Level ${c.level}.`);ensureCityVariants(n);save();toast(`${c.name} grew into a larger city`);renderGame();}
function buildCost(def,c){return Math.round(def.cost*Math.pow(1.14,(c.buildings||[]).filter(x=>x.id===def.id).length));}
const LOTS=[[-4.8,-4.1],[-2.4,-4.1],[0,-4.1],[2.4,-4.1],[4.8,-4.1],[-4.8,-1.6],[-2.4,-1.6],[2.4,-1.6],[4.8,-1.6],[-4.8,1.6],[-2.4,1.6],[2.4,1.6],[4.8,1.6],[-4.8,4.1],[-2.4,4.1],[0,4.1],[2.4,4.1],[4.8,4.1]];
function buildInCity(id){const n=state.nation,c=selectedCity(),def=BUILD_DEFS.find(x=>x.id===id);if(!def)return;const cost=buildCost(def,c);if(!Number.isFinite(cost)||cost<0)return toast('This building cost could not be calculated.');if(n.money<cost)return toast(`You need ${money(cost)} for ${def.name}.`);if((c.level||1)<(def.cat==='Civic'&&id==='university'?4:def.cat==='Infrastructure'?2:1))return toast('Grow the city further to unlock this.');const used=new Set((c.buildings||[]).map(x=>x.slot));const slot=LOTS.findIndex((_,i)=>!used.has(i));if(slot<0)return toast('All planned lots are occupied. Upgrade the city to unlock more land.');n.money=Math.max(0,Math.round(n.money-cost));c.buildings=c.buildings||[];c.buildings.push({id,slot,level:1});c.income=(c.income||0)+(def.income||0);c.happiness=clamp((c.happiness||65)+(def.happy||0),0,100);c.pop=Math.round((c.pop||0)+(def.pop||0)*.1);n.xp+=Math.round(cost/18000)+35;if(def.cat==='Nature')c.zones.park++;if(def.cat==='Residential')c.zones.residential++;if(def.cat==='Commercial')c.zones.commercial++;if(def.cat==='Industrial')c.zones.industrial++;n.history.unshift(`${def.name} was built in ${c.name}.`);save();toast(`${def.icon} ${def.name} opened in ${c.name}`);renderGame();}
function addRoadToCity(){const n=state.nation,c=selectedCity(),cost=Math.round(260000*Math.pow(1.12,Math.max(0,c.roads||2)-2));if(n.money<cost)return toast(`You need ${money(cost)} for a new road.`);if((c.roads||2)>=10+(c.level||1)*2)return toast('The current road network is already extensive.');n.money-=cost;c.roads=(c.roads||2)+1;c.income=(c.income||0)+18000;c.happiness=clamp((c.happiness||65)+.25,0,100);n.xp+=45;n.history.unshift(`A new road opened in ${c.name}.`);save();toast('🛣️ Road extended');renderGame();}
function zoneCity(id){const c=selectedCity();c.zones=c.zones||{};c.zones[id]=(c.zones[id]||0)+1;c.happiness=clamp((c.happiness||65)+(id==='park'?1:.15),0,100);save();toast(`${ZONE_DEFS.find(z=>z.id===id)?.icon||'◈'} ${ZONE_DEFS.find(z=>z.id===id)?.name||id} land reserved`);renderGame();}

function collectAway(){tick();const e=state.nation.awayEarned||0;state.nation.awayEarned=0;save();toast(e>0?`Collected ${money(e)} while you were away`:'No pending rewards');renderGame();}
function continuePlaying(){tick();state.screen='home';save();renderGame();const el=document.querySelector('.dashboardgrid');el?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>toast('Welcome back to your nation.'),120);}
function toast(msg){state.toast=msg;renderGame();clearTimeout(window.__toast);window.__toast=setTimeout(()=>{state.toast='';renderGame()},2200)}
function credits(){return `<div class="credits">Made by Sajid<br><span>Instagram: <a href="https://www.instagram.com/sajidaddin" target="_blank" rel="noopener noreferrer">@sajidaddin</a> · <a href="https://www.instagram.com/sajidphobic" target="_blank" rel="noopener noreferrer">@sajidphobic</a></span></div>`;}
function icon(s,cls=''){return `<span class="uiicon ${cls}">${s}</span>`;}
/* Audio: CC0 ambient loop + WebAudio tactile UI layer. Browsers require the first user gesture before sound can begin. */
const AUDIO={ctx:null,ready:false,tracks:[],trackIndex:-1,loopTimer:null};
const BGM_TRACKS=[
 {name:'Relax Background',url:'https://opengameart.org/sites/default/files/relax_background1_0.ogg'},
 {name:'Calm Loop',url:'https://opengameart.org/sites/default/files/Relaxing_0.mp3'},
 {name:'Calm Theme',url:'https://opengameart.org/sites/default/files/calm_theme.ogg'},
 {name:'Simple Menu Loop',url:'https://opengameart.org/sites/default/files/simple_loop.ogg'}
];
function soundEnabled(){return !state.ui?.soundMuted;}
function ensureAudio(){
 if(AUDIO.ready)return;
 AUDIO.ready=true;
 try{AUDIO.ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}
 AUDIO.tracks=BGM_TRACKS.map(t=>{const a=new Audio(t.url);a.preload='auto';a.volume=.085;a.addEventListener('ended',advanceMusic);return a;});
 if(soundEnabled())startMusic();
}
function pickNextTrack(){
 if(!AUDIO.tracks.length)return null;
 let next=Math.floor(Math.random()*AUDIO.tracks.length);
 if(AUDIO.tracks.length>1&&next===AUDIO.trackIndex)next=(next+1)%AUDIO.tracks.length;
 AUDIO.trackIndex=next;return AUDIO.tracks[next];
}
function advanceMusic(){
 if(!soundEnabled())return;
 if(AUDIO.loopTimer){clearTimeout(AUDIO.loopTimer);AUDIO.loopTimer=null;}
 const next=pickNextTrack();
 if(next){next.currentTime=0;const p=next.play();if(p?.catch)p.catch(()=>{});scheduleTrackCutoff(next);}
}
function scheduleTrackCutoff(a){
 if(AUDIO.loopTimer)clearTimeout(AUDIO.loopTimer);
 AUDIO.loopTimer=setTimeout(()=>{
   AUDIO.loopTimer=null;
   if(!soundEnabled()||AUDIO.tracks[AUDIO.trackIndex]!==a)return;
   a.pause();a.currentTime=0;advanceMusic();
 },60000);
}
function startMusic(){
 ensureAudio();if(!soundEnabled()||!AUDIO.tracks.length)return;
 if(AUDIO.ctx?.state==='suspended')AUDIO.ctx.resume();
 let a=AUDIO.tracks[AUDIO.trackIndex];if(!a||a.ended||a.paused&&AUDIO.trackIndex<0)a=pickNextTrack();
 if(a){const p=a.play();if(p?.catch)p.catch(()=>{});scheduleTrackCutoff(a);}
}
function stopMusic(){if(AUDIO.loopTimer){clearTimeout(AUDIO.loopTimer);AUDIO.loopTimer=null;}AUDIO.tracks.forEach(a=>{a.pause();a.currentTime=0;});}
function tone(freq,dur,type='sine',gain=.025,delay=0){if(!soundEnabled()||!AUDIO.ctx)return;const c=AUDIO.ctx,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,c.currentTime+delay);g.gain.setValueAtTime(.0001,c.currentTime+delay);g.gain.exponentialRampToValueAtTime(gain,c.currentTime+delay+.008);g.gain.exponentialRampToValueAtTime(.0001,c.currentTime+delay+dur);o.connect(g).connect(c.destination);o.start(c.currentTime+delay);o.stop(c.currentTime+delay+dur+.02);}
function sfx(kind='click'){ensureAudio();if(!soundEnabled())return;if(AUDIO.ctx?.state==='suspended')AUDIO.ctx.resume();if(kind==='click'){tone(520,.045,'sine',.018);tone(760,.025,'sine',.008,.018)}else if(kind==='open'){tone(360,.06,'sine',.018);tone(620,.09,'sine',.012,.035)}else if(kind==='success'){tone(520,.07,'sine',.025);tone(660,.08,'sine',.022,.06);tone(820,.13,'sine',.018,.13)}else if(kind==='fail'){tone(190,.11,'triangle',.025);tone(140,.16,'triangle',.018,.08)}else if(kind==='draw'){tone(430,.08,'sine',.018);tone(430,.08,'sine',.012,.11)}else if(kind==='coin'){tone(720,.035,'triangle',.012);tone(920,.035,'triangle',.012,.04);tone(1120,.06,'triangle',.01,.08)}}
function toggleSound(){state.ui=state.ui||{};state.ui.soundMuted=!state.ui.soundMuted;save();ensureAudio();if(state.ui.soundMuted)stopMusic();else{startMusic();sfx('success')}renderGame();}
function topbar(){const n=state.nation;return `<header class="topbar"><div class="topleft"><button class="menubtn" data-action="toggle-sidebar" aria-label="Toggle navigation">☰</button><button class="soundbtn" data-action="toggle-sound" aria-label="Toggle sound">${state.ui?.soundMuted?'🔇':'🔊'}</button><div class="topactions"><button class="topaction primary" data-action="continue">▶ <span>Continue Nation</span></button><button class="topaction secondary" data-action="new">＋ <span>New Nation</span></button></div><div class="daystatus"><span>Year ${internalDate(n).year}</span><b>${internalDate(n).season} · Day ${internalDate(n).dayOfYear}</b></div></div><div class="topbrand">FORGE A NATION</div><div class="topstats"><div class="topstat">${icon('◉','goldic')}<span><b>${money(n.money)}</b><small>Money</small></span></div><div class="topstat">${icon('♟','blueic')}<span><b>${fmt(n.population/1e6)}M</b><small>Population</small></span></div><div class="topstat">${icon('★','goldic')}<span><b>${Math.round(n.reputation)}</b><small>Reputation</small></span></div><div class="topcredit">Made by <b>Sajid</b><span class="topcredit-links"><a href="https://www.instagram.com/sajidaddin" target="_blank" rel="noopener noreferrer">@sajidaddin</a><a href="https://www.instagram.com/sajidphobic" target="_blank" rel="noopener noreferrer">@sajidphobic</a></span></div></div></header>`;}
function mobileStatus(){const n=state.nation,d=internalDate(n);return `<div class="mobile-status"><div class="mobile-date"><b>Year ${d.year}</b><span>${d.season} · Day ${d.dayOfYear}</span></div><div class="mobile-stat"><small>Money</small><b>${money(n.money)}</b></div><div class="mobile-stat"><small>Population</small><b>${fmt(n.population/1e6)}M</b></div><div class="mobile-stat"><small>Reputation</small><b>${Math.round(n.reputation)}</b></div></div>`;}
function sidebar(){const items=[['home','⌂','Home'],['map','●','Map'],['cities','▥','Cities'],['citybuilder','🏗','Build City'],['buildings','▣','Buildings'],['skills','◈','Skills'],['development','◆','Development'],['store','▤','Store'],['statistics','▥','Statistics'],['history','▤','History'],['settings','⚙','Settings']];const collapsed=!!state.ui?.sidebarCollapsed;return `<aside class="sidebar ${collapsed?'collapsed':''} ${state.ui?.mobileNav?'mobile-open':''}" aria-label="Nation navigation"><div class="brand"><h1>FN</h1></div><div class="sidehint">${collapsed?'':'YOUR NATION'}</div><nav aria-label="Game sections">${items.map(([id,ic,label])=>`<button class="navitem ${state.screen===id?'active':''}" data-screen="${id}" title="${label}" aria-label="${label}">${icon(ic)}<span>${label}</span></button>`).join('')}</nav>${credits()}</aside><div class="navscrim ${state.ui?.mobileNav?'show':''}" data-action="close-mobile-nav"></div>`;}
function hero(){
 const n=state.nation,l=level(),z=cozyFor(n),ev=dailyEvent(n),daily=Math.round(income()),next=nextLevel();
 const wins=z.won?.length||0,losses=z.failed?.length||0,city=selectedCity();
 return `<section class="hero"><div class="hero-scene" id="hero-scene" aria-label="Artistic 3D national panorama"></div><div class="heroShade"></div><div class="heroContent"><div class="welcome"><small>Welcome Back,</small><h1>${esc(n.name)}</h1><p>A small nation with big dreams.</p></div><div class="nationcard"><div class="emblem">✦</div><div class="nationcardbody"><b>${esc(n.name)}</b><span>${l.name}</span><small>Lv. ${l.level}</small><div class="bar"><i style="width:${xpPct()}%"></i></div><em>${Math.floor(n.xp).toLocaleString()} / ${(next?.xp||n.xp).toLocaleString()}</em></div></div><button class="gold continue" data-action="continue">▶ &nbsp; Continue Playing</button></div><div class="metrics">${metric('◉','National Wealth',money(n.money),'+'+money(daily)+'/day')} ${metric('♟','Population',fmt(n.population/1e6)+'M','+8.6K/day')} ${metric('☺','Happiness',Math.round(n.happiness)+'%','+1.3%')} ${metric('★','Reputation',Math.round(n.reputation),'+2.4%')}</div><aside class="away pulse"><div class="pulsehead"><h3>National Pulse</h3><span>Day ${internalDate(n).dayOfYear}</span></div><div class="pulseevent">${ev.icon} <section><b>${esc(ev.title)}</b><small>${esc(ev.desc)}</small></section></div><div class="pulsegrid"><div><b>${money(daily)}</b><span>Projected daily income</span></div><div><b>${wins}/3</b><span>Activity wins</span></div><div><b>Lv. ${l.level}</b><span>National stage</span></div><div><b>${city.level}</b><span>${esc(city.name)} level</span></div></div><div class="pulsefooter"><span>${losses} failed activities</span><span>${next?Math.max(0,next.xp-n.xp).toLocaleString()+' XP to next stage':'Top stage reached'}</span></div></aside></section>`;
}
function metric(ic,title,value,delta){return `<div class="metric">${icon(ic)}<div><small>${title}</small><strong>${value}</strong><em>${delta}</em></div></div>`;}
function skillsCard(){const n=state.nation;return `<section class="panel skills-panel"><div class="paneltitle"><h2>National Skills</h2><button class="textbtn" data-screen="skills">View All</button></div>${skillDefs.map(d=>`<div class="skillrow"><div class="skillicon ${d.cls}">${d.icon}</div><div><b>${d.name}</b><small>Lv. ${n.skills[d.id]} · ${d.effect}</small></div><button class="mini greenbtn" data-skill="${d.id}">Upgrade<span>${money(skillCost(d.id))}</span></button></div>`).join('')}</section>`;}
function storeCard(){const n=state.nation;return `<section class="panel store-panel"><div class="paneltitle"><h2>Development Store</h2><button class="textbtn" data-screen="store">View All</button></div><div class="tabs"><button class="active">All</button><button>Economic</button><button>Civic</button><button>Culture</button><button>Luxury</button></div><div class="storelist">${storeDefs.slice(0,6).map(d=>{const ok=level().level>=d.req,can=n.money>=d.cost;return `<div class="storeitem"><img src="/${d.img}" alt=""><div><b>${d.name}</b><small>${d.desc}</small></div><strong>${money(d.cost)}</strong><button class="mini ${ok&&can?'greenbtn':'lockbtn'}" data-buy="${d.id}" ${ok&&can?'':'disabled'}>${ok?'Buy':'🔒'}</button></div>`}).join('')}</div></section>`;}
function cityCard(){const n=state.nation,c=n.cities[0],cityCost=Math.round(1800000*Math.pow(1.55,n.cityLevel-1));return `<section class="panel city-panel"><div class="paneltitle"><h2>City Overview</h2><button class="textbtn" data-screen="cities">View All</button></div><div class="cityimage city3d" data-city-scene="${esc(c.name)}"><span>Lv. ${c.level}</span></div><div class="cityhead"><div><b>${esc(c.name)}</b><small>◉ Capital City</small></div></div><div class="citystats"><div>${icon('♟')}<small>Population</small><b>${fmt(c.pop/1e6)}M</b><em>+3.2K/day</em></div><div>${icon('◉')}<small>Income</small><b>${money(c.income)}</b><em>+12%</em></div><div>${icon('♥')}<small>Happiness</small><b>${Math.round(c.happiness)}%</b><em>+4%</em></div></div><h3>City Buildings</h3>${['Residential Zone','Industrial Zone','Commercial Zone','Infrastructure'].map((x,i)=>`<div class="buildingrow"><div class="buildingbadge">${['⌂','▥','▣','◆'][i]}</div><div><b>${x}</b><small>Lv. ${Math.min(3,c.level)} · +${(i+1)*2}%</small></div><button class="mini greenbtn" data-action="cityup">Upgrade<span>${money(1600000+i*400000)}</span></button></div>`).join('')}<button class="cityupgrade gold" data-action="open-city-builder" data-city-index="0">Open City Builder</button><button class="cityupgrade outline" data-action="cityup">Upgrade City · ${money(cityCost)}</button></section>`;}
function progressCard(){const n=state.nation,l=level(),next=nextLevel();return `<section class="panel progress-panel"><div class="paneltitle"><h2>Development Progress</h2></div><div class="stage"><small>Current Stage</small><b>${l.name}</b><span>Lv. ${l.level}</span><div class="bar"><i style="width:${xpPct()}%"></i></div><em>${Math.floor(n.xp).toLocaleString()} / ${(next?.xp||n.xp).toLocaleString()}</em></div><div class="next"><small>Next Promotion</small><h3>${next?next.name:'World-Class Nation'}</h3>${next?`<p>Requirements:</p><div>✓ Reach ${next.xp.toLocaleString()} development XP</div><div>✓ Grow your national wealth</div><div>✓ Upgrade key capabilities</div><hr><p>Rewards:</p><div>+18% National Income</div><div>New buildings unlocked</div><button class="gold" data-screen="statistics">View Progression</button>`:`<p>Your nation has reached the highest stage.</p>`}</div></section>`;}
function globalCard(){return `<section class="panel global-panel"><div class="paneltitle"><h2>Global Standing</h2><button class="textbtn">View All</button></div><div class="diplomacy">${icon('◎')}<span><b>Diplomacy</b><small>Allies</small></span><b>›</b></div>${[['US','United States','Friendly +20'],['◇','Eurasia','Neutral +12'],['★','Al-Sham','Neutral +8'],['◉','Veridian','Tense -14']].map((x,i)=>`<div class="relation"><b>${x[0]}</b><span>${x[1]}</span><small class="${i===3?'bad':''}">${x[2]}</small></div>`).join('')}</section>`;}
function achievements(){const arr=[['⌂','Factory Built','Build your first factory','+10'],['◆','University','Build a university','+10'],['◉','First Export Deal','Trade internationally','+20'],['♟','Population Milestone','Reach 1 million population','+30'],['◎','Good Relations','Form an alliance','+15']];return `<section class="panel achievements"><div class="paneltitle"><h2>Achievements</h2><button class="textbtn">View All</button></div><div class="tabs"><button class="active">All</button><button>Trade</button><button>Relations</button></div>${arr.map((x,i)=>`<div><span class="achievementicon">${x[0]}</span><section><b>${x[1]}</b><small>${x[2]}</small></section><em>${i<1&&state.nation.assets.factory?x[3]:'+'+x[3].replace('+','')}</em></div>`).join('')}</section>`;}
function lower(){const n=state.nation,l=level();return `<section class="panel national-progress"><div class="paneltitle"><h2>National Progression</h2></div><div class="nodes">${levels.map(x=>`<div class="node ${x.level<=l.level?'done':''} ${x.level===l.level?'current':''}"><span>${x.level<=l.level?'◆':'◇'}</span><b>${x.name.replace(' Nation','')}</b><small>Lv. ${x.level}</small></div>`).join('')}</div></section><section class="panel activity"><div class="paneltitle"><h2>Recent Activity</h2></div>${n.history.slice(0,4).map((x,i)=>`<div>${icon(['◉','◆','⌂','♟'][i])}<span>${esc(x)}</span><small>${i+1}h ago</small></div>`).join('')}</section><section class="panel buildtomorrow"><img src="/hero-art.jpg" alt="Clean city illustration"><div><h2>Build a greater tomorrow</h2><p>Your decisions shape the future of ${esc(n.name)}.</p><button class="gold" data-screen="map">View Map</button></div></section>`;}
function cozyCard(){const n=state.nation,c=selectedCity(),z=cozyFor(n),ev=dailyEvent(n),d=internalDate(n);const tasks=z.tasks.map(id=>cozyMoments.find(x=>x.id===id)).filter(Boolean);const canEnd=z.activityUsed>=3&&!z.dayEnded;return `<section class="panel cozy-panel"><div class="paneltitle"><div><h2>Today in ${esc(c.name)}</h2><small>${d.season} · ${ev.icon} ${ev.title}</small></div><div class="dayactions"><span class="apbadge">${z.activityUsed}/10 AP</span>${canEnd?`<button class="gold endday" data-action="end-day">End Day →</button>`:''}</div></div><div class="daily-event"><b>${ev.icon} ${ev.title}</b><span>${ev.desc}</span></div><div class="citypick"><span>Visit</span><select data-city-select>${n.cities.map((x,i)=>`<option value="${i}" ${i===(z.selectedCity||0)?'selected':''}>${esc(x.name)}</option>`).join('')}</select><b>${Math.round(c.happiness||65)}% happy</b></div><div class="momentlist">${tasks.map(x=>{const done=z.done.includes(x.id),locked=z.activityUsed+(x.costAP||1)>10,can=n.money>=x.cost;return `<article class="moment ${done?'done':''}"><div class="momenticon">${x.icon}</div><div><b>${x.title}</b><small>${x.desc}</small><em>${x.costAP||1} AP · ${x.reward?`Earn ${money(x.reward)} · `:''}+${x.happy}% happiness</em></div><button class="mini ${done||locked?'lockbtn':'greenbtn'}" data-moment="${x.id}" ${done||locked||!can?'disabled':''}>${done?'Done':locked?'10 AP':can?'Do it':'Need '+money(x.cost)}</button></article>`}).join('')}</div><div class="dayfooter"><span>Do 3+ activities to unlock <b>End Day</b>.</span><span>Next year in ${30-d.dayOfYear} days</span></div></section>`;}
function mailboxCard(){const n=state.nation,z=cozyFor(n),m=(z.mailbox||[]).slice(0,3);return `<section class="panel mailbox"><div class="paneltitle"><h2>📬 Mailbox</h2><span>${m.length} new notes</span></div>${m.length?m.map(x=>`<div class="mailrow"><span>${x.icon}</span><section><b>${esc(x.title)}</b><small>${esc(x.text)}</small></section></div>`).join(''):`<div class="emptybox">Your mailbox is quiet. Someone will write soon.</div>`}</section>`;}
function reportCard(){const n=state.nation,z=cozyFor(n),r=z.lastReport;return `<section class="panel reportcard"><div class="paneltitle"><h2>🌙 Last Day</h2><span>${r?`Day ${r.day}`:'Not yet'}</span></div>${r?`<div class="reportgrid"><div><b>${money(r.earned)}</b><small>earned</small></div><div><b>${r.activities}</b><small>activities</small></div><div><b>${esc(r.season)}</b><small>season</small></div></div><p>${esc(r.event)} made the day feel a little different.</p>`:`<div class="emptybox">Finish your first day to see its little story here.</div>`}</section>`;}
function collectionCard(){const n=state.nation,z=cozyFor(n),items=z.collection||[];return `<section class="panel collection"><div class="paneltitle"><h2>🎒 Nation Collection</h2><button class="textbtn" data-screen="history">Scrapbook</button></div><div class="collectgrid">${items.slice(-8).map((x,i)=>`<div title="Discovered on Day ${Math.max(1,z.dayIndex-i)}"><span>${x.startsWith('memory')?'📷':(cozyMoments.find(m=>m.id===x)?.icon||'✨')}</span><small>${x.startsWith('memory')?'Memory':'Keepsake'}</small></div>`).join('')||'<div class="emptybox">Little discoveries will appear here.</div>'}</div></section>`;}
function cityBuilder(){const n=state.nation,c=selectedCity(),z=cozyFor(n),defs=BUILD_DEFS;return listPage('City Builder',`${esc(c.name)} — shape the city yourself.`,`<div class="builderlayout"><section class="builderworld panel"><div class="builderhead"><div><small>${esc(c.type)}</small><h2>${esc(c.name)}</h2><p>${fmt(c.pop/1e6)}M residents · Level ${c.level} · ${Math.round(c.happiness)}% happiness</p></div><div class="builderactions"><button class="outline" data-action="road">🛣️ Extend Road</button><button class="gold" data-action="cityup">⬆ Grow City</button></div></div><div class="builder3d city3d" data-city-scene="${esc(c.name)}"></div><div class="builderstats"><span>🏠 ${c.buildings?.filter(x=>BUILD_DEFS.find(d=>d.id===x.id)?.cat==='Residential').length||0} homes</span><span>💼 ${c.buildings?.reduce((a,x)=>a+(BUILD_DEFS.find(d=>d.id===x.id)?.jobs||0),0)||0} jobs</span><span>🛣️ ${c.roads||2} road links</span><span>🌳 ${c.zones?.park||0} green zones</span></div></section><section class="buildcatalog panel"><div class="paneltitle"><h2>Build</h2><span>Place something useful</span></div><div class="buildfilters">${['All','Residential','Commercial','Civic','Industrial','Nature','Infrastructure','Culture'].map(x=>`<button class="${x==='All'?'active':''}">${x}</button>`).join('')}</div><div class="buildgrid">${defs.map(d=>{const cost=buildCost(d,c),locked=(d.id==='university'&&c.level<4)||(d.cat==='Infrastructure'&&c.level<2);return `<article class="buildcard"><div class="buildicon">${d.icon}</div><div><b>${d.name}</b><small>${d.desc}</small><em>${money(cost)} · ${d.cat}</em></div><button class="mini ${locked?'lockbtn':'greenbtn'}" data-build="${d.id}" ${locked?'disabled':''}>${locked?'🔒':'Build'}</button></article>`}).join('')}</div></section><section class="zones panel"><div class="paneltitle"><h2>Plan the city</h2><span>Reserve space</span></div><div class="zonegrid">${ZONE_DEFS.map(x=>`<button class="zonebtn" data-zone="${x.id}"><b>${x.icon} ${x.name}</b><small>${x.effect}</small><em>${c.zones?.[x.id]||0} zones</em></button>`).join('')}</div></section></div>`);}
function miniGameMarkup(g){
 const result=g.lastResult?`<div class="game-result ${g.lastResult}">${g.lastResult==='win'?'🎉 You won!':g.lastResult==='loss'?'😅 Not this time':'🤝 Draw — go again!'}</div>`:'';
 if(g.pendingResult){
  const won=g.pendingResult==='win';
  const title=won?'YOU WON!':'YOU LOST';
  const subtitle=won?'Nice work — this activity is complete.':'This activity is failed for today.';
  let detail='';
  if(g.type==='rps'&&g.rps) detail=`<div class="resultversus"><span>You chose <b>${g.rps.player}</b></span><strong>VS</strong><span>Opponent chose <b>${g.rps.ai}</b></span></div>`;
  if(g.type==='coin'&&g.coin) detail=`<div class="resultversus"><span>You called <b>${g.coin.player}</b></span><strong>VS</strong><span>Coin landed <b>${g.coin.ai}</b></span></div>`;
  if(g.type==='fingers'&&g.fingers) detail=`<div class="resultversus"><span>You showed <b>${g.fingers.player}</b></span><strong>VS</strong><span>Opponent showed <b>${g.fingers.ai}</b></span></div>`;
  return `<div class="minigame polished outcome ${won?'outcome-win':'outcome-loss'}"><div class="outcome-icon">${won?'🏆':'💭'}</div><h2>${title}</h2><p>${subtitle}</p>${detail}<button class="gold outcome-close" data-action="close-activity-result">${won?'Continue':'Close Activity'}</button></div>`;
 }
 if(g.type==='rps')return `<div class="minigame rps polished"><div class="duelstage"><div class="duelplayer"><span class="avatar">🙂</span><b>You</b><small>${g.rps?g.rps.player:'Choose'}</small></div><div class="vs">VS</div><div class="duelplayer opponent"><span class="avatar ${g.rps?'reveal':''}">${g.rps&&!g.rps.revealing?(g.rps.ai==='rock'?'✊':g.rps.ai==='paper'?'✋':'✌️'):'?'}</span><b>Town Challenger</b><small>${g.rps&&!g.rps.revealing?g.rps.ai:'Revealing…'}</small></div></div>${result}<div class="game-instructions">Make your move. The reveal happens together.</div><div class="choicegrid polishedchoices"><button class="gamechoice" data-game-action="rps" data-game-value="rock" ${g.revealing?'disabled':''}>✊<span>Rock</span></button><button class="gamechoice" data-game-action="rps" data-game-value="paper" ${g.revealing?'disabled':''}>✋<span>Paper</span></button><button class="gamechoice" data-game-action="rps" data-game-value="scissors" ${g.revealing?'disabled':''}>✌️<span>Scissors</span></button></div></div>`;
 if(g.type==='coin')return `<div class="minigame coin polished"><div class="coinstage"><div class="coin3d ${g.coin?(g.coin.flipping?'flipping':'flipped '+g.coin.ai):''}"><div class="coinfront">HEADS</div><div class="coinback">TAILS</div></div></div>${result}<div class="game-instructions">Call it, then watch the coin flip.</div><div class="choicegrid two polishedchoices"><button class="gamechoice" data-game-action="coin" data-game-value="heads" ${g.revealing?'disabled':''}>🙂<span>Heads</span></button><button class="gamechoice" data-game-action="coin" data-game-value="tails" ${g.revealing?'disabled':''}>🔵<span>Tails</span></button></div></div>`;
 if(g.type==='fingers')return `<div class="minigame fingers polished"><div class="duelstage fingersstage"><div class="duelplayer"><span class="handreveal">${g.fingers?['✊','☝️','✌️','🤟','🖖','🖐️'][g.fingers.player]:'🤚'}</span><b>You</b><small>${g.fingers?g.fingers.player+' fingers':'Choose'}</small></div><div class="vs">VS</div><div class="duelplayer opponent"><span class="handreveal">${g.fingers&&!g.fingers.revealing?['✊','☝️','✌️','🤟','🖖','🖐️'][g.fingers.ai]:'?'}</span><b>Town Resident</b><small>${g.fingers&&!g.fingers.revealing?g.fingers.ai+' fingers':'Revealing…'}</small></div></div>${result}<div class="game-instructions">Pick a number. Highest hand wins; equal hands draw.</div><div class="fingergrid polishedchoices">${[0,1,2,3,4,5].map(i=>`<button class="gamechoice finger" data-game-action="fingers" data-game-value="${i}" ${g.revealing?'disabled':''}>${['✊','☝️','✌️','🤟','🖖','🖐️'][i]}<span>${i}</span></button>`).join('')}</div></div>`;
 return `<div class="minigame ttt polished"><div class="ttthead"><span>You <b>X</b></span><span>Town <b>O</b></span></div>${result}<div class="game-instructions">Place X. The town responds immediately.</div><div class="tttboard polishedboard">${g.ttt.board.map((v,i)=>`<button class="tttcell ${v?'filled '+v.toLowerCase():''}" data-game-action="ttt" data-game-value="${i}" ${v?'disabled':''}>${v||''}</button>`).join('')}</div></div>`;
}
function opportunityCard(){
 const n=state.nation,z=cozyFor(n),c=selectedCity(),ev=dailyEvent(n),tasks=z.tasks.map(id=>OPPORTUNITIES.find(x=>x.id===id)).filter(Boolean),active=activeOpportunity(n);
 if(active){const g=z.activeGame||{type:'rps',rounds:0,wins:0,losses:0,draws:0,streak:0};const def=MINI_GAMES.find(x=>x.id===g.type)||MINI_GAMES[0];return `<section class="panel opportunity-panel activeop"><div class="paneltitle"><div><h2>${active.icon} ${active.title}</h2><small>${def.icon} ${def.name} · Draw = replay</small></div><button class="outline" data-action="cancel-opportunity">Leave</button></div><div class="gamewrap"><div class="gamestats"><span>Wins <b>${g.wins}</b>/1</span><span>Losses <b>${g.losses}</b>/1</span><span>Draws <b>${g.draws}</b></span><span>Result <b>${g.lastResult||'—'}</b></span></div>${miniGameMarkup(g)}<div class="game-actions"><span>${g.lastResult==='draw'?'Draw! Play this same activity again.':'One win completes it. One loss fails it.'}</span></div></div></section>`;}
 const wins=z.won?.length||0,losses=z.failed?.length||0,canEnd=wins>=3||losses>=3,need=wins>=3?'3 wins reached':losses>=3?'3 failures — $1M move-on fee':`${wins}/3 wins · ${losses}/3 failures`;
 return `<section class="panel opportunity-panel"><div class="paneltitle"><div><h2>Today in ${esc(c.name)}</h2><small>${ev.icon} ${ev.title} · ${ev.desc}</small></div><div class="dayactions"><span class="apbadge">${need}</span>${canEnd?`<button class="gold endday" data-action="end-day">${losses>=3&&wins<3?'Pay $1M & Move On':'Move to Next Day →'}</button>`:''}</div></div><div class="daily-event"><b>🎮 Five activities are available</b><span>Win an activity to count toward your 3 wins. Lose one and it closes for today. Draws let you replay.</span></div><div class="opportunitylist">${tasks.map(x=>{const done=z.done.includes(x.id),failed=z.failed?.includes(x.id),game=gameForOpportunity(n,x.id);return `<article class="opportunity ${done?'done':''} ${failed?'failed':''}"><div class="momenticon">${failed?'❌':done?'🏆':x.icon}</div><div><b>${x.title}</b><small>🎮 ${game.name}</small><em>${done?'Won':failed?'Failed · unavailable today':'Play until you win or lose'}</em></div><button class="mini ${done||failed?'lockbtn':'greenbtn'}" data-opportunity="${x.id}" ${done||failed?'disabled':''}>${done?'Won':failed?'Failed':'Play'}</button></article>`}).join('')}</div><div class="dayfooter"><span><b>${wins}</b> wins · <b>${losses}</b> failed</span><span>${canEnd?'You may move on.':'Reach 3 wins or 3 failed activities.'}</span></div></section>`;
}
function home(){return `<main class="maincontent">${hero()}${opportunityCard()}<div class="cozyextras">${mailboxCard()}${reportCard()}${collectionCard()}</div><div class="dashboardgrid"><div>${skillsCard()}</div><div>${storeCard()}</div><div>${cityCard()}</div><div>${progressCard()}</div><div>${globalCard()}${achievements()}</div></div><div class="lowergrid">${lower()}</div></main>`;}
function listPage(kicker,title,content){return `<main class="subpage"><div class="pagehead"><small>${kicker.toUpperCase()}</small><h1>${title}</h1><p>Manage this part of ${esc(state.nation.name)} with the same progression-driven simulation.</p></div>${content}</main>`;}
function fullSkills(){return listPage('National Skills','Build your capabilities.',`<div class="fullskills">${skillsCard()}</div>`);}
function fullStore(){return listPage('Development Store','Build the things that make a nation better.',`<div class="fullstore">${storeDefs.map(d=>{const n=state.nation,u=level().level>=d.req,can=n.money>=d.cost;return `<article class="bigstore"><img class="thumb" src="/${d.img}" alt=""><div><h2>${d.name}</h2><p>${d.desc}</p><small>+${money(d.inc)}/day · Requires Level ${d.req}</small></div><strong>${money(d.cost)}</strong><button class="gold" data-buy="${d.id}" ${!u||!can?'disabled':''}>${u?'Buy':'Locked'}</button></article>`}).join('')}</div>`);}
function fullCities(){const n=state.nation;cozyFor(n);return listPage('Cities','Visit, grow and give each place its own personality.',`<div class="citiesfull">${n.cities.map((c,i)=>`<article class="citylarge ${i===(n.cozy.selectedCity||0)?'selectedcity':''}"><div class="citylarge3d city3d" data-city-scene="${esc(c.name)}"></div><div><div class="citytag">${esc(c.type)}</div><h2>${esc(c.name)}</h2><p>${fmt(c.pop/1e6)}M citizens · Level ${c.level} · ${Math.round(c.happiness||65)}% happiness</p><div class="citychips"><span>🏠 ${Math.max(4,c.level*3)} neighborhoods</span><span>🌳 ${Math.max(1,Math.floor(c.level/2)+1)} parks</span><span>✨ ${(c.cozy?.projects||[]).length} local projects</span></div><button class="gold" data-city-visit="${i}">Visit City</button> <button class="outline" data-action="open-city-builder" data-city-index="${i}">Build City</button> <button class="outline" data-action="cityup">Grow City</button></div></article>`).join('')}</div>`);}
function fullProgress(){return listPage('Nation Progression','Watch your story unfold.',`<div class="fullprogress">${levels.map(x=>`<article class="pstage ${x.level<=level().level?'done':''}"><span>Lv.${x.level}</span><h2>${x.name}</h2><p>Unlock: ${x.unlock}</p><small>${x.xp.toLocaleString()} XP</small></article>`).join('')}</div>`);}
function fullMap(){
  const n=state.nation;
  return listPage('National Map','Your cities, towns, roads and countryside — one living country.',`<section class="mapscene panel">
    <div class="nation3d" id="nation-city-scene"></div>
    <div class="maplegend">
      <span><i class="legend-dot citydot"></i>Cities</span><span><i class="legend-line roadline"></i>Highways</span><span><i class="legend-line railline"></i>Rail</span><span><i class="legend-dot greendot"></i>Parks & Forest</span>
    </div>
    <div class="mapbadges"><div><b>${n.cities.length}</b><small>Cities & Towns</small></div><div><b>${Math.max(2,n.cities.length*2+level().level)}</b><small>Settlements</small></div><div><b>Lv. ${level().level}</b><small>Nation</small></div></div>
    <button class="gold" data-screen="cities">Manage Cities</button>
  </section>`);
}
function fullHistory(){return listPage('National History','Your nation, year by year.',`<section class="historylist panel">${state.nation.history.map((x,i)=>`<div>${icon(i%2?'◆':'◉')}<section><b>${esc(x)}</b><small>Chapter ${state.nation.history.length-i}</small></section></div>`).join('')}</section>`);}
function fullSettings(){return listPage('Settings','Keep control of your nation.',`<section class="settingspanel panel"><button class="outline" data-action="new">Start a New Nation</button><button class="outline" data-action="save">Save Game</button><p>Your game is stored locally in this browser.</p></section>`);}
function placeholder(title,sub){return listPage(title,sub,`<div class="placeholder panel"><div class="placeholdericon">◈</div><h2>Coming together.</h2><p>This section uses the same live nation data and will expand as your country develops.</p><button class="gold" data-screen="home">Back Home</button></div>`);}

let citySceneRecords=[];
let heroSceneRecord=null,heroSceneFrame=null,heroSceneResize=null;
function disposeCityScenes(){citySceneRecords.forEach(r=>{try{r.renderer.dispose();r.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}})}catch{}});citySceneRecords=[];}
function disposeHeroScene(){
  if(heroSceneFrame)cancelAnimationFrame(heroSceneFrame); heroSceneFrame=null;
  if(heroSceneResize){window.removeEventListener('resize',heroSceneResize);heroSceneResize=null;}
  if(heroSceneRecord){try{heroSceneRecord.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.dispose())}});heroSceneRecord.renderer.dispose();heroSceneRecord.host.innerHTML='';}catch{} heroSceneRecord=null;}
}
function initHeroScene(){
  const host=$('#hero-scene'); if(!host)return;
  disposeHeroScene();
  const width=host.clientWidth||900,height=host.clientHeight||390;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x050b12);
  scene.fog=new THREE.FogExp2(0x07111b,.035);
  const camera=new THREE.PerspectiveCamera(34,width/height,.1,140);
  camera.position.set(8.8,5.2,10.8); camera.lookAt(0,1.1,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));
  renderer.setSize(width,height,false);
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  // Landscape — Night direction: moonlit procedural terrain, dense star band,
  // atmospheric fog, grass/stone foreground and a slow cinematic camera.
  scene.add(new THREE.HemisphereLight(0x587b9a,0x03070b,.9));
  const moonLight=new THREE.DirectionalLight(0xb9d4ee,1.7);
  moonLight.position.set(-7,12,5); moonLight.castShadow=true; scene.add(moonLight);
  const warmFill=new THREE.PointLight(0xffb25d,2.0,28); warmFill.position.set(2,2,-1); scene.add(warmFill);

  const world=new THREE.Group(); scene.add(world);
  const groundMat=new THREE.MeshStandardMaterial({color:0x17272b,roughness:.96,metalness:0,flatShading:true});
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(34,25,42,28),groundMat);
  ground.rotation.x=-Math.PI/2; ground.position.set(0,-.08,-1); ground.receiveShadow=true; world.add(ground);
  const gp=ground.geometry.attributes.position;
  for(let i=0;i<gp.count;i++){
    const x=gp.getX(i),z=gp.getY(i);
    const y=.06*Math.sin(x*.75)+.045*Math.cos(z*.9)+.025*Math.sin((x+z)*2.1);
    gp.setZ(i,y);
  }
  ground.geometry.computeVertexNormals();

  // Distant ridges, kept low so the hero reads as a landscape rather than a city render.
  for(let band=0;band<5;band++){
    const w=30-band*2.2,h=6.2-band*.42;
    const geo=new THREE.PlaneGeometry(w,h,26,8);
    const pos=geo.attributes.position;
    for(let i=0;i<pos.count;i++){
      const x=pos.getX(i),y=pos.getY(i), edge=1-Math.min(1,Math.abs(y)/(h*.5));
      const crest=Math.sin(x*.28+band*1.37)*(.8+band*.08)+Math.sin(x*.63-band*.7)*.27+Math.cos(x*1.05+band)*.12;
      pos.setZ(i,crest*edge);
    }
    geo.computeVertexNormals();
    const mat=new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(.55,.25,.095+band*.018),roughness:1,flatShading:true});
    const ridge=new THREE.Mesh(geo,mat);
    ridge.rotation.x=-Math.PI/2;
    ridge.position.set(0,.35+band*.27,-5.0-band*1.45);
    world.add(ridge);
  }

  // Moon and restrained halo.
  const moon=new THREE.Mesh(new THREE.SphereGeometry(.78,24,24),new THREE.MeshBasicMaterial({color:0xe4edf4}));
  moon.position.set(-6.8,6.4,-9); world.add(moon);
  const halo=new THREE.Mesh(new THREE.SphereGeometry(1.35,20,20),new THREE.MeshBasicMaterial({color:0x8fb7d6,transparent:true,opacity:.075,depthWrite:false}));
  halo.position.copy(moon.position); world.add(halo);

  // Star band: dense, but constrained to the visible upper landscape rather than a noisy full cube.
  const starGeo=new THREE.BufferGeometry(),stars=[];
  const rng=(()=>{let x=hashCity(`${state.nation?.name||'nation'}:landscape-night`);return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296}})();
  for(let i=0;i<3920;i++){
    const x=(rng()-.5)*34, y=3.0+rng()*8.8, z=-13+rng()*10;
    stars.push(x,y,z);
  }
  starGeo.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));
  world.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xd7e8f4,size:.018,transparent:true,opacity:.72,depthWrite:false,blending:THREE.AdditiveBlending})));

  // Foreground stones and grass-like tufts give the terrain the authored 3D feel.
  const terrainSeed=rng;
  for(let i=0;i<55;i++){
    const x=(terrainSeed()-.5)*17,z=1+terrainSeed()*8;
    const s=.035+terrainSeed()*.095;
    const stone=new THREE.Mesh(new THREE.DodecahedronGeometry(s,0),new THREE.MeshStandardMaterial({color:0x3a4a4d,roughness:1}));
    stone.position.set(x,s,z); stone.scale.y=.55+terrainSeed()*.7; world.add(stone);
  }
  for(let i=0;i<90;i++){
    const x=(terrainSeed()-.5)*18,z=1+terrainSeed()*7;
    const g=new THREE.Group();
    for(let j=0;j<3;j++){
      const blade=new THREE.Mesh(new THREE.ConeGeometry(.012,.22+terrainSeed()*.18,3),new THREE.MeshStandardMaterial({color:0x345b4c,roughness:1}));
      blade.position.set((terrainSeed()-.5)*.08,.11,(terrainSeed()-.5)*.08); blade.rotation.z=(terrainSeed()-.5)*.45; g.add(blade);
    }
    g.position.set(x,0,z); world.add(g);
  }

  // A subtle distant road/settlement trace connects the landscape to the nation-building theme.
  const routeMat=new THREE.LineBasicMaterial({color:0x6ea7aa,transparent:true,opacity:.24});
  for(let r=0;r<4;r++){
    const pts=[];
    for(let i=0;i<28;i++){
      const x=-8+i*.6, z=-1.4+r*.65+Math.sin(i*.34+r)*.1;
      pts.push(new THREE.Vector3(x,.025,z));
    }
    world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),routeMat));
  }

  // Dense skyline: based on the MIT-licensed THREEx.ProceduralCity approach rather than a custom static illustration.
  const city=new THREE.Group(); city.position.set(1.1,.02,-2.8); world.add(city);
  const lvl=Math.max(1,Math.min(10,level().level));
  addKenneyCityAssets(city,hashCity(`${state.nation?.name||'nation'}:hero-kenney`),lvl,{radius:5.5});

  const rec={renderer,scene,camera,world,host}; heroSceneRecord=rec;
  let t=0;
  const animate=()=>{
    heroSceneFrame=requestAnimationFrame(animate); t+=.0025;
    world.position.y=Math.sin(t*.55)*.018;
    world.rotation.y=Math.sin(t*.13)*.006;
    camera.position.x=8.8+Math.sin(t*.32)*.28;
    camera.position.y=5.2+Math.sin(t*.24)*.08;
    camera.lookAt(0,1.05,0);
    renderer.render(scene,camera);
  };
  animate();
  heroSceneResize=()=>{if(!heroSceneRecord)return;const w=host.clientWidth||900,h=host.clientHeight||390;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)};
  window.addEventListener('resize',heroSceneResize);
}

// Local Kenney asset library. These files are bundled with the game so the 3D
// world does not depend on a remote asset mirror or silently fall back to boxes.
const LOCAL_ASSETS={
  industrial:['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t'].map(x=>`/assets/kenney/industrial/building-${x}.glb`),
  commercial:['a','b','c','d','e','f','g','h','i','j','k','l','m','n'].map(x=>`/assets/kenney/commercial/building-${x}.glb`),
  towers:['a','b','c','d'].map(x=>`/assets/kenney/commercial/building-skyscraper-${x}.glb`),
  residential:['building-small-a.glb','building-small-b.glb','building-small-c.glb','building-small-d.glb','building-garage.glb'].map(x=>`/assets/kenney/starter/${x}`),
  roads:['road-straight.glb','road-straight-lightposts.glb','road-intersection.glb','road-corner.glb','road-split.glb'].map(x=>`/assets/kenney/starter/${x}`),
  nature:['grass.glb','grass-trees.glb','grass-trees-tall.glb'].map(x=>`/assets/kenney/starter/${x}`),
  citizens:['character-female-a','character-female-b','character-female-c','character-female-d','character-female-e','character-female-f','character-male-a','character-male-b','character-male-c','character-male-d','character-male-e','character-male-f'].map(x=>`/assets/kenney/characters/${x}.glb`)
};
const kenneyLoader=new GLTFLoader();
const kenneyCache=new Map();
function loadKenney(url){
  if(kenneyCache.has(url))return kenneyCache.get(url);
  const promise=new Promise((resolve,reject)=>kenneyLoader.load(url,g=>resolve(g.scene),undefined,reject));
  kenneyCache.set(url,promise); return promise;
}
function cloneKenney(src,opts={}){
  const x=src.clone(true);
  x.traverse(o=>{
    if(o.isMesh){
      o.castShadow=true;o.receiveShadow=true;
      if(o.material){
        const mats=Array.isArray(o.material)?o.material:[o.material];
        mats.forEach(m=>{if(m){m.transparent=false;m.opacity=1;m.depthWrite=true;m.needsUpdate=true;}});
      }
    }
  });
  // Kenney models use their own colormap and correct model-space ground plane.
  // Re-ground the whole clone so no imported pivot/offset can float above the map.
  if(opts.ground!==false){
    const box=new THREE.Box3().setFromObject(x);
    if(Number.isFinite(box.min.y)) x.position.y-=box.min.y;
  }
  return x;
}
function seeded(seed){let x=(seed>>>0)||1;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296};}
function loadAssetSet(urls){return Promise.all(urls.map(loadKenney));}
function placeSpacedKenney(group,models,rng,count,zone,scaleRange={min:.7,max:1.05},minGap=.8,y=.045){
  const placed=[];
  for(let n=0;n<count;n++){
    let accepted=null;
    for(let attempt=0;attempt<90&&!accepted;attempt++){
      const src=models[Math.floor(rng()*models.length)];
      const x=zone.x0+rng()*(zone.x1-zone.x0),z=zone.z0+rng()*(zone.z1-zone.z0);
      const b=cloneKenney(src);const scale=scaleRange.min+rng()*(scaleRange.max-scaleRange.min);b.scale.setScalar(scale);b.rotation.y=Math.floor(rng()*4)*Math.PI/2;
      const box=new THREE.Box3().setFromObject(b),size=new THREE.Vector3();box.getSize(size);const footprint=Math.max(.25,Math.hypot(size.x,size.z)/2);
      let clear=true;for(const p of placed){if(Math.hypot(p.x-x,p.z-z)<p.r+footprint+minGap){clear=false;break;}}
      if(clear){b.position.set(x,y,z);group.add(b);placed.push({x,z,r:footprint});accepted=true;}
    }
  }
}
function addKenneyCityAssets(group,seed,level,opts={}){
  const rng=seeded(seed),lvl=Math.max(1,Math.min(10,level)),radius=opts.radius||6.4;
  const city=new THREE.Group();city.name='Kenney City Districts';group.add(city);
  Promise.all([
    loadAssetSet(LOCAL_ASSETS.residential),loadAssetSet(LOCAL_ASSETS.commercial),loadAssetSet(LOCAL_ASSETS.industrial),
    loadAssetSet(LOCAL_ASSETS.towers),loadAssetSet(LOCAL_ASSETS.roads),loadAssetSet(LOCAL_ASSETS.nature),loadAssetSet(LOCAL_ASSETS.citizens)
  ]).then(([residential,commercial,industrial,towers,roads,nature,citizens])=>{
    const district=new THREE.Group();district.name='Built From Kenney Packs';city.add(district);
    const worldR=radius, coreR=Math.min(2.8+lvl*.32,5.1);
    // Kenney Starter Kit roads are modular 1x1 tiles. Build a true snapped
    // network: every tile shares the same grid spacing, and intersections
    // replace straight tiles at crossings instead of being stacked on top.
    const rg=new THREE.Group();rg.name='Road Network';district.add(rg);
    const road=roads[0], cross=roads[2]||road;
    const tile=2.18;
    const half=Math.max(2,Math.floor((worldR*1.55)/tile));
    const span=half*tile;
    const key=(x,z)=>`${x}:${z}`;
    const nodes=new Set();
    const addTile=(src,x,z,rot=0)=>{
      const m=cloneKenney(src);
      m.scale.setScalar(tile);
      m.rotation.y=rot;
      m.position.set(x,.035,z);
      rg.add(m);
    };
    // Two connected arterial lines plus a compact local grid.
    const xs=[];for(let x=-half;x<=half;x++)xs.push(x*tile);
    const zs=[];for(let z=-half;z<=half;z++)zs.push(z*tile);
    const horizontal=[-tile*2,0,tile*2];
    const vertical=[-tile*2,0,tile*2];
    horizontal.forEach(z=>{
      for(let x=-span;x<=span;x+=tile){nodes.add(key(Math.round(x/tile),Math.round(z/tile)));}
    });
    vertical.forEach(x=>{
      for(let z=-span;z<=span;z+=tile){nodes.add(key(Math.round(x/tile),Math.round(z/tile)));}
    });
    // Place one intersection at every crossing and straight modules between.
    horizontal.forEach(z=>{
      for(let x=-span;x<=span;x+=tile){
        const crossing=vertical.some(v=>Math.abs(v-x)<.01);
        if(!crossing)addTile(road,x,z,Math.PI/2);
      }
    });
    vertical.forEach(x=>{
      for(let z=-span;z<=span;z+=tile){
        const crossing=horizontal.some(h=>Math.abs(h-z)<.01);
        if(!crossing)addTile(road,x,z,0);
      }
    });
    horizontal.forEach(z=>vertical.forEach(x=>addTile(cross,x,z,0)));
    // Short feeder roads use the same orientation as the connected arterial grid.
    for(const z of [-tile*4,tile*4]){
      for(let x=-tile*2;x<=tile*2;x+=tile)addTile(road,x,z,Math.PI/2);
    }
    for(const x of [-tile*4,tile*4]){
      for(let z=-tile*2;z<=tile*2;z+=tile)addTile(road,x,z,0);
    }

    // Residential growth uses actual Starter Kit buildings, not primitive boxes.
    const homes=new THREE.Group();homes.name='Residential';district.add(homes);
    placeSpacedKenney(homes,residential,rng,Math.min(28,8+lvl*2),{x0:-worldR*.9,x1:worldR*.9,z0:-worldR*.9,z1:worldR*.9},{min:.72,max:.98},.95,.04);

    // Commercial core grows vertically as the city levels up.
    if(lvl>=2){const shops=new THREE.Group();shops.name='Commercial';district.add(shops);placeSpacedKenney(shops,commercial,rng,Math.min(12,2+lvl),{x0:-coreR,x1:coreR,z0:-coreR,z1:coreR},{min:.62,max:.86},1.15,.045);}
    if(lvl>=5&&towers.length){const skyline=new THREE.Group();skyline.name='Downtown Skyline';district.add(skyline);placeSpacedKenney(skyline,towers,rng,Math.min(4,1+Math.floor(lvl/2)),{x0:-coreR*.8,x1:coreR*.8,z0:-coreR*.8,z1:coreR*.8},{min:.55,max:.72},1.4,.045);}

    // Industrial district stays physically separated from the residential core.
    if(lvl>=3){const factories=new THREE.Group();factories.name='Industrial';district.add(factories);placeSpacedKenney(factories,industrial,rng,Math.min(10,2+lvl),{x0:-worldR*.92,x1:-worldR*.45,z0:-worldR*.72,z1:worldR*.72},{min:.58,max:.82},1.25,.045);}

    // Real Kenney starter-kit green pieces fill open space.
    const green=new THREE.Group();green.name='Green Space';district.add(green);
    const parks=Math.min(4,1+Math.floor(lvl/2));
    for(let p=0;p<parks;p++){const cx=(p%2?1:-1)*worldR*.47,cz=(p<2?-1:1)*worldR*.45;for(let i=0;i<4+lvl;i++){const t=cloneKenney(nature[Math.floor(rng()*nature.length)]);t.scale.setScalar(.48+rng()*.32);t.position.set(cx+(rng()-.5)*2.5,.035,cz+(rng()-.5)*1.9);t.rotation.y=rng()*Math.PI*2;green.add(t);}}

    // Citizens are added by the shared ambient pedestrian system below.
    // Keeping one system prevents duplicate/stuck characters in the city centre.
  }).catch(err=>console.warn('Local Kenney assets failed to load',err));
}

function addCozyProjectVisuals(group,c){
  // Retired: the old procedural boxes conflicted with the Kenney visual language.
  // Existing projects remain represented by the real Kenney city districts below.
}

function addBuiltStructures(group,c){
 const buildings=c.buildings||[];if(!buildings.length)return;
 const root=new THREE.Group();root.name='Player Built District';group.add(root);
 const map={
   cottage:LOCAL_ASSETS.residential,
   apartment:LOCAL_ASSETS.commercial,
   shop:LOCAL_ASSETS.commercial,cafe:LOCAL_ASSETS.commercial,market:LOCAL_ASSETS.commercial,
   school:LOCAL_ASSETS.commercial,clinic:LOCAL_ASSETS.commercial,museum:LOCAL_ASSETS.commercial,
   workshop:LOCAL_ASSETS.industrial,warehouse:LOCAL_ASSETS.industrial,station:LOCAL_ASSETS.commercial,
   stadium:LOCAL_ASSETS.commercial,university:LOCAL_ASSETS.commercial
 };
 const loads=[...new Set(Object.values(map).flat())];
 loadAssetSet(loads).then(()=>{
   const loaded=new Map();loads.forEach((url,i)=>loaded.set(url,kenneyCache.get(url)));
   buildings.forEach((b,idx)=>{
     const def=BUILD_DEFS.find(x=>x.id===b.id),urls=map[b.id];if(!def||!urls?.length)return;
     const url=urls[idx%urls.length],src=kenneyCache.get(url);if(!src)return;
     const lot=LOTS[b.slot%LOTS.length],g=cloneKenney(src);g.position.set(lot[0],.04,lot[1]);g.rotation.y=(idx%4)*Math.PI/2;
     const scale=b.id==='cottage'?.62:b.id==='apartment'?.52:b.id==='stadium'?.42:.55;g.scale.setScalar(scale);g.userData.buildingId=b.id;root.add(g);
   });
 }).catch(()=>{});
}
function addAmbientCitizens(group,c){
  const rng=seeded(hashCity(`${c.name}:citizens`));
  const people=new THREE.Group();people.name='Citizens';group.add(people);
  loadAssetSet(LOCAL_ASSETS.citizens).then(models=>{
    // Small, sparse pedestrians: enough to make the city feel alive without
    // turning the map into a crowd. Population affects the count.
    const count=Math.min(14,3+Math.floor(Math.sqrt(Math.max(1,c.pop||0)/80000)));
    const paths=[
      [-5.0,0.0,5.0,0.0], [0.0,-4.4,0.0,4.4],
      [-4.2,-3.4,4.2,-3.4], [-4.2,3.4,4.2,3.4],
      [-3.8,-3.8,3.8,3.8], [3.8,-3.8,-3.8,3.8]
    ];
    for(let i=0;i<count;i++){
      const p=cloneKenney(models[Math.floor(rng()*models.length)]);
      // Mini Characters are deliberately tiny relative to buildings.
      p.scale.setScalar(.085+rng()*.025);
      const path=paths[i%paths.length];
      const t=rng();
      let x=path[0]+(path[2]-path[0])*t;
      let z=path[1]+(path[3]-path[1])*t;
      // Slight offset keeps pedestrians from standing directly on one another.
      x+= (rng()-.5)*.24; z+=(rng()-.5)*.24;
      p.position.set(x,.025,z);
      p.userData.walkX=x;
      p.userData.walkZ=z;
      p.userData.walkTX=path[2];
      p.userData.walkTZ=path[3];
      p.userData.walkPath=path;
      p.userData.walkSpeed=.00075+rng()*.00045;
      p.userData.walkPhase=rng();
      p.rotation.y=Math.atan2(path[2]-path[0],path[3]-path[1]);
      people.add(p);
    }
  }).catch(err=>console.warn('Citizen assets failed to load',err));
  return people;
}
function buildCityScene(host,c,opts={}){
  if(!host||!c)return null;
  const width=host.clientWidth||640,height=host.clientHeight||320;
  const scene=new THREE.Scene(),style=cityStyle(c);scene.background=new THREE.Color(style.ground);
  const camera=new THREE.PerspectiveCamera(32,width/height,.1,100);camera.position.set(9.5,7.8,11.5);camera.lookAt(0,1.2,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(1.1,window.devicePixelRatio||1));renderer.setSize(width,height,false);renderer.shadowMap.enabled=false;host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xb8dce4,0x10252c,1.75));const sun=new THREE.DirectionalLight(0xffe2ad,2.1);sun.position.set(5,10,4);sun.castShadow=true;scene.add(sun);
  const group=new THREE.Group();scene.add(group);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(22,18),new THREE.MeshStandardMaterial({color:style.ground,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;group.add(ground);
  const lvl=Math.max(1,Math.min(10,c.level||1)),seed=c.citySeed||citySeed(c);
  addKenneyCityAssets(group,seed,lvl,{radius:6.4});
  addBuiltStructures(group,c);
  addCozyProjectVisuals(group,c);
  addAmbientCitizens(group,c);
  let dragging=false,lastX=0,lastY=0;renderer.domElement.style.touchAction='none';renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId)});renderer.domElement.addEventListener('pointerup',e=>{dragging=false;renderer.domElement.releasePointerCapture?.(e.pointerId)});renderer.domElement.addEventListener('pointercancel',()=>dragging=false);renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;group.rotation.y+=(e.clientX-lastX)*.008;group.rotation.x=THREE.MathUtils.clamp(group.rotation.x+(e.clientY-lastY)*.004,-.35,.25);lastX=e.clientX;lastY=e.clientY});
  const rec={renderer,scene,camera,group,host};citySceneRecords.push(rec);return rec;
}

function buildNationalScene(host){
  if(!host||!state.nation)return null;
  const width=host.clientWidth||900,height=host.clientHeight||470;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x0a1c25);
  scene.fog=new THREE.FogExp2(0x0a1c25,.012);
  const camera=new THREE.PerspectiveCamera(35,width/height,.1,180);
  camera.position.set(0,18,18); camera.lookAt(0,0,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1)); renderer.setSize(width,height,false);
  renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.shadowMap.enabled=true; host.innerHTML=''; host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xa6d5df,0x17231e,1.65));
  const sun=new THREE.DirectionalLight(0xffdfad,1.8); sun.position.set(-8,15,7); sun.castShadow=true; scene.add(sun);
  const world=new THREE.Group(); scene.add(world);

  const terrain=new THREE.Mesh(new THREE.PlaneGeometry(32,24,1,1),new THREE.MeshStandardMaterial({color:0x355d4d,roughness:1}));
  terrain.rotation.x=-Math.PI/2; terrain.receiveShadow=true; world.add(terrain);

  // Large geographic regions: forests, farms, hills and water.
  const rng=seeded(hashCity(state.nation.name+':national-geography'));
  const landMats=[0x466b54,0x52775a,0x6c7650,0x3e604e];
  for(let i=0;i<26;i++){
    const g=new THREE.Group();
    const w=1.3+rng()*3.6,d=.9+rng()*2.6;
    const mat=new THREE.MeshStandardMaterial({color:landMats[i%landMats.length],roughness:1});
    const patch=new THREE.Mesh(new THREE.CircleGeometry(.5,10),mat); patch.scale.set(w,d,1); patch.rotation.x=-Math.PI/2;
    g.add(patch);g.position.set((rng()-.5)*27,.018,(rng()-.5)*19); world.add(g);
  }
  // Deliberately no mountains or rivers on the national map. The country remains a broad, buildable plain so the city network stays visually dominant.

  const roadMat=new THREE.MeshStandardMaterial({color:0x27383c,roughness:.94});
  const railMat=new THREE.MeshStandardMaterial({color:0x9c8769,roughness:.8});
  function route(points,width,mat,y=.04){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(p[0],y,p[1])));
    const geo=new THREE.TubeGeometry(curve,48,width,5,false); const mesh=new THREE.Mesh(geo,mat); world.add(mesh); return mesh;
  }
  // National highways and rail corridors.
  route([[-13,-2],[-8,-1],[-3,-2],[2,-1],[7,1],[13,2]],.12,roadMat);
  route([[-9,8],[-6,4],[-2,2],[2,-1],[6,-5],[10,-9]],.10,roadMat);
  route([[-11,5],[-6,3],[-1,4],[5,5],[12,7]],.075,roadMat);
  route([[-10,-8],[-5,-5],[0,-3],[5,0],[9,5],[12,9]],.045,railMat,.06);
  route([[-12,5],[-7,2],[-2,0],[3,-1],[8,-2],[12,-1]],.045,railMat,.06);

  // Every real city becomes a visible urban footprint on the national map.
  const cities=state.nation.cities||[];
  const positions=[];
  // Place cities with deterministic relaxation so their scaled urban
  // footprints never visually pile into one another on the national map.
  const minGap=(a,b)=>2.45+Math.min(1.55,((a.level||1)+(b.level||1))*.075);
  cities.forEach((c,i)=>{
    const angle=i*2.399963, rad=i===0?0:2.8+Math.sqrt(i)*2.18;
    let x=i===0?-1.5:Math.cos(angle)*rad;
    let z=i===0?-1.5:Math.sin(angle)*rad*.70;
    x=Math.max(-11.6,Math.min(11.6,x)); z=Math.max(-8.5,Math.min(8.5,z));
    for(let pass=0;pass<28;pass++){
      let moved=false;
      for(let j=0;j<positions.length;j++){
        const [px,pz]=positions[j],pc=cities[j]; let dx=x-px,dz=z-pz,dist=Math.hypot(dx,dz);
        const gap=minGap(c,pc);
        if(dist<gap){
          if(dist<.001){dx=Math.cos(angle+.8);dz=Math.sin(angle+.8);dist=1;}
          const push=(gap-dist)*.58;
          x+=dx/dist*push;z+=dz/dist*push;moved=true;
        }
      }
      x=Math.max(-11.6,Math.min(11.6,x)); z=Math.max(-8.5,Math.min(8.5,z));
      if(!moved)break;
    }
    positions.push([x,z]);
    const cityGroup=new THREE.Group(); cityGroup.position.set(x,.06,z);
    const cLvl=Math.max(1,Math.min(10,c.level||1));
    // The national map uses the same bundled Kenney vocabulary as the city view.
    // Cities are placed inside their own footprints so national infrastructure can live outside them.
    addKenneyCityAssets(cityGroup,c.citySeed||citySeed(c),cLvl,{radius:3.1});
    addAmbientCitizens(cityGroup,c);
    cityGroup.scale.setScalar(.42+Math.min(cLvl,8)*.018);
    world.add(cityGroup);
    // city glow/marker
    const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.64,24),new THREE.MeshBasicMaterial({color:i===0?0xe5c36a:0x7bc7cc,transparent:true,opacity:.72,side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2; ring.position.set(x,.16,z); world.add(ring);
    const beacon=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.65,8),new THREE.MeshBasicMaterial({color:i===0?0xe5c36a:0x7bc7cc}));
    beacon.position.set(x,.38,z); world.add(beacon);
  });
  // Smaller settlements use the same real residential models instead of primitive cubes.
  loadAssetSet(LOCAL_ASSETS.residential).then(villagers=>{
    for(let i=0;i<Math.max(8,cities.length*2);i++){
      const x=(rng()-.5)*25,z=(rng()-.5)*17;
      if(Math.abs(x-5)<1.5)continue;
      const settlement=new THREE.Group();settlement.position.set(x,.04,z);
      for(let h=0;h<2+(i%3);h++){const b=cloneKenney(villagers[(i+h)%villagers.length]);b.scale.setScalar(.18+rng()*.05);b.position.set((rng()-.5)*.65,.04,(rng()-.5)*.5);b.rotation.y=rng()*Math.PI*2;settlement.add(b);}
      world.add(settlement);
    }
  });

  // National Store landmarks occupy a separate western/eastern corridor. They never sit on city footprints.
  const nationalSlots={factory:[-9,-6],railway:[-6,7],airport:[9,6],hospital:[9,-5],stadium:[-8,7],university:[6,8],research:[8,-8],finance:[-8,3]};
  const assetFor={factory:LOCAL_ASSETS.industrial,railway:LOCAL_ASSETS.industrial,airport:LOCAL_ASSETS.commercial,hospital:LOCAL_ASSETS.commercial,stadium:LOCAL_ASSETS.commercial,university:LOCAL_ASSETS.commercial,research:LOCAL_ASSETS.commercial,finance:LOCAL_ASSETS.commercial};
  const placedNational=new THREE.Group();placedNational.name='National Infrastructure';world.add(placedNational);
  const nationalLoads=[...new Set(Object.values(assetFor).flat())];
  loadAssetSet(nationalLoads).then(()=>{
    Object.entries(nationalSlots).forEach(([id,pos])=>{const amount=Number(state.nation.assets?.[id]||0);const urls=assetFor[id];for(let k=0;k<amount;k++){const src=kenneyCache.get(urls[k%urls.length]);if(!src)continue;const g=cloneKenney(src);g.position.set(pos[0]+(k%3)*1.15,.045,pos[1]+Math.floor(k/3)*1.15);g.rotation.y=((k+id.length)%4)*Math.PI/2;g.scale.setScalar(id==='stadium'?.40:id==='factory'?.48:.43);placedNational.add(g);}});
  });

  // Interaction: drag to rotate/inspect the whole country.
  let dragging=false,lastX=0,lastY=0;
  renderer.domElement.style.touchAction='none';
  renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId)});
  renderer.domElement.addEventListener('pointerup',e=>{dragging=false;renderer.domElement.releasePointerCapture?.(e.pointerId)});
  renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
  renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;world.rotation.y+=(e.clientX-lastX)*.003;world.rotation.x=THREE.MathUtils.clamp(world.rotation.x+(e.clientY-lastY)*.001,-.12,.12);lastX=e.clientX;lastY=e.clientY});
  const rec={renderer,scene,camera,group:world,host};
  citySceneRecords.push(rec); return rec;
}
function initCityScenes(){disposeCityScenes();if(!state.nation)return;const hosts=$$('[data-city-scene]');const primary=hosts.slice(0,2);primary.forEach(host=>{const name=host.dataset.cityScene;const c=state.nation.cities.find(x=>x.name===name);if(c)buildCityScene(host,c)});const nationHost=$('#nation-city-scene');if(nationHost){buildNationalScene(nationHost);}const animate=()=>{if(!citySceneRecords.length)return;citySceneRecords.forEach(r=>{if(r.group&&r.host.offsetWidth>0&&r.host.offsetHeight>0){r.group.rotation.y+=.0007;r.group.traverse(o=>{if(o.name==='Citizens'){o.children.forEach(p=>{
        if(p.userData.walkTX===undefined)return;
        const dt=Math.min(32,performance.now()-(p.userData.lastWalkTime||performance.now()));
        p.userData.lastWalkTime=performance.now();
        let dx=p.userData.walkTX-p.position.x,dz=p.userData.walkTZ-p.position.z;
        const dist=Math.hypot(dx,dz);
        if(dist<.08){
          const path=p.userData.walkPath;
          p.userData.walkTX=path[0] + (path[2]-path[0])*(Math.random()>.5?0:1);
          p.userData.walkTZ=path[1] + (path[3]-path[1])*(Math.random()>.5?0:1);
          dx=p.userData.walkTX-p.position.x;dz=p.userData.walkTZ-p.position.z;
        }
        const step=p.userData.walkSpeed*dt;
        const len=Math.hypot(dx,dz)||1;
        p.position.x+=dx/len*step;p.position.z+=dz/len*step;p.position.y=.025;
        p.rotation.y=Math.atan2(dx,dz);
      });}});r.renderer.render(r.scene,r.camera)}});window.__cityFrame=requestAnimationFrame(animate)};cancelAnimationFrame(window.__cityFrame);window.__cityFrame=requestAnimationFrame(animate)}
function renderGame(){tick();disposeHeroScene();const root=$('#app');let body=home();if(state.screen==='skills')body=fullSkills();else if(['store','development','buildings'].includes(state.screen))body=fullStore();else if(state.screen==='cities')body=fullCities();else if(state.screen==='citybuilder')body=cityBuilder();else if(['statistics','progress'].includes(state.screen))body=fullProgress();else if(state.screen==='map')body=fullMap();else if(state.screen==='history')body=fullHistory();else if(state.screen==='settings')body=fullSettings();else if(state.screen==='diplomacy')body=placeholder('Global Standing','Diplomacy and relations.');root.innerHTML=`<div class="game ${state.ui?.sidebarCollapsed?'sidebar-collapsed':''}"><div class="sidebarwrap">${sidebar()}</div><div class="gamearea">${topbar()}${mobileStatus()}${body}</div></div>${state.toast?`<div class="toast">${esc(state.toast)}</div>`:''}`;requestAnimationFrame(()=>{initHeroScene();initCityScenes()});}

let landingRenderer,landingScene,landingCamera,landingGlobe,landingFrame;
function disposeLanding(){if(landingFrame)cancelAnimationFrame(landingFrame);landingFrame=null;if(landingRenderer)landingRenderer.dispose();landingRenderer=null;landingScene=null;landingCamera=null;landingGlobe=null;}
function initLanding(){const host=$('#landing-globe');if(!host)return;disposeLanding();const w=host.clientWidth||500,h=host.clientHeight||500;landingScene=new THREE.Scene();landingCamera=new THREE.PerspectiveCamera(38,w/h,.1,100);landingCamera.position.z=6.4;landingRenderer=new THREE.WebGLRenderer({antialias:true,alpha:true});landingRenderer.setPixelRatio(Math.min(1.6,devicePixelRatio||1));landingRenderer.setSize(w,h,false);landingRenderer.setClearColor(0,0);host.appendChild(landingRenderer.domElement);landingGlobe=new THREE.Group();landingGlobe.rotation.z=-.16;landingScene.add(landingGlobe);const pts=[];const golden=(1+Math.sqrt(5))/2;for(let i=0;i<1700;i++){const y=1-i/1699*2,r=Math.sqrt(Math.max(0,1-y*y)),a=i*golden*Math.PI*2;pts.push(Math.cos(a)*r*2.3,y*2.3,Math.sin(a)*r*2.3)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));landingGlobe.add(new THREE.Points(g,new THREE.PointsMaterial({color:0x80d9df,size:.026,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending})));const mat=new THREE.LineBasicMaterial({color:0x65cbd2,transparent:true,opacity:.12});for(let lat=-75;lat<=75;lat+=15){const ring=[],p=THREE.MathUtils.degToRad(lat),rr=Math.cos(p)*2.31,yy=Math.sin(p)*2.31;for(let j=0;j<=96;j++){const a=j/96*Math.PI*2;ring.push(new THREE.Vector3(Math.cos(a)*rr,yy,Math.sin(a)*rr))}landingGlobe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring),mat));}let drag=false,lastX=0,lastY=0;host.onpointerdown=e=>{drag=true;lastX=e.clientX;lastY=e.clientY};host.onpointerup=()=>drag=false;host.onpointerleave=()=>drag=false;host.onpointermove=e=>{if(drag){landingGlobe.rotation.y+=(e.clientX-lastX)*.004;landingGlobe.rotation.x+=(e.clientY-lastY)*.003;lastX=e.clientX;lastY=e.clientY}};const anim=()=>{landingFrame=requestAnimationFrame(anim);if(!drag)landingGlobe.rotation.y+=.0015;landingRenderer.render(landingScene,landingCamera)};anim();window.addEventListener('resize',()=>{if(!landingRenderer)return;const ww=host.clientWidth,hh=host.clientHeight;landingCamera.aspect=ww/hh;landingCamera.updateProjectionMatrix();landingRenderer.setSize(ww,hh,false);},{once:false});}
function showLanding(){disposeLanding();$('#app').innerHTML=`<main class="landing"><div class="landing-copy"><small>SIMULATE · BUILD · WATCH IT LIVE</small><h1>FORGE<br><span>A NATION</span></h1><p>Build a country. Then watch your decisions become cities, roads, factories, farms and history.</p><button class="landingbtn" data-action="create">CREATE YOUR NATION <b>→</b></button><div class="landingnote">LOCAL-FIRST · SINGLE PLAYER · NO ACCOUNT</div>${credits()}</div><div class="landing-globe" id="landing-globe"></div></main>`;initLanding();}
function showGame(){if(!state.nation){showLanding();return}renderGame();}
function renderCreator(){disposeLanding();$('#app').innerHTML=`<main class="creator"><div class="creatorcard"><button class="backbtn" data-action="backlanding">← Back</button><div class="creatorhead"><small>FORGE A NATION</small><h1>Create Your Nation</h1><p>Choose an identity, a focus, and a starting population.</p></div><div class="creatorgrid"><label>Nation Name<input id="nationName" value="Novara" maxlength="24"></label><label>Government<select id="gov"><option>Republic</option><option>Kingdom</option><option>Federation</option><option>Commonwealth</option></select></label><label>Capital Geography<select id="terrain"><option>Coastal</option><option>River Valley</option><option>Highlands</option><option>Plains</option></select></label><label>Starting Population<select id="pop"><option value="1.2" selected>1.2 million</option><option value="2.1">2.1 million</option><option value="3.8">3.8 million</option><option value="5.2">5.2 million</option></select></label></div><label>National Focus<select id="focus">${Object.entries(focusDefs).map(([k,v])=>`<option value="${k}">${v.name} — ${v.desc}</option>`).join('')}</select></label><div class="presetrow"><button data-preset="coastal">Coastal Republic</button><button data-preset="industrial">Industrial Power</button><button data-preset="tech">Tech Nation</button><button data-preset="cultural">Cultural State</button></div><button class="landingbtn createbtn" data-action="forge">CREATE NATION <b>→</b></button>${credits()}</div></main>`;$$('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>{const p=btn.dataset.preset;$('#terrain').value=p==='coastal'?'Coastal':p==='tech'?'River Valley':p==='cultural'?'Coastal':'Plains';$('#focus').value=p==='coastal'?'commercial':p==='tech'?'technological':p==='cultural'?'cultural':'industrial';}));}

let navSwipe=false,navStartX=0,navStartY=0;
document.addEventListener('touchstart',e=>{const nav=e.target.closest('.sidebar nav');if(!nav)return;const t=e.touches[0];navSwipe=false;navStartX=t.clientX;navStartY=t.clientY;},{passive:true});
document.addEventListener('touchmove',e=>{const nav=e.target.closest('.sidebar nav');if(!nav)return;const t=e.touches[0];if(Math.abs(t.clientX-navStartX)>10&&Math.abs(t.clientX-navStartX)>Math.abs(t.clientY-navStartY))navSwipe=true;},{passive:true});
document.addEventListener('click',e=>{if(e.isTrusted){ensureAudio();if(!e.target.closest('[data-action=toggle-sound]'))sfx('click');}if(navSwipe&&e.target.closest('.sidebar nav')){navSwipe=false;e.preventDefault();e.stopPropagation();return;}const b=e.target.closest('[data-screen],[data-action],[data-skill],[data-buy],[data-moment],[data-opportunity],[data-build],[data-zone],[data-city-visit],[data-game-action]');if(!b)return;if(b.dataset.screen){state.screen=b.dataset.screen;state.ui=state.ui||{};state.ui.mobileNav=false;save();renderGame();return}if(b.dataset.skill){upgradeSkill(b.dataset.skill);return}if(b.dataset.buy){buyAsset(b.dataset.buy);return}if(b.dataset.moment){return}if(b.dataset.opportunity){beginOpportunity(b.dataset.opportunity);return}if(b.dataset.gameAction){miniGameAction(b.dataset.gameAction,b.dataset.gameValue);return}if(b.dataset.build){buildInCity(b.dataset.build);return}if(b.dataset.zone){zoneCity(b.dataset.zone);return}if(b.dataset.cityVisit){visitCity(Number(b.dataset.cityVisit));return}if(b.dataset.screen==='cities'&&e.target.closest('[data-city-select]'))return;const a=b.dataset.action;if(a==='toggle-sound'){toggleSound();return}if(a==='close-activity-result'){closeActivityResult();return}if(a==='toggle-sidebar'){state.ui=state.ui||{};if(window.innerWidth<=980){state.ui.mobileNav=!state.ui.mobileNav;}else{state.ui.sidebarCollapsed=!state.ui.sidebarCollapsed;}save();renderGame();return}if(a==='close-mobile-nav'){state.ui.mobileNav=false;save();renderGame();return}if(a==='end-day'){endDay();return}if(a==='create')renderCreator();else if(a==='new')newNation();else if(a==='backlanding'){state.screen='landing';showLanding();}else if(a==='cityup')upgradeCity();else if(a==='collect')collectAway();else if(a==='continue')continuePlaying();else if(a==='road')addRoadToCity();else if(a==='cityup')upgradeCity();else if(a==='open-city-builder'){chooseCity(Number(b.dataset.cityIndex)||0);state.screen='citybuilder';save();renderGame();}else if(a==='advance-opportunity')advanceOpportunity();else if(a==='finish-opportunity')finishOpportunity();else if(a==='cancel-opportunity')cancelOpportunity();else if(a==='forge')createNation();else if(a==='save'){save();toast('Game saved');}});
document.addEventListener('change',e=>{const s=e.target.closest('[data-city-select]');if(s){chooseCity(Number(s.value));}});
setInterval(()=>{if(state.nation){tick();save();}},1000);
if(state.nation)showGame();else showLanding();
