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
  const target=Math.min(12,Math.max(5,3+Math.max(0,(n.cityLevel||3)-2)*2));
  for(let i=n.cities.length;i<target;i++){
    const [name,type]=names[i-3]||[`District ${i+1}`,'Regional City'];
    n.cities.push({name,type,level:1,pop:Math.max(18000,Math.round(n.population*(0.08+((i%4)*0.01)))),income:380000+i*28000,happiness:62+(i%9),budget:Math.round((n.money||12400000)*0.12),roads:2,buildings:[],zones:{residential:2,commercial:1,industrial:1,park:2},cozy:{projects:[],mood:0,decor:[],requests:[]},citySeed:hashCity(`${n.name}:${name}`)});
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

const NATIONAL_CITY_POSITIONS=[[0,5.4],[7.0,1.8],[4.3,-5.4],[-4.3,-5.4],[-7.0,1.8]];
const NATIONAL_BUILD_SITES=[[-11,-6.8],[-10,-2.8],[-11,2.0],[-10,6.1],[-6.8,8.2],[-2.3,8.8],[2.3,8.8],[6.8,8.2],[10,6.1],[11,2.0],[10,-2.8],[11,-6.8],[7.2,-8.8],[3,-9.2],[-3,-9.2],[-7.2,-8.8]];
function cityInitialBudget(i,total){return Math.round(total*([.18,.11,.10,.09,.07][i]||.06));}
function ensureNationalState(n){
 n.assetLevels=n.assetLevels||{};n.nationalPlacements=Array.isArray(n.nationalPlacements)?n.nationalPlacements:[];
 const defs=Object.entries(n.assets||{}).flatMap(([id,count])=>Array.from({length:Number(count||0)},()=>id));
 for(let i=n.nationalPlacements.length;i<defs.length;i++){const pos=findNationalBuildPosition(n);if(!pos)break;n.nationalPlacements.push({id:defs[i],x:pos.x,z:pos.z,rotation:pos.rotation,level:Number(n.assetLevels?.[defs[i]]||1)});}
}
function findNationalBuildPosition(n){
 const used=n.nationalPlacements||[];
 for(const [x,z] of NATIONAL_BUILD_SITES){
  if(used.some(p=>Math.hypot(p.x-x,p.z-z)<1.35))continue;
  if(NATIONAL_CITY_POSITIONS.some(([cx,cz])=>Math.hypot(cx-x,cz-z)<3.35))continue;
  return {x,z,rotation:(used.length%4)*Math.PI/2};
 }
 for(let ring=0;ring<4;ring++)for(let i=0;i<20;i++){
  const r=9.2+ring*1.05,a=i/20*Math.PI*2+ring*.17,x=Math.cos(a)*r,z=Math.sin(a)*r*.72;
  if(Math.abs(x)>12||Math.abs(z)>9.1)continue;
  if(used.some(p=>Math.hypot(p.x-x,p.z-z)<1.35))continue;
  if(NATIONAL_CITY_POSITIONS.some(([cx,cz])=>Math.hypot(cx-x,cz-z)<3.35))continue;
  return {x,z,rotation:(i%4)*Math.PI/2};
 }
 return null;
}
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
 n.cities.forEach(c=>{const b=c.buildings||[];const incomeBoost=b.reduce((a,x)=>a+(BUILD_DEFS.find(d=>d.id===x.id)?.income||0),0);c.income=Math.max(120000,(c.income||0)+Math.round((c.level||1)*18000)+incomeBoost*.03+(c.roads||2)*4000);const cityDaily=Math.max(0,Math.round(c.income*(1+(ev.bonus?.income||0)*.35)));c.budget=Math.max(0,Math.round((c.budget||0)+cityDaily));if((c.cozy?.mood||0)>0)c.happiness=clamp((c.happiness||65)+.25,0,100);const homes=b.reduce((a,x)=>a+(BUILD_DEFS.find(d=>d.id===x.id)?.pop||0),0);c.pop=Math.round((c.pop||0)+homes*.006)});
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
 n.skills={industry:1,education:1,infrastructure:1,technology:1,health:1,commerce:1,culture:1,...n.skills};n.assets={...n.assets};n.cityLevel=n.cityLevel||3;n.reputation=n.reputation??32;n.happiness=n.happiness??68;n.xp=n.xp??384;n.money=n.money??12400000;n.population=n.population??1200000;
 n.cities=Array.isArray(n.cities)&&n.cities.length?n.cities:[{name:n.name+' City',type:'Capital City',level:n.cityLevel,pop:n.population*.34,income:4800000,happiness:72}];
 n.history=n.history||[];n.created=n.created||Date.now();n.focus=n.focus||'industrial';s.ui={sidebarCollapsed:false,mobileNav:false,...(s.ui||{})};n.cozy=n.cozy||{};n.cozy.dayIndex=Math.max(1,n.cozy.dayIndex||1);n.cozy.activityUsed=Number(n.cozy.activityUsed)||0;n.assetLevels=n.assetLevels||{};
 n.cities.forEach((c,i)=>{c.cozy=c.cozy||{projects:[],mood:0,decor:[],requests:[]};c.buildings=Array.isArray(c.buildings)?c.buildings:[];c.roads=Math.max(2,Number(c.roads)||2);c.zones=c.zones||{residential:2,commercial:1,industrial:1,park:2};c.budget=Math.max(0,Math.round(Number(c.budget)||cityInitialBudget(i,n.money)));c.income=Math.max(120000,Math.round(Number(c.income)||180000));c.citySeed=Number.isInteger(c.citySeed)?c.citySeed:hashCity(`${n.name}:${c.name}`);});
 cozyFor(n);ensureCityVariants(n);n.cities.forEach((c,i)=>{c.budget=Math.max(0,Math.round(Number(c.budget)||cityInitialBudget(i,n.money)));});ensureNationalState(n);return s;
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
function income(){const n=state.nation;let total=2430000;for(const d of skillDefs)total*=1+(Math.max(0,n.skills[d.id]-1)*d.gain*.18);for(const id in n.assets){const d=storeDefs.find(x=>x.id===id);if(d){const lv=Math.max(1,Number(n.assetLevels?.[id]||1));total+=n.assets[id]*d.inc*(1+(lv-1)*.22)}}return total*(focusDefs[n.focus]?.income||1)*(1+n.cityLevel*.055);}
function tick(){if(!state.nation)return;state.lastSeen=Date.now();}
function createNation(){
 const name=($('#nationName')?.value||'Novara').trim()||'Novara';const focus=$('#focus')?.value||'industrial';const terrain=$('#terrain')?.value||'Coastal';const gov=$('#gov')?.value||'Republic';const pop=Number($('#pop')?.value||1.2);const fd=focusDefs[focus]||focusDefs.industrial;
 const govMods={Republic:{money:0,reputation:4,happiness:3,skills:{commerce:1},asset:'market'},Kingdom:{money:800000,reputation:6,happiness:1,skills:{industry:1,culture:1},asset:'cottage'},Federation:{money:300000,reputation:3,happiness:2,skills:{infrastructure:1,education:1},asset:'station'},Commonwealth:{money:500000,reputation:5,happiness:2,skills:{commerce:1,culture:1},asset:'school'}}[gov];
 const terrainMods={Coastal:{money:450000,reputation:1,happiness:1,skills:{commerce:1},resources:{food:68,energy:72,materials:58},cityType:'Coastal Port'},'River Valley':{money:250000,reputation:0,happiness:4,skills:{health:1,commerce:1},resources:{food:84,energy:64,materials:55},cityType:'River Valley'},Highlands:{money:150000,reputation:1,happiness:2,skills:{infrastructure:1},resources:{food:62,energy:80,materials:72},cityType:'Highland Town'},Plains:{money:350000,reputation:0,happiness:3,skills:{industry:1},resources:{food:88,energy:66,materials:64},cityType:'Plains City'}}[terrain];
 const baseMoney=12400000,basePop=pop*1e6,startingMoney=Math.round(baseMoney+govMods.money+terrainMods.money+(fd.income-1)*450000),startingRep=32+govMods.reputation+terrainMods.reputation+(focus==='cultural'?4:focus==='commercial'?3:0),startingHappy=clamp(68+govMods.happiness+terrainMods.happiness+(focus==='agricultural'?3:focus==='technological'?1:0),45,90),startingCityLevel=3+(focus==='industrial'||focus==='commercial'?1:0)+(terrain==='Coastal'?1:0);
 const cityDefs=[[name+' City',terrainMods.cityType,startingCityLevel,.34],['Riverbend','River City',1,.18],['Northfield','Agricultural Town',1,.17],['Harborview','Trade City',1,.16],['Highland','Highland Town',1,.15]];
 const cities=cityDefs.map((x,i)=>({name:x[0],type:x[1],level:x[2],pop:Math.round(basePop*x[3]),income:i===0?Math.round(4800000*fd.income):Math.round(650000+i*70000),happiness:clamp(startingHappy+(i===0?2:(i%2?0:-1)),45,95),budget:cityInitialBudget(i,startingMoney),buildings:[],roads:i===0?3:2,zones:{residential:2,commercial:1,industrial:1,park:2},cozy:{projects:[],mood:0,decor:[],requests:[]},citySeed:hashCity(`${name}:${x[0]}`)}));
 state.nation={name,capital:name+' City',focus,terrain,government:gov,population:basePop,money:startingMoney,xp:384,skills:{industry:2,education:1,infrastructure:2,technology:1,health:1,commerce:1,culture:1},assets:{},assetLevels:{},nationalPlacements:[],cityLevel:startingCityLevel,reputation:startingRep,happiness:startingHappy,awayEarned:0,history:[`Founded as a ${gov.toLowerCase()} in a ${terrain.toLowerCase()} region. Five cities form the starting country.`],cities,created:Date.now(),cozy:{day:'',tasks:[],streak:0,collection:[],selectedCity:0},resources:{...terrainMods.resources},nationalBuildLevel:1};
 const extra={...govMods.skills,...terrainMods.skills};Object.entries(extra).forEach(([k,v])=>state.nation.skills[k]=(state.nation.skills[k]||1)+v);state.nation.assets[govMods.asset]=(state.nation.assets[govMods.asset]||0)+1;const focusAsset={industrial:'workshop',commercial:'shop',agricultural:'market',technological:'university',cultural:'museum'}[focus];if(focusAsset)state.nation.assets[focusAsset]=(state.nation.assets[focusAsset]||0)+1;state.nation.history.unshift(`Starting package: ${terrain} geography + ${gov} institutions + ${fd.name} focus.`);ensureNationalState(state.nation);state.nation.history.unshift('Five cities founded: the capital plus Riverbend, Northfield, Harborview and Highland.');state.screen='home';state.lastSeen=Date.now();save();showGame();sfx('success');toast('Nation forged with five cities.');
}
function newNation(){if(confirm('Start a new nation? Your current nation will be replaced.')){try{[...new Set([...SAVE_KEYS,...OLD_KEYS])].forEach(k=>localStorage.removeItem(k));}catch{}try{window.name='';}catch{}state={...defaultState,screen:'landing'};showLanding();}}
function upgradeSkill(id){const n=state.nation,c=skillCost(id),d=skillDefs.find(x=>x.id===id);if(!Number.isFinite(c)||c<0)return toast('This upgrade cost could not be calculated.');if(n.money<c)return toast('You need more national wealth.');n.money=Math.max(0,Math.round(n.money-c));n.skills[id]++;n.xp+=Math.round(c/28000)+70;n.history.unshift(`${d.name} advanced to Level ${n.skills[id]}.`);save();toast(`${d.name} upgraded`);renderGame();}
function costForAssetUpgrade(d,n){const lv=Number(n.assetLevels?.[d.id]||1);return Math.round(d.cost*.55*Math.pow(1.35,lv-1));}
function buyAsset(id){const n=state.nation,d=storeDefs.find(x=>x.id===id);if(!d)return;if(level().level<d.req)return toast(`Reach Level ${d.req} to unlock this.`);if(!Number.isFinite(d.cost)||d.cost<0)return toast('This purchase cost could not be calculated.');if(n.money<d.cost)return toast('Not enough national wealth.');n.nationalPlacements=n.nationalPlacements||[];const pos=findNationalBuildPosition(n);if(!pos)return toast('All current national build sites are occupied.');n.money=Math.max(0,Math.round(n.money-d.cost));n.assets[id]=(n.assets[id]||0)+1;n.assetLevels=n.assetLevels||{};n.assetLevels[id]=Math.max(1,Number(n.assetLevels[id]||1));n.nationalPlacements.push({id,x:pos.x,z:pos.z,rotation:pos.rotation,level:n.assetLevels[id]});n.xp+=Math.round(d.cost/18000);if(id==='stadium')n.happiness=Math.min(100,n.happiness+3);if(id==='hospital')n.happiness=Math.min(100,n.happiness+4);if(id==='finance')n.reputation+=4;n.history.unshift(`${d.name} was built nationally in ${n.name}.`);save();toast(`${d.name} built on the national map`);renderGame();}
function upgradeNationalAsset(id){const n=state.nation,d=storeDefs.find(x=>x.id===id);if(!d)return;const count=Number(n.assets?.[id]||0);if(count<1)return toast(`Build a ${d.name} first.`);n.assetLevels=n.assetLevels||{};const lv=Number(n.assetLevels[id]||1),cost=costForAssetUpgrade(d,n);if(n.money<cost)return toast(`You need ${money(cost)} to upgrade ${d.name}.`);n.money-=cost;n.assetLevels[id]=lv+1;n.xp+=Math.round(cost/16000)+90;n.history.unshift(`${d.name} reached National Level ${lv+1}.`);n.nationalPlacements=(n.nationalPlacements||[]).map(p=>p.id===id?{...p,level:lv+1}:p);save();toast(`⬆ ${d.name} upgraded to Level ${lv+1}`);renderGame();}
function upgradeCity(){const n=state.nation,c=selectedCity(),cost=Math.round(520000*Math.pow(1.42,Math.max(0,(c.level||1)-1)));if(c.budget<cost)return toast(`You need ${money(cost)} in ${c.name}'s city fund.`);c.budget=Math.max(0,Math.round(c.budget-cost));c.level=(c.level||1)+1;c.pop=Math.round(c.pop*1.10);c.income=(c.income||0)+Math.round(140000+80000*(c.level-1));c.happiness=Math.min(100,(c.happiness||65)+1);n.cityLevel=Math.max(n.cityLevel||1,c.level);n.happiness=Math.min(100,n.happiness+.4);n.xp+=Math.round(cost/12000)+80;if(c.level%2===0)c.roads=(c.roads||2)+1;n.history.unshift(`${c.name} reached City Level ${c.level}.`);save();toast(`${c.name} grew into City Level ${c.level}`);renderGame();}
function buildCost(def,c){return Math.round(def.cost*Math.pow(1.14,(c.buildings||[]).filter(x=>x.id===def.id).length));}
function buildInCity(id){const n=state.nation,c=selectedCity(),def=BUILD_DEFS.find(x=>x.id===id);if(!def)return;const cost=buildCost(def,c);if(!Number.isFinite(cost)||cost<0)return toast('This building cost could not be calculated.');if(c.budget<cost)return toast(`You need ${money(cost)} in ${c.name}'s city fund.`);if((c.level||1)<(def.cat==='Civic'&&id==='university'?4:def.cat==='Infrastructure'?2:1))return toast('Grow the city further to unlock this.');const used=new Set((c.buildings||[]).map(x=>x.slot));const slot=LOTS.findIndex((_,i)=>!used.has(i));if(slot<0)return toast('All planned lots are occupied. Upgrade the city to unlock more land.');c.budget=Math.max(0,Math.round(c.budget-cost));c.buildings=c.buildings||[];c.buildings.push({id,slot,level:1});c.income=(c.income||0)+Math.round(def.income||def.jobs*1800||12000);c.happiness=clamp((c.happiness||65)+(def.happy||0),0,100);c.pop=Math.round((c.pop||0)+(def.pop||0)*.1);n.xp+=Math.round(cost/12000)+35;if(def.cat==='Nature')c.zones.park++;if(def.cat==='Residential')c.zones.residential++;if(def.cat==='Commercial')c.zones.commercial++;if(def.cat==='Industrial')c.zones.industrial++;n.history.unshift(`${def.name} was built in ${c.name}.`);save();toast(`${def.icon} ${def.name} opened in ${c.name}`);renderGame();}
function addRoadToCity(){const n=state.nation,c=selectedCity(),cost=Math.round(180000*Math.pow(1.12,Math.max(0,(c.roads||2)-2)));if(c.budget<cost)return toast(`You need ${money(cost)} in ${c.name}'s city fund.`);if((c.roads||2)>=8+(c.level||1)*2)return toast('The current road network is already extensive.');c.budget-=cost;c.roads=(c.roads||2)+1;c.income=(c.income||0)+26000;c.happiness=clamp((c.happiness||65)+.25,0,100);n.xp+=50;n.history.unshift(`A new road opened in ${c.name}.`);save();toast('🛣️ Road extended');renderGame();}
function zoneCity(id){const n=state.nation,c=selectedCity(),cost={residential:25000,commercial:30000,industrial:35000,park:20000}[id]||25000;if(c.budget<cost)return toast(`You need ${money(cost)} in ${c.name}'s city fund.`);c.budget-=cost;c.zones=c.zones||{};c.zones[id]=(c.zones[id]||0)+1;c.happiness=clamp((c.happiness||65)+(id==='park'?1:.15),0,100);n.xp+=8;save();toast(`${ZONE_DEFS.find(z=>z.id===id)?.icon||'◈'} ${ZONE_DEFS.find(z=>z.id===id)?.name||id} land reserved`);renderGame();}
function fundCity(amount=500000){const n=state.nation,c=selectedCity();const a=Math.min(Math.max(50000,Number(amount)||500000),Math.max(0,n.money));if(a<50000)return toast('National treasury is too low to fund this city.');n.money-=a;c.budget=(c.budget||0)+Math.round(a);n.history.unshift(`${money(a)} transferred from the national treasury to ${c.name}.`);save();toast(`${money(a)} added to ${c.name}'s city fund`);renderGame();}
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
function storeCard(){const n=state.nation;return `<section class="panel store-panel"><div class="paneltitle"><h2>National Build Store</h2><button class="textbtn" data-screen="store">View All</button></div><div class="tabs"><button class="active">All</button><button>Economic</button><button>Civic</button><button>Culture</button><button>Luxury</button></div><div class="storelist">${storeDefs.slice(0,6).map(d=>{const ok=level().level>=d.req,can=n.money>=d.cost,count=Number(n.assets?.[d.id]||0),lv=Number(n.assetLevels?.[d.id]||1),up=count?costForAssetUpgrade(d,n):0;return `<div class="storeitem"><img src="/${d.img}" alt=""><div><b>${d.name}</b><small>${d.desc} · ${count} built · Lv.${lv}</small></div><strong>${money(d.cost)}</strong><button class="mini ${ok&&can?'greenbtn':'lockbtn'}" data-buy="${d.id}" ${ok&&can?'':'disabled'}>${ok?'Build':'🔒'}</button>${count?`<button class="mini outline" data-upgrade-asset="${d.id}">⬆ ${money(up)}</button>`:''}</div>`}).join('')}</div><p class="storehint">Every national build becomes a real building on your country map.</p></section>`;}
function cityCard(){const n=state.nation,c=n.cities[0],cityCost=Math.round(520000*Math.pow(1.42,Math.max(0,(c.level||1)-1)));return `<section class="panel city-panel"><div class="paneltitle"><h2>Capital City</h2><button class="textbtn" data-screen="cities">View All</button></div><div class="cityimage city3d" data-city-scene="${esc(c.name)}"><span>Lv. ${c.level}</span></div><div class="cityhead"><div><b>${esc(c.name)}</b><small>◉ ${esc(c.type)} · ${money(c.budget||0)} city fund</small></div></div><div class="citystats"><div>${icon('♟')}<small>Population</small><b>${fmt(c.pop/1e6)}M</b><em>Local</em></div><div>${icon('◉')}<small>Income</small><b>${money(c.income)}</b><em>Per day</em></div><div>${icon('♥')}<small>Happiness</small><b>${Math.round(c.happiness)}%</b><em>Local</em></div></div><h3>City Development</h3><div class="buildingrow"><div class="buildingbadge">▤</div><div><b>City Fund</b><small>Spend this budget on local buildings, roads and land.</small></div><button class="mini greenbtn" data-action="fund-city">+${money(500000)}</button></div><div class="buildingrow"><div class="buildingbadge">⌂</div><div><b>City Level</b><small>Lv. ${c.level} · unlocks more development</small></div><button class="mini greenbtn" data-action="cityup">Upgrade<span>${money(cityCost)}</span></button></div><button class="cityupgrade gold" data-action="open-city-builder" data-city-index="0">Open City Builder</button></section>`;}
function progressCard(){const n=state.nation,l=level(),next=nextLevel();return `<section class="panel progress-panel"><div class="paneltitle"><h2>Development Progress</h2></div><div class="stage"><small>Current Stage</small><b>${l.name}</b><span>Lv. ${l.level}</span><div class="bar"><i style="width:${xpPct()}%"></i></div><em>${Math.floor(n.xp).toLocaleString()} / ${(next?.xp||n.xp).toLocaleString()}</em></div><div class="next"><small>Next Promotion</small><h3>${next?next.name:'World-Class Nation'}</h3>${next?`<p>Requirements:</p><div>✓ Reach ${next.xp.toLocaleString()} development XP</div><div>✓ Grow your national wealth</div><div>✓ Upgrade key capabilities</div><hr><p>Rewards:</p><div>+18% National Income</div><div>New buildings unlocked</div><button class="gold" data-screen="statistics">View Progression</button>`:`<p>Your nation has reached the highest stage.</p>`}</div></section>`;}
function globalCard(){return `<section class="panel global-panel"><div class="paneltitle"><h2>Global Standing</h2><button class="textbtn">View All</button></div><div class="diplomacy">${icon('◎')}<span><b>Diplomacy</b><small>Allies</small></span><b>›</b></div>${[['US','United States','Friendly +20'],['◇','Eurasia','Neutral +12'],['★','Al-Sham','Neutral +8'],['◉','Veridian','Tense -14']].map((x,i)=>`<div class="relation"><b>${x[0]}</b><span>${x[1]}</span><small class="${i===3?'bad':''}">${x[2]}</small></div>`).join('')}</section>`;}
function achievements(){const arr=[['⌂','Factory Built','Build your first factory','+10'],['◆','University','Build a university','+10'],['◉','First Export Deal','Trade internationally','+20'],['♟','Population Milestone','Reach 1 million population','+30'],['◎','Good Relations','Form an alliance','+15']];return `<section class="panel achievements"><div class="paneltitle"><h2>Achievements</h2><button class="textbtn">View All</button></div><div class="tabs"><button class="active">All</button><button>Trade</button><button>Relations</button></div>${arr.map((x,i)=>`<div><span class="achievementicon">${x[0]}</span><section><b>${x[1]}</b><small>${x[2]}</small></section><em>${i<1&&state.nation.assets.factory?x[3]:'+'+x[3].replace('+','')}</em></div>`).join('')}</section>`;}
function lower(){const n=state.nation,l=level();return `<section class="panel national-progress"><div class="paneltitle"><h2>National Progression</h2></div><div class="nodes">${levels.map(x=>`<div class="node ${x.level<=l.level?'done':''} ${x.level===l.level?'current':''}"><span>${x.level<=l.level?'◆':'◇'}</span><b>${x.name.replace(' Nation','')}</b><small>Lv. ${x.level}</small></div>`).join('')}</div></section><section class="panel activity"><div class="paneltitle"><h2>Recent Activity</h2></div>${n.history.slice(0,4).map((x,i)=>`<div>${icon(['◉','◆','⌂','♟'][i])}<span>${esc(x)}</span><small>${i+1}h ago</small></div>`).join('')}</section><section class="panel buildtomorrow"><img src="/hero-art.jpg" alt="Clean city illustration"><div><h2>Build a greater tomorrow</h2><p>Your decisions shape the future of ${esc(n.name)}.</p><button class="gold" data-screen="map">View Map</button></div></section>`;}
function cozyCard(){const n=state.nation,c=selectedCity(),z=cozyFor(n),ev=dailyEvent(n),d=internalDate(n);const tasks=z.tasks.map(id=>cozyMoments.find(x=>x.id===id)).filter(Boolean);const canEnd=z.activityUsed>=3&&!z.dayEnded;return `<section class="panel cozy-panel"><div class="paneltitle"><div><h2>Today in ${esc(c.name)}</h2><small>${d.season} · ${ev.icon} ${ev.title}</small></div><div class="dayactions"><span class="apbadge">${z.activityUsed}/10 AP</span>${canEnd?`<button class="gold endday" data-action="end-day">End Day →</button>`:''}</div></div><div class="daily-event"><b>${ev.icon} ${ev.title}</b><span>${ev.desc}</span></div><div class="citypick"><span>Visit</span><select data-city-select>${n.cities.map((x,i)=>`<option value="${i}" ${i===(z.selectedCity||0)?'selected':''}>${esc(x.name)}</option>`).join('')}</select><b>${Math.round(c.happiness||65)}% happy</b></div><div class="momentlist">${tasks.map(x=>{const done=z.done.includes(x.id),locked=z.activityUsed+(x.costAP||1)>10,can=n.money>=x.cost;return `<article class="moment ${done?'done':''}"><div class="momenticon">${x.icon}</div><div><b>${x.title}</b><small>${x.desc}</small><em>${x.costAP||1} AP · ${x.reward?`Earn ${money(x.reward)} · `:''}+${x.happy}% happiness</em></div><button class="mini ${done||locked?'lockbtn':'greenbtn'}" data-moment="${x.id}" ${done||locked||!can?'disabled':''}>${done?'Done':locked?'10 AP':can?'Do it':'Need '+money(x.cost)}</button></article>`}).join('')}</div><div class="dayfooter"><span>Do 3+ activities to unlock <b>End Day</b>.</span><span>Next year in ${25-d.dayOfYear} days</span></div></section>`;}
function mailboxCard(){const n=state.nation,z=cozyFor(n),m=(z.mailbox||[]).slice(0,3);return `<section class="panel mailbox"><div class="paneltitle"><h2>📬 Mailbox</h2><span>${m.length} new notes</span></div>${m.length?m.map(x=>`<div class="mailrow"><span>${x.icon}</span><section><b>${esc(x.title)}</b><small>${esc(x.text)}</small></section></div>`).join(''):`<div class="emptybox">Your mailbox is quiet. Someone will write soon.</div>`}</section>`;}
function reportCard(){const n=state.nation,z=cozyFor(n),r=z.lastReport;return `<section class="panel reportcard"><div class="paneltitle"><h2>🌙 Last Day</h2><span>${r?`Day ${r.day}`:'Not yet'}</span></div>${r?`<div class="reportgrid"><div><b>${money(r.earned)}</b><small>earned</small></div><div><b>${r.activities}</b><small>activities</small></div><div><b>${esc(r.season)}</b><small>season</small></div></div><p>${esc(r.event)} made the day feel a little different.</p>`:`<div class="emptybox">Finish your first day to see its little story here.</div>`}</section>`;}
function collectionCard(){const n=state.nation,z=cozyFor(n),items=z.collection||[];return `<section class="panel collection"><div class="paneltitle"><h2>🎒 Nation Collection</h2><button class="textbtn" data-screen="history">Scrapbook</button></div><div class="collectgrid">${items.slice(-8).map((x,i)=>`<div title="Discovered on Day ${Math.max(1,z.dayIndex-i)}"><span>${x.startsWith('memory')?'📷':(cozyMoments.find(m=>m.id===x)?.icon||'✨')}</span><small>${x.startsWith('memory')?'Memory':'Keepsake'}</small></div>`).join('')||'<div class="emptybox">Little discoveries will appear here.</div>'}</div></section>`;}
function cityBuilder(){const n=state.nation,c=selectedCity(),z=cozyFor(n),defs=BUILD_DEFS;return listPage('City Builder',`${esc(c.name)} — shape the city yourself.`,`<div class="builderlayout"><section class="builderworld panel"><div class="builderhead"><div><small>${esc(c.type)}</small><h2>${esc(c.name)}</h2><p>${fmt(c.pop/1e6)}M residents · Level ${c.level} · ${Math.round(c.happiness)}% happiness · ${money(c.budget||0)} city fund</p></div><div class="builderactions"><button class="outline" data-action="fund-city">＋ Fund City</button><button class="outline" data-action="road">🛣️ Extend Road</button><button class="gold" data-action="cityup">⬆ Grow City</button></div></div><div class="builder3d city3d" data-city-scene="${esc(c.name)}"></div><div class="builderstats"><span>🏠 ${c.buildings?.filter(x=>BUILD_DEFS.find(d=>d.id===x.id)?.cat==='Residential').length||0} homes</span><span>💼 ${c.buildings?.reduce((a,x)=>a+(BUILD_DEFS.find(d=>d.id===x.id)?.jobs||0),0)||0} jobs</span><span>🛣️ ${c.roads||2} road links</span><span>🌳 ${c.zones?.park||0} green zones</span></div></section><section class="buildcatalog panel"><div class="paneltitle"><h2>Build</h2><span>Place something useful</span></div><div class="buildfilters">${['All','Residential','Commercial','Civic','Industrial','Nature','Infrastructure','Culture'].map(x=>`<button class="${x==='All'?'active':''}">${x}</button>`).join('')}</div><div class="buildgrid">${defs.map(d=>{const cost=buildCost(d,c),locked=(d.id==='university'&&c.level<4)||(d.cat==='Infrastructure'&&c.level<2);return `<article class="buildcard"><div class="buildicon">${d.icon}</div><div><b>${d.name}</b><small>${d.desc}</small><em>${money(cost)} · ${d.cat}</em></div><button class="mini ${locked?'lockbtn':'greenbtn'}" data-build="${d.id}" ${locked?'disabled':''}>${locked?'🔒':'Build'}</button></article>`}).join('')}</div></section><section class="zones panel"><div class="paneltitle"><h2>Plan the city</h2><span>Reserve space</span></div><div class="zonegrid">${ZONE_DEFS.map(x=>`<button class="zonebtn" data-zone="${x.id}"><b>${x.icon} ${x.name}</b><small>${x.effect}</small><em>${c.zones?.[x.id]||0} zones</em></button>`).join('')}</div></section></div>`);}
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
function fullStore(){return listPage('National Build Store','Buy lasting national projects. Every purchase is placed on the country map.',`<div class="fullstore">${storeDefs.map(d=>{const n=state.nation,u=level().level>=d.req,can=n.money>=d.cost,count=Number(n.assets?.[d.id]||0),lv=Number(n.assetLevels?.[d.id]||1),up=count?costForAssetUpgrade(d,n):0;return `<article class="bigstore"><img class="thumb" src="/${d.img}" alt=""><div><h2>${d.name}</h2><p>${d.desc}</p><small>+${money(d.inc)} base/day · Requires Level ${d.req} · ${count} built · National Lv.${lv}</small></div><strong>${money(d.cost)}</strong><button class="gold" data-buy="${d.id}" ${!u||!can?'disabled':''}>${u?'Build':'Locked'}</button>${count?`<button class="outline" data-upgrade-asset="${d.id}">Upgrade · ${money(up)}</button>`:''}</article>`}).join('')}</div><section class="panel storehintpanel"><b>National builds are persistent map objects.</b><span>Upgrades increase their national level and effect.</span></section>`);}
function fullCities(){const n=state.nation;cozyFor(n);return listPage('Cities','Five starting cities. Each city has its own fund, buildings, roads and local progression.',`<div class="citiesfull">${n.cities.map((c,i)=>`<article class="citylarge ${i===(n.cozy.selectedCity||0)?'selectedcity':''}"><div class="citylarge3d city3d" data-city-scene="${esc(c.name)}"></div><div><div class="citytag">${esc(c.type)}</div><h2>${esc(c.name)}</h2><p>${fmt(c.pop/1e6)}M citizens · Level ${c.level} · ${Math.round(c.happiness||65)}% happiness</p><div class="citychips"><span>💰 ${money(c.budget||0)} fund</span><span>🏠 ${(c.buildings||[]).length} buildings</span><span>🛣️ ${c.roads||2} roads</span><span>🌳 ${c.zones?.park||0} green zones</span></div><button class="gold" data-city-visit="${i}">Visit & Build</button></div></article>`).join('')}</div>`);}
function fullProgress(){return listPage('Nation Progression','Watch your story unfold.',`<div class="fullprogress">${levels.map(x=>`<article class="pstage ${x.level<=level().level?'done':''}"><span>Lv.${x.level}</span><h2>${x.name}</h2><p>Unlock: ${x.unlock}</p><small>${x.xp.toLocaleString()} XP</small></article>`).join('')}</div>`);}
function fullMap(){const n=state.nation;return listPage('National Map','Your five cities form one country. National builds live around them.',`<section class="mapscene panel"><div class="nation3d" id="nation-city-scene"></div><div class="maplegend"><span><i class="legend-dot citydot"></i>Cities</span><span><i class="legend-line roadline"></i>National Roads</span><span>🏗️ ${Object.values(n.assets||{}).reduce((a,x)=>a+Number(x||0),0)} national builds</span></div><div class="mapbadges"><div><b>${n.cities.length}</b><small>Cities</small></div><div><b>${money(n.money)}</b><small>National Treasury</small></div><div><b>Lv. ${level().level}</b><small>Nation</small></div></div><button class="gold" data-screen="cities">Manage Cities</button> <button class="outline" data-screen="store">National Build</button></section>`);}
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
  addHayDayCityAssets(city,hashCity(`${state.nation?.name||'nation'}:hero-isometric`),lvl,{population:Math.round((state.nation?.population||0)*.32),hero:true,footprintScale:.72});

  const rec={renderer,scene,camera,world,host}; heroSceneRecord=rec;
  let t=0,lastAgentTime=performance.now();
  const animate=()=>{
    heroSceneFrame=requestAnimationFrame(animate);
    const now=performance.now(),dt=Math.min((now-lastAgentTime)/1000,.05);lastAgentTime=now;
    t+=.0025;
    updateCityAgents(world,dt);
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
function fitKenney(root,maxXZ=1.4,maxY=2.4){
 if(!root)return root;
 const box=new THREE.Box3().setFromObject(root),size=new THREE.Vector3();box.getSize(size);
 const scale=Math.min(1,size.x>0?maxXZ/size.x:1,size.z>0?maxXZ/size.z:1,size.y>0?maxY/size.y:1);
 root.scale.multiplyScalar(scale);
 const after=new THREE.Box3().setFromObject(root);if(Number.isFinite(after.min.y))root.position.y-=after.min.y;
 return root;
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
    const worldR=radius;

    // Three wide streets in each direction create four large city blocks.
    // Intersections exist only where the streets actually cross.
    const roadLines=[-4,0,4];
    const roadMin=-5.5,roadMax=5.5;
    const rg=new THREE.Group();rg.name='Road Network';district.add(rg);
    const straight=roads[0],cross=roads[2]||straight;
    for(const z of roadLines){
      for(let x=roadMin;x<=roadMax;x+=1){
        const r=cloneKenney(straight);r.position.set(x,.02,z);r.rotation.y=Math.PI/2;rg.add(r);
      }
    }
    for(const x of roadLines){
      for(let z=roadMin;z<=roadMax;z+=1){
        const r=cloneKenney(straight);r.position.set(x,.021,z);r.rotation.y=0;rg.add(r);
      }
    }
    for(const x of roadLines)for(const z of roadLines){
      const j=cloneKenney(cross);j.position.set(x,.025,z);rg.add(j);
    }

    // The spaces between roads are the actual city blocks. Every decorative or
    // architectural asset is constrained to one of these blocks, with clearance
    // from the road edges so nothing sits on a street.
    const blocks=[
      {x0:-3.45,x1:-.55,z0:-3.45,z1:-.55,name:'NW'},
      {x0:.55,x1:3.45,z0:-3.45,z1:-.55,name:'NE'},
      {x0:-3.45,x1:-.55,z0:.55,z1:3.45,name:'SW'},
      {x0:.55,x1:3.45,z0:.55,z1:3.45,name:'SE'}
    ];
    const shuffled=blocks.slice().sort(()=>rng()-.5);
    const placeInBlock=(group,models,count,block,scaleRange,minGap)=>placeSpacedKenney(
      group,models,rng,count,block,scaleRange,minGap,.045
    );

    const homes=new THREE.Group();homes.name='Residential Blocks';district.add(homes);
    const shops=new THREE.Group();shops.name='Commercial Blocks';district.add(shops);
    const factories=new THREE.Group();factories.name='Industrial Block';district.add(factories);
    const skyline=new THREE.Group();skyline.name='Downtown Skyline';district.add(skyline);
    const green=new THREE.Group();green.name='Green Spaces';district.add(green);

    // One block is industrial, one is commercial, and the remaining blocks are
    // residential/green. This keeps the zoning readable at a glance.
    const industrialBlock=shuffled[0],commercialBlock=shuffled[1];
    const residentialBlocks=shuffled.slice(2);
    if(lvl>=3)placeInBlock(factories,industrial,Math.min(5,2+Math.floor(lvl/2)),industrialBlock,{min:.56,max:.78},.75);
    if(lvl>=2)placeInBlock(shops,commercial,Math.min(5,2+Math.floor(lvl/2)),commercialBlock,{min:.58,max:.82},.85);
    residentialBlocks.forEach((block,i)=>{
      placeInBlock(homes,residential,Math.min(5,2+Math.floor(lvl/2)),block,{min:.62,max:.9},.7);
      if(i===0){
        const treeCount=4+Math.min(5,lvl);
        for(let t=0;t<treeCount;t++){
          const model=nature[Math.floor(rng()*nature.length)],tree=cloneKenney(model);
          tree.scale.setScalar(.38+rng()*.24);
          tree.position.set(block.x0+rng()*(block.x1-block.x0),.035,block.z0+rng()*(block.z1-block.z0));
          tree.rotation.y=rng()*Math.PI*2;green.add(tree);
        }
      }
    });
    if(lvl>=5&&towers.length)placeInBlock(skyline,towers,Math.min(2,1+Math.floor(lvl/5)),commercialBlock,{min:.5,max:.66},1.05);

    // Citizens belong on the street network, not in the middle of blocks.
    // They move continuously along the three horizontal or three vertical road lines.
    const people=new THREE.Group();people.name='Citizens';district.add(people);
    const count=Math.min(24,4+Math.floor(Math.sqrt(Math.max(1,opts.population||0)/50000))+lvl*2);
    for(let i=0;i<count;i++){
      const p=cloneKenney(citizens[Math.floor(rng()*citizens.length)]);
      p.scale.setScalar(.115+rng()*.025);
      const horizontal=rng()<.5;
      const line=roadLines[Math.floor(rng()*roadLines.length)];
      const startPos=-5.0+rng()*10.0;
      p.position.set(horizontal?startPos:line,.035,horizontal?line:startPos);
      p.rotation.y=horizontal?(rng()<.5?0:Math.PI):(rng()<.5?Math.PI/2:-Math.PI/2);
      p.userData.walkAxis=horizontal?'x':'z';
      p.userData.walkDir=rng()<.5?-1:1;
      p.userData.walkLine=line;
      p.userData.walkSpeed=.72+rng()*.38;
      p.userData.walkMin=-5.05;
      p.userData.walkMax=5.05;
      p.userData.walkDistance=0;
      people.add(p);
    }
  }).catch(err=>console.warn('Local Kenney assets failed to load',err));
}
function addCozyProjectVisuals(group,c){
  // The new city renderer is intentionally self-contained. Existing project
  // data is represented by the real Kenney buildings and decorations below.
}

/* -------------------------------------------------------------------------
   Hay-Day-style city renderer
   - fixed isometric camera
   - deterministic tile map
   - roads/path tiles on a strict grid
   - every building/decorative item lives inside a block
   - characters follow actual path lanes and are updated by the main city loop
   ------------------------------------------------------------------------- */
const HAY_GRID=13;
const HAY_TILE=1.35;
const HAY_CENTER=(HAY_GRID-1)/2;
const HAY_ROADS=[2,6,10];
const HAY_WORLD_MIN=0;
const HAY_WORLD_MAX=HAY_GRID-1;
const HAY_BLOCK_RANGES=[[0,1],[3,5],[7,9],[11,12]];

function hayWorld(i){return (i-HAY_CENTER)*HAY_TILE;}
function hayBlock(indexX,indexZ){
  const xr=HAY_BLOCK_RANGES[indexX],zr=HAY_BLOCK_RANGES[indexZ];
  const cx=hayWorld((xr[0]+xr[1])/2),cz=hayWorld((zr[0]+zr[1])/2);
  return {ix:indexX,iz:indexZ,x0:hayWorld(xr[0])-.57,x1:hayWorld(xr[1])+.57,z0:hayWorld(zr[0])-.57,z1:hayWorld(zr[1])+.57,cx,cz};
}
const HAY_BLOCKS=[];
for(let ix=0;ix<4;ix++)for(let iz=0;iz<4;iz++)HAY_BLOCKS.push(hayBlock(ix,iz));
const HAY_PLAYER_LOTS=LOTS.map(([x,z],i)=>({x,z,index:i,ix:i%4,iz:Math.floor(i/4)}));

function updateCityAgents(root,dt){
  if(!root||!Number.isFinite(dt)||dt<=0)return;
  root.traverse(o=>{
    const a=o.userData?.cityAgent;
    if(!a)return;
    a.t=(a.t||0)+dt;
    const step=a.speed*dt*a.dir;
    if(a.axis==='x')o.position.x+=step;else o.position.z+=step;
    const coord=o.position[a.axis];
    if(coord>=a.max || coord<=a.min){
      a.dir=coord>=a.max?-1:1;
      o.position[a.axis]=THREE.MathUtils.clamp(coord,a.min,a.max);
    }
    o.rotation.y=a.axis==='x'?(a.dir>0?0:Math.PI):(a.dir>0?Math.PI/2:-Math.PI/2);
    a.distance=(a.distance||0)+Math.abs(step);
    o.position.y=a.baseY + Math.sin(a.distance*8.5)*.018;
    o.rotation.z=Math.sin(a.distance*7.2)*.025;
  });
}

function makeHayTile(material,x,z,y=.01,h=.07){
  const tile=new THREE.Mesh(new THREE.BoxGeometry(HAY_TILE*.985,HAY_TILE*.22,HAY_TILE*.985),material.clone());
  tile.position.set(x,y,z);tile.receiveShadow=true;tile.castShadow=false;return tile;
}

function addHayGround(parent,style){
  const g=new THREE.Group();g.name='Hay Day Ground';parent.add(g);
  const baseMat=new THREE.MeshStandardMaterial({color:new THREE.Color(style.ground).offsetHSL(.015,.03,.05),roughness:1});
  const altMat=new THREE.MeshStandardMaterial({color:new THREE.Color(style.ground).offsetHSL(.012,.025,.028),roughness:1});
  for(let iz=0;iz<HAY_GRID;iz++)for(let ix=0;ix<HAY_GRID;ix++)g.add(makeHayTile((ix+iz)%2?altMat:baseMat,hayWorld(ix),hayWorld(iz),-.02,.1));

  const blockMat=new THREE.MeshStandardMaterial({color:new THREE.Color(style.ground).offsetHSL(.02,.02,.09),roughness:1});
  const plotMat=new THREE.MeshStandardMaterial({color:new THREE.Color(style.ground).offsetHSL(.025,.02,.12),roughness:1});
  HAY_BLOCKS.forEach((b,idx)=>{
    const bw=b.x1-b.x0,bz=b.z1-b.z0;
    const slab=new THREE.Mesh(new THREE.BoxGeometry(bw-.08,.065,bz-.08),blockMat.clone());
    slab.position.set(b.cx,.075,b.cz);slab.receiveShadow=true;g.add(slab);
    // A smaller raised plot gives the city the tidy, hand-placed mobile-builder look.
    const inset=.28;
    const plot=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.6,bw-inset),.045,Math.max(.6,bz-inset)),plotMat.clone());
    plot.position.set(b.cx,.112,b.cz);plot.receiveShadow=true;g.add(plot);
  });
  return g;
}

function addHayRoads(parent,roads){
  const g=new THREE.Group();g.name='Hay Day Paths';parent.add(g);
  const straight=roads[0],intersection=roads[2]||roads[0];
  const mid=HAY_TILE;
  // Keep the orientation established in the approved road-rotation update.
  for(const row of HAY_ROADS){
    const z=hayWorld(row);
    for(let i=0;i<HAY_GRID;i++)if(!HAY_ROADS.includes(i)){
      const r=cloneKenney(straight);r.scale.setScalar(mid);r.position.set(hayWorld(i),.14,z);r.rotation.y=Math.PI/2;g.add(r);
    }
  }
  for(const col of HAY_ROADS){
    const x=hayWorld(col);
    for(let i=0;i<HAY_GRID;i++)if(!HAY_ROADS.includes(i)){
      const r=cloneKenney(straight);r.scale.setScalar(mid);r.position.set(x,.141,hayWorld(i));r.rotation.y=0;g.add(r);
    }
  }
  for(const x of HAY_ROADS)for(const z of HAY_ROADS){
    const j=cloneKenney(intersection);j.scale.setScalar(mid);j.position.set(hayWorld(x),.145,hayWorld(z));j.rotation.y=0;g.add(j);
  }
  return g;
}

function hayBlockOccupied(c,b){return (c?.buildings||[]).some(item=>{
  const lot=HAY_PLAYER_LOTS[item.slot%HAY_PLAYER_LOTS.length];
  return lot && lot.ix===b.ix && lot.iz===b.iz;
});}
function hayTryPlace(occupied,block,x,z,r){
  const within=x>=block.x0+r && x<=block.x1-r && z>=block.z0+r && z<=block.z1-r;
  if(!within)return false;
  for(const o of occupied)if(Math.hypot(o.x-x,o.z-z)<o.r+r+.12)return false;
  occupied.push({x,z,r});return true;
}

function addHayBackground(parent,groups,nature,rng,lvl,city){
  const [residential,commercial,industrial,towers]=groups;
  const arch=new THREE.Group();arch.name='Established Buildings';parent.add(arch);
  const decor=new THREE.Group();decor.name='Trees And Greenery';parent.add(decor);
  const occupied=[];
  HAY_PLAYER_LOTS.forEach(p=>{if((city?.buildings||[]).some(b=>b.slot===p.index))occupied.push({x:p.x,z:p.z,r:.94});});

  HAY_BLOCKS.forEach((b,idx)=>{
    const playerBlock=hayBlockOccupied(city,b);
    const edge=b.ix===0||b.ix===3||b.iz===0||b.iz===3;
    const pool=(edge&&industrial.length&&rng()<.28)?industrial:(commercial.length&&rng()<.32?commercial:residential);
    const count=playerBlock?Math.max(0,1-Math.floor(lvl/7)):Math.min(2,1+Math.floor((lvl-1)/5));
    const anchors=[[-.72,-.72],[.72,-.72],[-.72,.72],[.72,.72],[0,0]].map(([x,z])=>({x:b.cx+x,z:b.cz+z})).sort(()=>rng()-.5);
    let placed=0;
    for(const a of anchors){
      if(placed>=count||!pool?.length)break;
      const src=pool[Math.floor(rng()*pool.length)];
      const g=cloneKenney(src);
      const maxXZ=edge?1.45:1.75;
      fitKenney(g,maxXZ,2.55);
      const r=hayTryPlace(occupied,b,a.x,a.z,Math.min(.78,maxXZ*.42));
      if(!r)continue;
      g.position.set(a.x,.16,a.z);g.rotation.y=Math.floor(rng()*4)*Math.PI/2;g.castShadow=true;arch.add(g);placed++;
    }

    const treeSpots=[[-.86,-.86],[.86,-.86],[-.86,.86],[.86,.86],[0,-.92],[.92,0],[-.92,0],[0,.92]].sort(()=>rng()-.5);
    const treeCount=playerBlock?2:Math.min(3,1+Math.floor(lvl/3));
    let planted=0;
    for(const t of treeSpots){
      if(planted>=treeCount)break;
      const x=b.cx+t[0],z=b.cz+t[1];
      if(!hayTryPlace(occupied,b,x,z,.38))continue;
      const src=nature[Math.floor(rng()*nature.length)],tree=cloneKenney(src);
      fitKenney(tree,.85,1.85);tree.scale.multiplyScalar(.72+rng()*.18);tree.position.set(x,.16,z);tree.rotation.y=rng()*Math.PI*2;tree.castShadow=true;decor.add(tree);planted++;
    }
  });

  // A small central plaza sells the mobile-builder presentation without adding another gameplay system.
  const plazaMat=new THREE.MeshStandardMaterial({color:0xc8a86a,roughness:.95});
  const plaza=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.18,.08,24),plazaMat);plaza.position.set(0,.18,0);plaza.receiveShadow=true;decor.add(plaza);
  const plazaTree=nature[Math.floor(rng()*nature.length)];
  if(plazaTree){const tree=cloneKenney(plazaTree);fitKenney(tree,.75,1.65);tree.position.set(0,.22,0);tree.castShadow=true;decor.add(tree);}
}

function addHayPlayerBuildings(parent,c){
  const buildings=c.buildings||[];if(!buildings.length)return;
  const root=new THREE.Group();root.name='Player Buildings';parent.add(root);
  const map={
    cottage:LOCAL_ASSETS.residential,apartment:LOCAL_ASSETS.residential,
    shop:LOCAL_ASSETS.commercial,cafe:LOCAL_ASSETS.commercial,market:LOCAL_ASSETS.commercial,
    school:LOCAL_ASSETS.commercial,clinic:LOCAL_ASSETS.commercial,museum:LOCAL_ASSETS.commercial,
    workshop:LOCAL_ASSETS.industrial,warehouse:LOCAL_ASSETS.industrial,
    station:LOCAL_ASSETS.commercial,stadium:LOCAL_ASSETS.commercial,university:LOCAL_ASSETS.towers
  };
  const urls=[...new Set(buildings.flatMap(b=>map[b.id]||[]))];
  loadAssetSet(urls).then(()=>{
    buildings.forEach((b,idx)=>{
      const def=BUILD_DEFS.find(x=>x.id===b.id),pool=map[b.id];if(!def||!pool?.length)return;
      const lot=HAY_PLAYER_LOTS[b.slot%HAY_PLAYER_LOTS.length],src=kenneyCache.get(pool[(b.slot+idx)%pool.length]);if(!lot||!src)return;
      const g=cloneKenney(src);
      const maxXZ=b.id==='stadium'?1.82:b.id==='university'?1.75:(b.id==='workshop'||b.id==='warehouse'?1.68:1.62);
      fitKenney(g,maxXZ,b.id==='university'?2.9:2.65);
      g.position.set(lot.x,.17,lot.z);g.rotation.y=(idx%4)*Math.PI/2;g.userData.buildingId=b.id;g.castShadow=true;root.add(g);
    });
  }).catch(err=>console.warn('Player building assets failed to load',err));
}

function addHayCitizens(parent,population,rng,models){
  const root=new THREE.Group();root.name='Citizens On Paths';parent.add(root);
  const count=Math.max(5,Math.min(24,Math.round(6+Math.sqrt(Math.max(1,population||0)/70000))));
  for(let i=0;i<count;i++){
    const p=cloneKenney(models[Math.floor(rng()*models.length)]);
    fitKenney(p,.34,.72);
    const horizontal=rng()<.5;
    const lane=HAY_ROADS[Math.floor(rng()*HAY_ROADS.length)];
    const laneWorld=hayWorld(lane);
    const min=hayWorld(0)+HAY_TILE*.16,max=hayWorld(HAY_GRID-1)-HAY_TILE*.16;
    const start=min+rng()*(max-min);
    p.position.set(horizontal?start:laneWorld,.22,horizontal?laneWorld:start);
    p.rotation.y=horizontal?(rng()<.5?0:Math.PI):(rng()<.5?Math.PI/2:-Math.PI/2);
    p.userData.cityAgent={axis:horizontal?'x':'z',dir:rng()<.5?-1:1,min,max,speed:.62+rng()*.35,baseY:.22,distance:rng()*8,t:rng()*4};
    p.castShadow=true;root.add(p);
  }
  // A tiny queue of path walkers feels much livelier than a single hero in the center.
  return root;
}

function addHayDayCityAssets(parent,seed,level,opts={}){
  const rng=seeded(seed),lvl=Math.max(1,Math.min(10,level||1));
  const city=new THREE.Group();city.name='Forge Hay Day City';parent.add(city);
  Promise.all([
    loadAssetSet(LOCAL_ASSETS.residential),loadAssetSet(LOCAL_ASSETS.commercial),loadAssetSet(LOCAL_ASSETS.industrial),
    loadAssetSet(LOCAL_ASSETS.towers),loadAssetSet(LOCAL_ASSETS.roads),loadAssetSet(LOCAL_ASSETS.nature),loadAssetSet(LOCAL_ASSETS.citizens)
  ]).then(([residential,commercial,industrial,towers,roads,nature,citizens])=>{
    const style=opts.style||CITY_STYLES[(seed>>>0)%CITY_STYLES.length];
    const world=new THREE.Group();world.name='City World';city.add(world);
    addHayGround(world,style);
    addHayRoads(world,roads);
    addHayBackground(world,[residential,commercial,industrial,towers],nature,rng,lvl,opts.city||null);
    if(opts.city)addHayPlayerBuildings(world,opts.city);
    if((opts.population||0)>0)addHayCitizens(world,opts.population,rng,citizens);
  }).catch(err=>console.warn('Hay Day city assets failed to load',err));
  return city;
}

function buildCityScene(host,c,opts={}){
  if(!host||!c)return null;
  const width=host.clientWidth||720,height=host.clientHeight||430;
  const style=cityStyle(c);
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(style.ground);
  const aspect=width/height;
  const view=11.6;
  const camera=new THREE.OrthographicCamera(-view*aspect,view*aspect,view,-view,.1,100);
  camera.position.set(15.2,18.5,15.2);camera.lookAt(0,0,0);camera.zoom=1.02;camera.updateProjectionMatrix();
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(1.45,window.devicePixelRatio||1));renderer.setSize(width,height,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  host.innerHTML='';host.appendChild(renderer.domElement);renderer.domElement.style.touchAction='none';
  scene.add(new THREE.HemisphereLight(0xd9efe5,0x27483d,1.9));
  const sun=new THREE.DirectionalLight(0xffe0ad,2.2);sun.position.set(-10,18,10);sun.castShadow=true;scene.add(sun);
  const world=new THREE.Group();scene.add(world);
  // Slight tilt is fixed; users can pan and zoom, not spin the city into unusable angles.
  world.rotation.y=0;world.rotation.x=0;
  addHayDayCityAssets(world,c.citySeed||citySeed(c),c.level||1,{city:c,population:c.pop||0,style});

  let dragging=false,lastX=0,lastY=0;
  renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId)});
  renderer.domElement.addEventListener('pointerup',e=>{dragging=false;renderer.domElement.releasePointerCapture?.(e.pointerId)});
  renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
  renderer.domElement.addEventListener('pointerleave',()=>dragging=false);
  renderer.domElement.addEventListener('pointermove',e=>{
    if(!dragging)return;
    const dx=e.clientX-lastX,dy=e.clientY-lastY;
    world.position.x+=dx*.018/camera.zoom;
    world.position.z+=dy*.018/camera.zoom;
    const lim=5.2;
    world.position.x=THREE.MathUtils.clamp(world.position.x,-lim,lim);world.position.z=THREE.MathUtils.clamp(world.position.z,-lim,lim);
    lastX=e.clientX;lastY=e.clientY;
  });
  renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();camera.zoom=THREE.MathUtils.clamp(camera.zoom*(e.deltaY<0?1.09:.92),.72,1.9);camera.updateProjectionMatrix();},{passive:false});
  const rec={renderer,scene,camera,group:world,host};citySceneRecords.push(rec);return rec;
}
function makeNationLabel(text,sub){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(8,18,24,.84)';if(ctx.roundRect){ctx.beginPath();ctx.roundRect(12,16,488,96,18);ctx.fill();}else ctx.fillRect(12,16,488,96);ctx.fillStyle='#f4e4bd';ctx.font='bold 32px system-ui,sans-serif';ctx.fillText(text,28,56);ctx.fillStyle='#9dc7c8';ctx.font='21px system-ui,sans-serif';ctx.fillText(sub,28,89);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const mat=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false});const sp=new THREE.Sprite(mat);sp.scale.set(3.5,.88,1);return sp;}
function nationalAssetPool(id){const m={factory:LOCAL_ASSETS.industrial,railway:LOCAL_ASSETS.industrial,airport:LOCAL_ASSETS.commercial,hospital:LOCAL_ASSETS.commercial,stadium:LOCAL_ASSETS.commercial,university:LOCAL_ASSETS.towers,research:LOCAL_ASSETS.commercial,finance:LOCAL_ASSETS.commercial};return m[id]||LOCAL_ASSETS.commercial;}
function buildNationalScene(host){
 if(!host||!state.nation)return null;const width=host.clientWidth||900,height=host.clientHeight||470;const scene=new THREE.Scene();scene.background=new THREE.Color(0x17382f);const aspect=width/height;const camera=new THREE.OrthographicCamera(-14*aspect*.9,14*aspect*.9,10,-10,.1,120);camera.position.set(0,20,18);camera.lookAt(0,0,0);camera.zoom=.96;camera.updateProjectionMatrix();
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(1.45,devicePixelRatio||1));renderer.setSize(width,height,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;host.innerHTML='';host.appendChild(renderer.domElement);renderer.domElement.style.touchAction='none';scene.add(new THREE.HemisphereLight(0xd9efe8,0x234238,1.9));const sun=new THREE.DirectionalLight(0xffdfab,2.1);sun.position.set(-10,20,10);sun.castShadow=true;scene.add(sun);
 const world=new THREE.Group();scene.add(world);const land=new THREE.Mesh(new THREE.PlaneGeometry(26,19),new THREE.MeshStandardMaterial({color:0x39664f,roughness:1}));land.rotation.x=-Math.PI/2;land.receiveShadow=true;world.add(land);
 for(let z=-9;z<=9;z+=1.5)for(let x=-12.75;x<=12.75;x+=1.5){const t=new THREE.Mesh(new THREE.BoxGeometry(1.42,.05,1.42),new THREE.MeshStandardMaterial({color:((Math.round((x+z)/1.5)%2)?0x416e56:0x3d6952),roughness:1}));t.position.set(x,.02,z);world.add(t);}
 const n=state.nation;ensureCityVariants(n);ensureNationalState(n);
 const pts=NATIONAL_CITY_POSITIONS.slice(0,5).map(([x,z])=>new THREE.Vector3(x,.08,z));const roadMat=new THREE.MeshStandardMaterial({color:0x59665e,roughness:.9});for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length],mid=a.clone().lerp(b,.5),len=a.distanceTo(b),r=new THREE.Mesh(new THREE.BoxGeometry(len,.065,.22),roadMat);r.position.copy(mid);r.rotation.y=Math.atan2(b.z-a.z,b.x-a.x);world.add(r);}
 n.cities.slice(0,5).forEach((c,i)=>{const [x,z]=NATIONAL_CITY_POSITIONS[i],cg=new THREE.Group();cg.position.set(x,.10,z);cg.scale.setScalar(.30+Math.min(5,c.level||1)*.012);world.add(cg);addHayDayCityAssets(cg,c.citySeed||hashCity(`${n.name}:${c.name}`),c.level||1,{city:c,population:0,style:cityStyle(c),national:true});const ring=new THREE.Mesh(new THREE.RingGeometry(2.05,2.16,32),new THREE.MeshBasicMaterial({color:i===0?0xf1cf78:0x86d5c7,transparent:true,opacity:.36,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.set(x,.11,z);world.add(ring);const label=makeNationLabel(c.name,`Lv ${c.level} · ${money(c.budget||0)}`);label.position.set(x,1.85,z);world.add(label);});
 const root=new THREE.Group();root.name='National Builds';world.add(root);const placements=n.nationalPlacements||[];const loads=[...new Set(placements.flatMap(p=>nationalAssetPool(p.id)))];loadAssetSet(loads).then(()=>{placements.forEach((pl,idx)=>{const pool=nationalAssetPool(pl.id),src=kenneyCache.get(pool[idx%pool.length]);if(!src)return;const g=cloneKenney(src);const lv=Math.max(1,Number(pl.level||1));fitKenney(g,1.5,2.8);const base=pl.id==='stadium'?.56:pl.id==='factory'?.52:pl.id==='airport'?.50:.45;g.scale.multiplyScalar(base*(1+(lv-1)*.055));g.position.set(pl.x,.12,pl.z);g.rotation.y=Number(pl.rotation||0);g.userData.nationalAsset=pl.id;root.add(g);});}).catch(err=>console.warn('National build assets failed to load',err));
 const dr=seeded(hashCity(`${n.name}:country-landscape`));for(let i=0;i<34;i++){const x=(dr()-.5)*24,z=(dr()-.5)*16;if(NATIONAL_CITY_POSITIONS.some(([cx,cz])=>Math.hypot(cx-x,cz-z)<2.9))continue;const g=new THREE.Group();const stem=new THREE.Mesh(new THREE.CylinderGeometry(.045,.07,.42,6),new THREE.MeshStandardMaterial({color:0x5b452e}));const crown=new THREE.Mesh(new THREE.SphereGeometry(.24+.10*dr(),8,6),new THREE.MeshStandardMaterial({color:0x4e7d52,roughness:1}));stem.position.y=.25;crown.position.y=.56;g.add(stem,crown);g.position.set(x,.04,z);world.add(g);}
 let dragging=false,lastX=0,lastY=0;renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId)});renderer.domElement.addEventListener('pointerup',e=>{dragging=false;renderer.domElement.releasePointerCapture?.(e.pointerId)});renderer.domElement.addEventListener('pointercancel',()=>dragging=false);renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;world.position.x=THREE.MathUtils.clamp(world.position.x+(e.clientX-lastX)*.018/camera.zoom,-3.2,3.2);world.position.z=THREE.MathUtils.clamp(world.position.z+(e.clientY-lastY)*.018/camera.zoom,-2.8,2.8);lastX=e.clientX;lastY=e.clientY});renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();camera.zoom=THREE.MathUtils.clamp(camera.zoom*(e.deltaY<0?1.08:.93),.7,1.55);camera.updateProjectionMatrix()},{passive:false});
 const rec={renderer,scene,camera,group:world,host};citySceneRecords.push(rec);return rec;
}
function initCityScenes(){
  disposeCityScenes();
  if(!state.nation)return;
  const hosts=$$('[data-city-scene]');
  const primary=hosts;
  primary.forEach(host=>{const name=host.dataset.cityScene;const c=state.nation.cities.find(x=>x.name===name);if(c)buildCityScene(host,c)});
  const nationHost=$('#nation-city-scene');
  if(nationHost)buildNationalScene(nationHost);
  const clock=new THREE.Clock();
  const animate=()=>{
    window.__cityFrame=requestAnimationFrame(animate);
    const dt=Math.min(clock.getDelta(),.05);
    citySceneRecords.forEach(r=>{
      if(!r.group||r.host.offsetWidth<=0||r.host.offsetHeight<=0)return;
      updateCityAgents(r.group,dt);
      r.renderer.render(r.scene,r.camera);
    });
  };
  cancelAnimationFrame(window.__cityFrame);animate();
}
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
document.addEventListener('click',e=>{if(e.isTrusted){ensureAudio();if(!e.target.closest('[data-action=toggle-sound]'))sfx('click');}if(navSwipe&&e.target.closest('.sidebar nav')){navSwipe=false;e.preventDefault();e.stopPropagation();return;}const b=e.target.closest('[data-screen],[data-action],[data-skill],[data-buy],[data-moment],[data-opportunity],[data-build],[data-zone],[data-city-visit],[data-game-action],[data-upgrade-asset]');if(!b)return;if(b.dataset.screen){state.screen=b.dataset.screen;state.ui=state.ui||{};state.ui.mobileNav=false;save();renderGame();return}if(b.dataset.skill){upgradeSkill(b.dataset.skill);return}if(b.dataset.buy){buyAsset(b.dataset.buy);return}if(b.dataset.upgradeAsset){upgradeNationalAsset(b.dataset.upgradeAsset);return}if(b.dataset.moment){return}if(b.dataset.opportunity){beginOpportunity(b.dataset.opportunity);return}if(b.dataset.gameAction){miniGameAction(b.dataset.gameAction,b.dataset.gameValue);return}if(b.dataset.build){buildInCity(b.dataset.build);return}if(b.dataset.zone){zoneCity(b.dataset.zone);return}if(b.dataset.cityVisit){visitCity(Number(b.dataset.cityVisit));return}if(b.dataset.screen==='cities'&&e.target.closest('[data-city-select]'))return;const a=b.dataset.action;if(a==='toggle-sound'){toggleSound();return}if(a==='close-activity-result'){closeActivityResult();return}if(a==='toggle-sidebar'){state.ui=state.ui||{};if(window.innerWidth<=980){state.ui.mobileNav=!state.ui.mobileNav;}else{state.ui.sidebarCollapsed=!state.ui.sidebarCollapsed;}save();renderGame();return}if(a==='close-mobile-nav'){state.ui.mobileNav=false;save();renderGame();return}if(a==='end-day'){endDay();return}if(a==='create')renderCreator();else if(a==='new')newNation();else if(a==='backlanding'){state.screen='landing';showLanding();}else if(a==='cityup')upgradeCity();else if(a==='collect')collectAway();else if(a==='continue')continuePlaying();else if(a==='fund-city')fundCity(500000);else if(a==='road')addRoadToCity();else if(a==='cityup')upgradeCity();else if(a==='open-city-builder'){chooseCity(Number(b.dataset.cityIndex)||0);state.screen='citybuilder';save();renderGame();}else if(a==='advance-opportunity')advanceOpportunity();else if(a==='finish-opportunity')finishOpportunity();else if(a==='cancel-opportunity')cancelOpportunity();else if(a==='forge')createNation();else if(a==='save'){save();toast('Game saved');}});
document.addEventListener('change',e=>{const s=e.target.closest('[data-city-select]');if(s){chooseCity(Number(s.value));}});
setInterval(()=>{if(state.nation){tick();save();}},1000);
if(state.nation)showGame();else showLanding();
