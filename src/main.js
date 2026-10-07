import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const KEY='forgeNationV80';
const OLD_KEYS=['forgeNationV74','forgeNationV73','forgeNationV72','forgeNationV71','forgeNationV70'];
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
const defaultState={screen:'landing',nation:null,lastSeen:Date.now(),toast:'',awayEarned:0};
const cozyMoments=[
 {id:'market',title:'Sunday Market',desc:'Set up a little market square. Citizens browse, chat and spend.',cost:180000,reward:260000,happy:3,xp:90,icon:'🧺'},
 {id:'park',title:'Plant a Pocket Park',desc:'Give a neighborhood somewhere quiet to sit under the trees.',cost:120000,reward:0,happy:4,xp:80,icon:'🌳'},
 {id:'cafe',title:'Open a Corner Café',desc:'A tiny café becomes a favorite meeting place.',cost:150000,reward:210000,happy:2,xp:75,icon:'☕'},
 {id:'playground',title:'Build a Playground',desc:'Add swings and a little play space for local families.',cost:90000,reward:0,happy:3,xp:65,icon:'🛝'},
 {id:'library',title:'Open a Neighborhood Library',desc:'Books, study tables and a warm place to spend an afternoon.',cost:220000,reward:0,happy:4,xp:110,icon:'📚'},
 {id:'festival',title:'Lantern Evening',desc:'A small evening festival fills the streets with music and lights.',cost:250000,reward:330000,happy:6,xp:130,icon:'🏮'},
 {id:'clean',title:'Clean-Up Day',desc:'Citizens volunteer to tidy streets and public spaces.',cost:45000,reward:0,happy:2,xp:55,icon:'🧹'},
 {id:'street',title:'Pretty Up a Street',desc:'Fresh paving, planters and lights turn an ordinary street into a favorite walk.',cost:140000,reward:0,happy:3,xp:70,icon:'🌷'}
];
function dayKey(){return new Date().toISOString().slice(0,10)}
function cozyFor(n){
 n.cozy=n.cozy||{day:'',tasks:[],done:[],streak:0,collection:[],selectedCity:0};
 if(n.cozy.day!==dayKey()){
   n.cozy.day=dayKey();n.cozy.done=[];
   const seed=hashCity(`${n.name}:${n.cozy.day}`);let a=[];
   for(let i=0;i<3;i++)a.push(cozyMoments[(seed+i*3)%cozyMoments.length].id);
   n.cozy.tasks=[...new Set(a)]; if(n.cozy.tasks.length<3)n.cozy.tasks.push(cozyMoments[(seed+7)%cozyMoments.length].id);
 }
 return n.cozy;
}
function selectedCity(){const n=state.nation;cozyFor(n);return n.cities[clamp(Number(n.cozy.selectedCity)||0,0,Math.max(0,n.cities.length-1))]||n.cities[0]}
function chooseCity(i){const n=state.nation;cozyFor(n);n.cozy.selectedCity=clamp(Number(i)||0,0,n.cities.length-1);save();renderGame()}
function doMoment(id){
 const n=state.nation,c=selectedCity(),cfg=cozyMoments.find(x=>x.id===id);if(!cfg)return;
 cozyFor(n);if(!n.cozy.tasks.includes(id))return toast('That moment is not on today\'s list.');if(n.cozy.done.includes(id))return toast('Already done today.');
 if(n.money<cfg.cost)return toast(`You need ${money(cfg.cost)} for this.`);
 n.money-=cfg.cost;n.money+=cfg.reward;n.happiness=clamp(n.happiness+cfg.happy,0,100);c.happiness=clamp((c.happiness||65)+cfg.happy,0,100);n.xp+=cfg.xp;
 c.cozy=c.cozy||{projects:[],mood:0};c.cozy.projects.push({id,at:Date.now()});c.cozy.mood=(c.cozy.mood||0)+cfg.happy;
 n.cozy.done.push(id);if(n.cozy.done.length===n.cozy.tasks.length)n.cozy.streak=(n.cozy.streak||0)+1;
 n.history.unshift(`${cfg.title} brought a little life to ${c.name}.`);save();toast(`${cfg.icon} ${cfg.title} complete!`);renderGame();
}
function visitCity(i){chooseCity(i);state.screen='cities';save();renderGame();setTimeout(()=>document.querySelector(`[data-city-scene="${CSS.escape(state.nation.cities[i]?.name||'')}"]`)?.scrollIntoView({behavior:'smooth',block:'center'}),80)}

let state=load();
function load(){
  try{const keys=[KEY,...OLD_KEYS];for(const k of keys){const x=JSON.parse(localStorage.getItem(k));if(x?.nation){return migrate({...defaultState,...x,screen:'home'});}}}catch{}
  return {...defaultState};
}
function migrate(s){
  const n=s.nation;if(!n)return s;
  n.skills={industry:1,education:1,infrastructure:1,technology:1,health:1,commerce:1,culture:1,...n.skills};
  n.assets={...n.assets};n.cityLevel=n.cityLevel||3;n.reputation=n.reputation??32;n.happiness=n.happiness??68;n.xp=n.xp??384;n.money=n.money??12400000;n.population=n.population??1200000;n.cities=n.cities?.length?n.cities:[{name:n.name+' City',type:'Capital City',level:n.cityLevel,pop:n.population*.45,income:4800000,happiness:72}];
  n.history=n.history||[];n.created=n.created||Date.now();n.focus=n.focus||'industrial';n.cities.forEach(c=>{c.cozy=c.cozy||{projects:[],mood:0}});cozyFor(n);ensureCityVariants(n);
  return s;
}
function save(){state.lastSeen=Date.now();localStorage.setItem(KEY,JSON.stringify(state));}
function skillCost(id){const lv=state.nation.skills[id]||1,d=skillDefs.find(x=>x.id===id);return Math.round(d.base*Math.pow(1.48,lv-1));}
function level(){let out=levels[0];for(const x of levels)if(state.nation.xp>=x.xp)out=x;return out;}
function nextLevel(){return levels[level().level]||null;}
function xpPct(){const l=level(),n=nextLevel();return n?clamp((state.nation.xp-l.xp)/(n.xp-l.xp)*100,0,100):100;}
function income(){const n=state.nation;let total=2430000;for(const d of skillDefs)total*=1+(Math.max(0,n.skills[d.id]-1)*d.gain*.18);for(const id in n.assets){const d=storeDefs.find(x=>x.id===id);if(d)total+=n.assets[id]*d.inc}return total*(focusDefs[n.focus]?.income||1)*(1+n.cityLevel*.055);}
function tick(){if(!state.nation)return;const now=Date.now(),elapsed=Math.max(0,Math.min(259200,(now-state.lastSeen)/1000));if(elapsed<=0)return;const earned=income()*elapsed/86400;state.nation.money+=earned;state.nation.awayEarned=(state.nation.awayEarned||0)+earned;state.nation.population+=state.nation.population*.0000000012*elapsed;state.nation.xp+=elapsed/3600*2.4;state.lastSeen=now;}
function createNation(){
 const name=($('#nationName')?.value||'Novara').trim()||'Novara';const focus=$('#focus')?.value||'industrial';const terrain=$('#terrain')?.value||'Coastal';const gov=$('#gov')?.value||'Republic';const pop=Number($('#pop')?.value||1.2);
 state.nation={name,capital:name+' City',focus,terrain,government:gov,population:pop*1e6,money:12400000,xp:384,skills:{industry:2,education:1,infrastructure:2,technology:1,health:1,commerce:1,culture:1},assets:{factory:0},cityLevel:3,reputation:32,happiness:68,awayEarned:0,history:[`Founded as a ${gov.toLowerCase()} in a ${terrain.toLowerCase()} region.`],cities:[
  {name:name+' City',type:'Capital City',level:3,pop:Math.round(pop*.45*1e6),income:4800000,happiness:72,citySeed:hashCity(`${name}:${name} City`)},
  {name:'Riverbend',type:'Regional City',level:1,pop:Math.round(pop*.12*1e6),income:720000,happiness:66,citySeed:hashCity(`${name}:Riverbend`)},
  {name:'Northfield',type:'Agricultural Town',level:1,pop:Math.round(pop*.08*1e6),income:510000,happiness:69,citySeed:hashCity(`${name}:Northfield`)}
],created:Date.now(),cozy:{day:'',tasks:[],done:[],streak:0,collection:[],selectedCity:0}};
 Object.entries(focusDefs[focus].skills).forEach(([k,v])=>state.nation.skills[k]=Math.max(state.nation.skills[k],v));state.screen='home';state.lastSeen=Date.now();save();showGame();toast('Nation forged. Welcome home.');
}
function newNation(){if(confirm('Start a new nation? Your current nation will be replaced.')){localStorage.removeItem(KEY);state={...defaultState,screen:'landing'};showLanding();}}
function upgradeSkill(id){const n=state.nation,c=skillCost(id),d=skillDefs.find(x=>x.id===id);if(n.money<c)return toast('You need more national wealth.');n.money-=c;n.skills[id]++;n.xp+=Math.round(c/28000)+70;n.history.unshift(`${d.name} advanced to Level ${n.skills[id]}.`);save();toast(`${d.name} upgraded`);renderGame();}
function buyAsset(id){const n=state.nation,d=storeDefs.find(x=>x.id===id);if(!d)return;if(level().level<d.req)return toast(`Reach Level ${d.req} to unlock this.`);if(n.money<d.cost)return toast('Not enough national wealth.');n.money-=d.cost;n.assets[id]=(n.assets[id]||0)+1;n.xp+=Math.round(d.cost/20000);if(id==='stadium')n.happiness=Math.min(100,n.happiness+3);if(id==='hospital')n.happiness=Math.min(100,n.happiness+4);if(id==='finance')n.reputation+=4;n.history.unshift(`${d.name} was built in ${n.name}.`);save();toast(`${d.name} built`);renderGame();}
function upgradeCity(){const n=state.nation,c=selectedCity(),cost=Math.round(1800000*Math.pow(1.48,Math.max(0,(c.level||1)-1)));if(n.money<cost)return toast('Not enough wealth to upgrade this city.');n.money-=cost;c.level=(c.level||1)+1;c.pop=Math.round(c.pop*1.10);c.income=(c.income||0)+420000;c.happiness=Math.min(100,(c.happiness||65)+1);n.cityLevel=Math.max(n.cityLevel||1,c.level);n.happiness=Math.min(100,n.happiness+1);n.xp+=Math.round(cost/18000);n.history.unshift(`${c.name} reached City Level ${c.level}.`);ensureCityVariants(n);save();toast(`${c.name} grew into a larger city`);renderGame();}
function collectAway(){tick();const e=state.nation.awayEarned||0;state.nation.awayEarned=0;save();toast(e>0?`Collected ${money(e)} while you were away`:'No pending rewards');renderGame();}
function continuePlaying(){tick();const e=state.nation.awayEarned||0;state.nation.awayEarned=0;state.screen='home';save();renderGame();const el=document.querySelector('.dashboardgrid');el?.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>toast(e>0?`Welcome back — ${money(e)} collected.`:'Welcome back to your nation.'),120);}
function toast(msg){state.toast=msg;renderGame();clearTimeout(window.__toast);window.__toast=setTimeout(()=>{state.toast='';renderGame()},2200)}
function credits(){return `<div class="credits">Made by Sajid<br><span>Instagram: <a href="https://www.instagram.com/sajidaddin" target="_blank" rel="noopener noreferrer">@sajidaddin</a> · <a href="https://www.instagram.com/sajidphobic" target="_blank" rel="noopener noreferrer">@sajidphobic</a></span></div>`;}
function icon(s,cls=''){return `<span class="uiicon ${cls}">${s}</span>`;}
function topbar(){const n=state.nation;const month=Math.max(1,Math.floor((Date.now()-n.created)/2592000000)%12+1),year=Math.max(1,Math.floor((Date.now()-n.created)/(2592000000*12))+1);return `<header class="topbar"><div class="mobilebrand">FORGE A NATION</div><div class="topstats"><div class="topstat">${icon('◉','goldic')}<span><b>${money(n.money)}</b><small>+${money(income())}/day</small></span></div><div class="topstat">${icon('♟','blueic')}<span><b>${fmt(n.population/1e6)}M</b><small>+8.6K/day</small></span></div><div class="topstat">${icon('★','goldic')}<span><b>${Math.round(n.reputation)}</b><small>Reputation</small></span></div><div class="datebox"><b>Year ${year}, Month ${month}</b><small>☀ Sunny 24°C</small></div></div></header>`;}
function sidebar(){const items=[['home','⌂','Home'],['map','●','Map'],['cities','▥','Cities'],['buildings','▣','Buildings'],['skills','◈','Skills'],['development','◆','Development'],['store','▤','Store'],['statistics','▥','Statistics'],['history','▤','History'],['settings','⚙','Settings']];return `<aside class="sidebar"><div class="brand"><h1>FORGE<br>A NATION</h1><p>Build. Grow. Lead.</p></div><nav>${items.map(([id,ic,label])=>`<button class="navitem ${state.screen===id?'active':''}" data-screen="${id}">${icon(ic)}<span>${label}</span></button>`).join('')}</nav><div class="quick"><small>Quick Actions</small><button class="gold" data-action="continue">Continue Game</button><button class="outline" data-action="new">＋ New Nation</button></div>${credits()}</aside>`;}
function hero(){const n=state.nation,l=level();return `<section class="hero"><div class="hero-scene" id="hero-scene" aria-label="Artistic 3D national panorama"></div><div class="heroShade"></div><div class="heroContent"><div class="welcome"><small>Welcome Back,</small><h1>${esc(n.name)}</h1><p>A small nation with big dreams.</p></div><div class="nationcard"><div class="emblem">✦</div><div class="nationcardbody"><b>${esc(n.name)}</b><span>${l.name}</span><small>Lv. ${l.level}</small><div class="bar"><i style="width:${xpPct()}%"></i></div><em>${Math.floor(n.xp).toLocaleString()} / ${(nextLevel()?.xp||n.xp).toLocaleString()}</em></div></div><button class="gold continue" data-action="continue">▶ &nbsp; Continue Playing</button></div><div class="metrics">${metric('◉','National Wealth',money(n.money),'+'+money(income())+'/day')} ${metric('♟','Population',fmt(n.population/1e6)+'M','+8.6K/day')} ${metric('☺','Happiness',Math.round(n.happiness)+'%','+1.3%')} ${metric('★','Reputation',Math.round(n.reputation),'+2.4%')}</div><aside class="away"><h3>While You Were Away...</h3><div>${icon('◉','goldic')}<b>+${money(n.awayEarned||0)}</b><span>National Income</span></div><div>${icon('♟','greenic')}<b>+12.8K</b><span>Population</span></div><div>${icon('▥','blueic')}<b>+1.2K</b><span>Industrial Output</span></div><div>${icon('◆','goldic')}<b>Education advanced</b><span>to Lv. ${n.skills.education}</span></div><button class="gold" data-action="collect">Collect Rewards</button></aside></section>`;}
function metric(ic,title,value,delta){return `<div class="metric">${icon(ic)}<div><small>${title}</small><strong>${value}</strong><em>${delta}</em></div></div>`;}
function skillsCard(){const n=state.nation;return `<section class="panel skills-panel"><div class="paneltitle"><h2>National Skills</h2><button class="textbtn" data-screen="skills">View All</button></div>${skillDefs.map(d=>`<div class="skillrow"><div class="skillicon ${d.cls}">${d.icon}</div><div><b>${d.name}</b><small>Lv. ${n.skills[d.id]} · ${d.effect}</small></div><button class="mini greenbtn" data-skill="${d.id}">Upgrade<span>${money(skillCost(d.id))}</span></button></div>`).join('')}</section>`;}
function storeCard(){const n=state.nation;return `<section class="panel store-panel"><div class="paneltitle"><h2>Development Store</h2><button class="textbtn" data-screen="store">View All</button></div><div class="tabs"><button class="active">All</button><button>Economic</button><button>Civic</button><button>Culture</button><button>Luxury</button></div><div class="storelist">${storeDefs.slice(0,6).map(d=>{const ok=level().level>=d.req,can=n.money>=d.cost;return `<div class="storeitem"><img src="/${d.img}" alt=""><div><b>${d.name}</b><small>${d.desc}</small></div><strong>${money(d.cost)}</strong><button class="mini ${ok&&can?'greenbtn':'lockbtn'}" data-buy="${d.id}" ${ok&&can?'':'disabled'}>${ok?'Buy':'🔒'}</button></div>`}).join('')}</div></section>`;}
function cityCard(){const n=state.nation,c=n.cities[0],cityCost=Math.round(1800000*Math.pow(1.55,n.cityLevel-1));return `<section class="panel city-panel"><div class="paneltitle"><h2>City Overview</h2><button class="textbtn" data-screen="cities">View All</button></div><div class="cityimage city3d" data-city-scene="${esc(c.name)}"><span>Lv. ${c.level}</span></div><div class="cityhead"><div><b>${esc(c.name)}</b><small>◉ Capital City</small></div></div><div class="citystats"><div>${icon('♟')}<small>Population</small><b>${fmt(c.pop/1e6)}M</b><em>+3.2K/day</em></div><div>${icon('◉')}<small>Income</small><b>${money(c.income)}</b><em>+12%</em></div><div>${icon('♥')}<small>Happiness</small><b>${Math.round(c.happiness)}%</b><em>+4%</em></div></div><h3>City Buildings</h3>${['Residential Zone','Industrial Zone','Commercial Zone','Infrastructure'].map((x,i)=>`<div class="buildingrow"><div class="buildingbadge">${['⌂','▥','▣','◆'][i]}</div><div><b>${x}</b><small>Lv. ${Math.min(3,c.level)} · +${(i+1)*2}%</small></div><button class="mini greenbtn" data-action="cityup">Upgrade<span>${money(1600000+i*400000)}</span></button></div>`).join('')}<button class="cityupgrade gold" data-action="cityup">Upgrade City · ${money(cityCost)}</button></section>`;}
function progressCard(){const n=state.nation,l=level(),next=nextLevel();return `<section class="panel progress-panel"><div class="paneltitle"><h2>Development Progress</h2></div><div class="stage"><small>Current Stage</small><b>${l.name}</b><span>Lv. ${l.level}</span><div class="bar"><i style="width:${xpPct()}%"></i></div><em>${Math.floor(n.xp).toLocaleString()} / ${(next?.xp||n.xp).toLocaleString()}</em></div><div class="next"><small>Next Promotion</small><h3>${next?next.name:'World-Class Nation'}</h3>${next?`<p>Requirements:</p><div>✓ Reach ${next.xp.toLocaleString()} development XP</div><div>✓ Grow your national wealth</div><div>✓ Upgrade key capabilities</div><hr><p>Rewards:</p><div>+18% National Income</div><div>New buildings unlocked</div><button class="gold" data-screen="statistics">View Progression</button>`:`<p>Your nation has reached the highest stage.</p>`}</div></section>`;}
function globalCard(){return `<section class="panel global-panel"><div class="paneltitle"><h2>Global Standing</h2><button class="textbtn">View All</button></div><div class="diplomacy">${icon('◎')}<span><b>Diplomacy</b><small>Allies</small></span><b>›</b></div>${[['US','United States','Friendly +20'],['◇','Eurasia','Neutral +12'],['★','Al-Sham','Neutral +8'],['◉','Veridian','Tense -14']].map((x,i)=>`<div class="relation"><b>${x[0]}</b><span>${x[1]}</span><small class="${i===3?'bad':''}">${x[2]}</small></div>`).join('')}</section>`;}
function achievements(){const arr=[['⌂','Factory Built','Build your first factory','+10'],['◆','University','Build a university','+10'],['◉','First Export Deal','Trade internationally','+20'],['♟','Population Milestone','Reach 1 million population','+30'],['◎','Good Relations','Form an alliance','+15']];return `<section class="panel achievements"><div class="paneltitle"><h2>Achievements</h2><button class="textbtn">View All</button></div><div class="tabs"><button class="active">All</button><button>Trade</button><button>Relations</button></div>${arr.map((x,i)=>`<div><span class="achievementicon">${x[0]}</span><section><b>${x[1]}</b><small>${x[2]}</small></section><em>${i<1&&state.nation.assets.factory?x[3]:'+'+x[3].replace('+','')}</em></div>`).join('')}</section>`;}
function lower(){const n=state.nation,l=level();return `<section class="panel national-progress"><div class="paneltitle"><h2>National Progression</h2></div><div class="nodes">${levels.map(x=>`<div class="node ${x.level<=l.level?'done':''} ${x.level===l.level?'current':''}"><span>${x.level<=l.level?'◆':'◇'}</span><b>${x.name.replace(' Nation','')}</b><small>Lv. ${x.level}</small></div>`).join('')}</div></section><section class="panel activity"><div class="paneltitle"><h2>Recent Activity</h2></div>${n.history.slice(0,4).map((x,i)=>`<div>${icon(['◉','◆','⌂','♟'][i])}<span>${esc(x)}</span><small>${i+1}h ago</small></div>`).join('')}</section><section class="panel buildtomorrow"><img src="/hero-art.jpg" alt="Clean city illustration"><div><h2>Build a greater tomorrow</h2><p>Your decisions shape the future of ${esc(n.name)}.</p><button class="gold" data-screen="map">View Map</button></div></section>`;}
function cozyCard(){const n=state.nation,c=selectedCity(),z=cozyFor(n);const tasks=z.tasks.map(id=>cozyMoments.find(x=>x.id===id)).filter(Boolean);return `<section class="panel cozy-panel"><div class="paneltitle"><div><h2>Little Things Today</h2><small>Make your nation feel lived in.</small></div><span class="streak">✦ ${z.streak||0} day streak</span></div><div class="citypick"><span>In</span><select data-city-select>${n.cities.map((x,i)=>`<option value="${i}" ${i===(z.selectedCity||0)?'selected':''}>${esc(x.name)}</option>`).join('')}</select><b>${c.happiness||65}% happy</b></div><div class="momentlist">${tasks.map(x=>{const done=z.done.includes(x.id),can=n.money>=x.cost;return `<article class="moment ${done?'done':''}"><div class="momenticon">${x.icon}</div><div><b>${x.title}</b><small>${x.desc}</small><em>${x.reward?`Earn ${money(x.reward)} · `:''}+${x.happy}% happiness</em></div><button class="mini ${done?'lockbtn':'greenbtn'}" data-moment="${x.id}" ${done||!can?'disabled':''}>${done?'Done':can?'Do it':'Need '+money(x.cost)}</button></article>`}).join('')}</div><p class="cozynote">Small choices become permanent little details in your city.</p></section>`;}
function home(){return `<main class="maincontent">${hero()}${cozyCard()}<div class="dashboardgrid"><div>${skillsCard()}</div><div>${storeCard()}</div><div>${cityCard()}</div><div>${progressCard()}</div><div>${globalCard()}${achievements()}</div></div><div class="lowergrid">${lower()}</div></main>`;}
function listPage(kicker,title,content){return `<main class="subpage"><div class="pagehead"><small>${kicker.toUpperCase()}</small><h1>${title}</h1><p>Manage this part of ${esc(state.nation.name)} with the same progression-driven simulation.</p></div>${content}</main>`;}
function fullSkills(){return listPage('National Skills','Build your capabilities.',`<div class="fullskills">${skillsCard()}</div>`);}
function fullStore(){return listPage('Development Store','Build the things that make a nation better.',`<div class="fullstore">${storeDefs.map(d=>{const n=state.nation,u=level().level>=d.req,can=n.money>=d.cost;return `<article class="bigstore"><img class="thumb" src="/${d.img}" alt=""><div><h2>${d.name}</h2><p>${d.desc}</p><small>+${money(d.inc)}/day · Requires Level ${d.req}</small></div><strong>${money(d.cost)}</strong><button class="gold" data-buy="${d.id}" ${!u||!can?'disabled':''}>${u?'Buy':'Locked'}</button></article>`}).join('')}</div>`);}
function fullCities(){const n=state.nation;cozyFor(n);return listPage('Cities','Visit, grow and give each place its own personality.',`<div class="citiesfull">${n.cities.map((c,i)=>`<article class="citylarge ${i===(n.cozy.selectedCity||0)?'selectedcity':''}"><div class="citylarge3d city3d" data-city-scene="${esc(c.name)}"></div><div><div class="citytag">${esc(c.type)}</div><h2>${esc(c.name)}</h2><p>${fmt(c.pop/1e6)}M citizens · Level ${c.level} · ${Math.round(c.happiness||65)}% happiness</p><div class="citychips"><span>🏠 ${Math.max(4,c.level*3)} neighborhoods</span><span>🌳 ${Math.max(1,Math.floor(c.level/2)+1)} parks</span><span>✨ ${(c.cozy?.projects||[]).length} local projects</span></div><button class="gold" data-city-visit="${i}">Visit City</button> <button class="outline" data-action="cityup">Grow City</button></div></article>`).join('')}</div>`);}
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

// Kenney-first city rendering. The old procedural building/tree library is intentionally removed.
// Runtime source mirror: HidenCod's Kenney model library, which republishes Kenney CC0 GLBs.
// Original source/licence: https://kenney.nl/assets
const KENNEY_CATALOG='https://hidencod.github.io/tge-assets/catalog.json';
const KENNEY_PAGES='https://hidencod.github.io/tge-assets/';
const kenneyLoader=new GLTFLoader();
const kenneyCache=new Map();
let kenneyCatalogPromise=null;

function getKenneyCatalog(){
  if(kenneyCatalogPromise)return kenneyCatalogPromise;
  kenneyCatalogPromise=fetch(KENNEY_CATALOG).then(r=>r.ok?r.json():Promise.reject(new Error('Kenney catalog unavailable'))).catch(()=>({models:[]}));
  return kenneyCatalogPromise;
}
function kenneyEntries(pack,filter){
  return getKenneyCatalog().then(cat=>{
    const all=Array.isArray(cat)?cat:(cat.models||cat.assets||[]);
    return all.filter(x=>{
      const p=String(x.pack||x.category||x.collection||'');
      const f=String(x.file||x.path||x.url||'');
      return (p===pack || p.toLowerCase()===pack.toLowerCase() || f.toLowerCase().includes(pack.toLowerCase().replaceAll(' ','-'))) && (!filter || filter(f,x));
    });
  });
}
function kenneyUrl(entry){
  const f=entry.file||entry.path||entry.url;
  if(!f)return null;
  if(/^https?:\/\//.test(f))return f;
  return KENNEY_PAGES+String(f).replace(/^\/+/, '').split('/').map(encodeURIComponent).join('/');
}
function loadKenney(url){
  if(!url)return Promise.reject(new Error('Missing Kenney URL'));
  if(kenneyCache.has(url))return kenneyCache.get(url);
  const promise=new Promise((resolve,reject)=>kenneyLoader.load(url,g=>resolve(g.scene),undefined,reject));
  kenneyCache.set(url,promise); return promise;
}
function cloneKenney(src){const x=src.clone(true);x.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return x;}
function seeded(seed){let x=(seed>>>0)||1;return()=>{x=(Math.imul(1664525,x)+1013904223)>>>0;return x/4294967296};}
function placeSpacedKenney(group,models,rng,count,zone,scaleRange={min:.7,max:1.05},minGap=.8){
  const placed=[];
  for(let n=0;n<count;n++){
    let accepted=null;
    for(let attempt=0;attempt<90 && !accepted;attempt++){
      const src=models[Math.floor(rng()*models.length)];
      const x=zone.x0+rng()*(zone.x1-zone.x0),z=zone.z0+rng()*(zone.z1-zone.z0);
      const b=cloneKenney(src);const scale=scaleRange.min+rng()*(scaleRange.max-scaleRange.min);b.scale.setScalar(scale);b.rotation.y=Math.floor(rng()*4)*Math.PI/2;
      const box=new THREE.Box3().setFromObject(b),size=new THREE.Vector3();box.getSize(size);const footprint=Math.max(.25,Math.hypot(size.x,size.z)/2);
      let clear=true;for(const p of placed){if(Math.hypot(p.x-x,p.z-z)<p.r+footprint+minGap){clear=false;break;}}
      if(clear){b.position.set(x,.045,z);group.add(b);placed.push({x,z,r:footprint});accepted=true;}
    }
  }
  return placed;
}
function addFallbackCityDistrict(group,seed,level,opts={}){
  const rng=seeded(seed),lvl=Math.max(1,Math.min(10,level)),radius=opts.radius||6.4;
  const city=new THREE.Group();city.name='Living City';group.add(city);
  const mat=(color,rough=.85,metal=0)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});
  const roadMat=mat(0x34434a,.96),sideMat=mat(0x8b9694,.9),grassMat=mat(0x52705a,1),roofMat=mat(0x9b5548,.88),wallPalette=[0xe6d2b5,0xd9e0d2,0xc8d8df,0xe3c6a7,0xd8c5df,0xcbd8c1];
  const addBox=(w,h,d,color,x,y,z,parent=city,rough=.82)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,rough));o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o};
  const addRoad=(x,z,w,d)=>{addBox(w,.045,d,0x34434a,x,.035,z,city,.96);addBox(w+.05,.025,d+.05,0x737d7d,x,.058,z,city,.98)};
  const span=radius*1.82, street=.62;
  // Planned road grid with a wider boulevard and secondary streets.
  addRoad(0,0,span,street*1.15); addRoad(0,0,street*1.15,span);
  [-3.7,3.7].forEach(v=>{addRoad(v,0,.42,span);addRoad(0,v,span,.42)});
  if(lvl>=4){addRoad(0,-5.45,span,.72);addRoad(-5.45,0,.72,span)}
  // Lane markings and crossings make the road network read clearly.
  const markMat=mat(0xe8d9a1,.7);
  for(const v of [-3.7,0,3.7]){
    for(let i=-4;i<=4;i++){
      if(Math.abs(i)<1) continue;
      addBox(.045,.008,.42,0xe7dba8,v,.064,i*1.15,city,.75);
      addBox(.42,.008,.045,0xe7dba8,i*1.15,.064,v,city,.75);
    }
  }
  // Blocks: generous lots around streets, with parks/open land rather than a wall of buildings.
  const blocks=[[-1.8,-1.8],[-1.8,1.8],[1.8,-1.8],[1.8,1.8],[-4.9,-4.8],[-4.9,4.8],[4.9,-4.8],[4.9,4.8]];
  const used=[];
  function free(x,z,w,d,pad=.12){return !used.some(q=>Math.abs(q.x-x)<(q.w+w)/2+pad&&Math.abs(q.z-z)<(q.d+d)/2+pad)}
  function house(x,z,scale=1,variant=0){
    const w=(.72+rng()*.28)*scale,d=(.68+rng()*.25)*scale,h=(.48+rng()*.18)*scale;
    if(!free(x,z,w,d,.16))return false; used.push({x,z,w,d});
    const g=new THREE.Group();g.position.set(x,.06,z);g.rotation.y=Math.floor(rng()*4)*Math.PI/2;
    const wall=mat(wallPalette[variant%wallPalette.length],.9);const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),wall);body.position.y=h/2;body.castShadow=true;g.add(body);
    const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*.76,Math.max(.26,.30*scale),4),mat([0x9d5649,0x6d5c50,0x7c4e63,0x4f6f69][variant%4],.88));roof.rotation.y=Math.PI/4;roof.position.y=h+.14;roof.scale.set(1,.72,Math.max(.8,w/d));roof.castShadow=true;g.add(roof);
    // porch + door + windows = the small cute houses the earlier city had.
    const porch=addBox(w*.34,.06,.24,0xbba98d,0,.04,d*.62,g,.9);porch.position.z=d*.62;
    const door=addBox(w*.18,h*.46,.035,0x594b43,0,h*.29,d/2+.018,g,.75);
    for(const sx of [-1,1]) addBox(w*.16,h*.20,.035,0xaecbd0,sx*w*.25,h*.58,d/2+.02,g,.5);
    city.add(g);return true;
  }
  // Residential neighbourhoods: many small homes, but deliberately spaced.
  const houseCount=Math.min(30,10+lvl*2);
  for(let i=0;i<houseCount;i++){
    const side=i%4, base=side<2?(side?1:-1):0;
    let x,z;
    if(side<2){x=base*(1.9+rng()*3.0);z=(rng()-.5)*8.7}else{z=base*(1.9+rng()*3.0);x=(rng()-.5)*8.7}
    if(Math.abs(x)<.9||Math.abs(z)<.9)continue;
    house(x,z,.78+rng()*.30,i);
  }
  // Apartments and mid-rise buildings around the centre.
  const midCount=Math.min(9,2+Math.floor(lvl*.8));
  for(let i=0;i<midCount;i++){
    const x=(rng()-.5)*4.9,z=(rng()-.5)*4.9,w=.7+rng()*.55,d=.65+rng()*.5,h=.9+rng()*(.55+lvl*.12);
    if(Math.abs(x)<.75||Math.abs(z)<.75)continue;
    if(!free(x,z,w,d,.18))continue;used.push({x,z,w,d});
    addBox(w,h,d,[0xb9c9cb,0xd5c3a9,0x9eafb9,0xcab6a7][i%4],x,.06+h/2,z,city,.72);
    for(let fy=.28;fy<h-.08;fy+=.28)for(let sx=-1;sx<=1;sx++)if(rng()>.25)addBox(.11,.09,.025,0xe5d7a6,x+sx*w*.25,fy,z+d/2+.015,city,.45);
    addBox(w*.85,.08,d*.85,[0x596a70,0x806252,0x59636a][i%3],x,h+.10,z,city,.9);
  }
  // Downtown shops / civic buildings.
  const shops=[[-.95,-.95],[.95,-.95],[-.95,.95],[.95,.95]];
  shops.slice(0,Math.min(4,2+Math.floor(lvl/2))).forEach((q,i)=>{
    const [x,z]=q,w=.78,d=.62,h=.55+.08*(i%2);addBox(w,h,d,[0xd8a15e,0x83aeb1,0xc47d73,0x9c9f6c][i],x,.06+h/2,z,city,.68);
    addBox(w*.82,.13,.035,0xf1d38a,x,h*.72,z+d/2+.02,city,.45);
    for(let k=-1;k<=1;k++)addBox(.12,.12,.03,0x8fb8bd,x+k*.22,h*.40,z+d/2+.022,city,.4);
  });
  // Central civic plaza / fountain.
  const plaza=addBox(1.75,.035,1.35,0x87999a,0,.055,0,city,.95);plaza.rotation.y=.12;
  const fountain=new THREE.Mesh(new THREE.CylinderGeometry(.30,.38,.12,20),mat(0xb8c8ca,.55,.15));fountain.position.set(0,.12,0);city.add(fountain);
  const water=new THREE.Mesh(new THREE.CylinderGeometry(.23,.23,.025,20),mat(0x76b6c7,.28,.05));water.position.set(0,.20,0);city.add(water);
  // Parks / green pockets.
  const parkSpots=[[3.9,-3.9],[-3.9,3.9],[4.0,3.7],[-4.0,-3.7]];
  const parkCount=Math.min(4,1+Math.floor(lvl/2));
  parkSpots.slice(0,parkCount).forEach(([x,z],pi)=>{
    addBox(2.0,.025,1.55,0x58775d,x,.055,z,city,1);
    for(let i=0;i<7+lvl;i++){
      const tx=x+(rng()-.5)*1.7,tz=z+(rng()-.5)*1.25;
      const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,.28,6),mat(0x67513e,1));trunk.position.set(tx,.21,tz);trunk.castShadow=true;city.add(trunk);
      const crown=new THREE.Mesh(new THREE.SphereGeometry(.18+rng()*.10,7,6),mat([0x477052,0x5c8060,0x3e684e][i%3],1));crown.position.set(tx,.46,tz);crown.castShadow=true;city.add(crown);
    }
    // benches.
    for(let b=0;b<2;b++)addBox(.38,.06,.10,0x765f49,x-.55+b*1.1,.16,z+.45,city,.95);
  });
  // Street furniture: lamps, signs, traffic islands and parked cars.
  const lampMat=mat(0x263237,.55,.55),glowMat=mat(0xffe8a8,.25,.1);
  for(const [x,z] of [[-3.7,-1.0],[-3.7,1.0],[3.7,-1.0],[3.7,1.0],[-1,-3.7],[1,-3.7],[-1,3.7],[1,3.7]]){
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,.62,7),lampMat);pole.position.set(x,.34,z);city.add(pole);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.07,7,5),glowMat);bulb.position.set(x,.68,z);city.add(bulb);
  }
  for(let i=0;i<Math.min(8,3+lvl);i++){
    const x=(rng()-.5)*7.6,z=(rng()-.5)*7.6;
    if(Math.abs(x%3.7)<.6||Math.abs(z%3.7)<.6)continue;
    const car=addBox(.22,.08,.42,[0xc85f56,0x5f83a4,0xd7b35b,0x8a9b8f][i%4],x,.09,z,city,.62);car.rotation.y=rng()*Math.PI;
    addBox(.15,.055,.18,0x8faeb5,x,.16,z,city,.5);
  }
  // Higher levels gain a hospital, school, stadium/industrial edge and skyline landmarks.
  if(lvl>=3){
    addBox(1.05,.55,.72,0xd7d9d2,-4.7,.33,-1.5,city,.7);addBox(.16,.30,.06,0xc95050,-4.7,.65,-1.88,city,.5); // hospital
    addBox(1.15,.38,.85,0xc8b889,4.65,.23,1.4,city,.8); // school
  }
  if(lvl>=5){
    const stadium=new THREE.Mesh(new THREE.TorusGeometry(.72,.20,8,24),mat(0x748b9a,.72));stadium.rotation.x=Math.PI/2;stadium.position.set(4.35,.22,-4.15);city.add(stadium);addBox(1.0,.16,.72,0x718a62,4.35,.13,-4.15,city,1);
  }
  if(lvl>=6){
    addBox(1.05,1.7,.72,0x7e9da5,0,.86,-3.75,city,.5);for(let y=.35;y<1.55;y+=.28)addBox(.14,.09,.03,0xd8d7b0,-.25,y,-3.38,city,.4);addBox(.22,2.15,.22,0xcbd9dc,2.35,1.08,-2.55,city,.35);
  }
  // Industrial edge / warehouse district.
  if(lvl>=4){for(let i=0;i<3+Math.floor(lvl/2);i++){const x=-4.6+rng()*.9,z=-1.8+rng()*4.0;addBox(.85,.45,.72,0x78817e,x,.285,z,city,.9);addBox(.68,.12,.08,0xa7a79b,x,.57,z+.37,city,.7)}}
  // Trees along boulevards and outskirts.
  for(let i=0;i<16+lvl*2;i++){
    const x=(rng()-.5)*10,z=(rng()-.5)*10;
    if(Math.abs(x)<1.0||Math.abs(z)<1.0)continue;
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,.25,6),mat(0x654d3a,1));trunk.position.set(x,.18,z);city.add(trunk);
    const crown=new THREE.Mesh(new THREE.SphereGeometry(.16+rng()*.10,7,6),mat([0x477052,0x64865d,0x3e684e][i%3],1));crown.position.set(x,.42,z);crown.castShadow=true;city.add(crown);
  }
  // Level-dependent skyline glow: more development, but still plenty of breathing room.
  if(lvl>=7){for(let i=0;i<4;i++){const x=-2.5+i*1.65,z=-2.3-rng()*1.4;const h=1.6+rng()*1.2;addBox(.42,h,.42,[0x657f88,0x8c7771,0x6e8890,0x7f7d71][i],x,h/2+.06,z,city,.5);}}
}

function addKenneyCityAssets(group,seed,level,opts={}){
  const rng=seeded(seed),lvl=Math.max(1,Math.min(10,level)),radius=opts.radius||6.4;
  const city=new THREE.Group();city.name='Kenney City Districts';group.add(city);
  getKenneyCatalog().then(cat=>{
    const all=Array.isArray(cat)?cat:(cat.models||cat.assets||[]);
    const byPack=(pack,fn)=>all.filter(x=>{const p=String(x.pack||x.category||'');const f=String(x.file||x.path||'');return p.toLowerCase()===pack.toLowerCase()&&(!fn||fn(f,x));}).map(kenneyUrl).filter(Boolean);
    const suburban=byPack('City Kit (Suburban)',f=>/building-type-[a-z]\.glb$/i.test(f)).slice(0,18);
    const commercial=byPack('City Kit (Commercial)',f=>/building-(?:skyscraper-)?[a-z]\.glb$/i.test(f)).slice(0,12);
    const industrial=byPack('City Kit (Industrial)',f=>/building-[a-z]\.glb$/i.test(f)).slice(0,10);
    const roads=byPack('City Kit (Roads)',f=>/(road-straight|road-crossroad|road-intersection|road-bend|road-end|road-square|tile-low)\.glb$/i.test(f)).slice(0,8);
    const nature=byPack('Nature Kit',f=>/(tree_|tree-|rock_|rock-|plant_|grass|flower_|bush|stone_)/i.test(f)).slice(0,24);
    return Promise.all([Promise.all(suburban.map(loadKenney)),Promise.all(commercial.map(loadKenney)),Promise.all(industrial.map(loadKenney)),Promise.all(roads.map(loadKenney)),Promise.all(nature.map(loadKenney))]);
  }).then(([suburban,commercial,industrial,roads,nature])=>{
    if(!suburban.length&&!commercial.length&&!industrial.length&&!roads.length&&!nature.length){addFallbackCityDistrict(group,seed,lvl,opts);return;}
    const district=new THREE.Group();district.name='Kenney Districts';city.add(district);
    const coreR=Math.min(2.7+lvl*.32,5.0),worldR=radius;
    if(roads.length){const rg=new THREE.Group();rg.name='Kenney Roads';district.add(rg);const road=roads[0];const span=worldR*1.55;for(let i=-2;i<=2;i++){const a=cloneKenney(road);a.position.set(i*2.7,.018,-span);a.scale.setScalar(.92);rg.add(a);const b=cloneKenney(road);b.position.set(i*2.7,.019,span);b.rotation.y=Math.PI;b.scale.setScalar(.92);rg.add(b)}for(let i=-1;i<=1;i++){const a=cloneKenney(road);a.position.set(-span,.019,i*2.7);a.rotation.y=Math.PI/2;a.scale.setScalar(.92);rg.add(a);const b=cloneKenney(road);b.position.set(span,.019,i*2.7);b.rotation.y=-Math.PI/2;b.scale.setScalar(.92);rg.add(b)}}
    if(suburban.length){const rg=new THREE.Group();rg.name='Residential';district.add(rg);placeSpacedKenney(rg,suburban,rng,Math.min(24,7+lvl*2),{x0:-worldR,x1:worldR,z0:-worldR,z1:worldR},{min:.55,max:.86},.95)}
    if(commercial.length&&lvl>=2){const cg=new THREE.Group();cg.name='Commercial Core';district.add(cg);placeSpacedKenney(cg,commercial,rng,Math.min(12,2+Math.floor(lvl*.9)),{x0:-coreR,x1:coreR,z0:-coreR,z1:coreR},{min:.55,max:.82},1.15)}
    if(industrial.length&&lvl>=3){const ig=new THREE.Group();ig.name='Industrial District';district.add(ig);placeSpacedKenney(ig,industrial,rng,Math.min(8,2+Math.floor(lvl*.7)),{x0:-worldR,x1:-worldR*.48,z0:-worldR*.72,z1:worldR*.72},{min:.52,max:.78},1.2)}
    if(nature.length){const pg=new THREE.Group();pg.name='Parks and Green Corridors';district.add(pg);const parkCount=Math.min(4,1+Math.floor(lvl/3));for(let p=0;p<parkCount;p++){const cx=(p%2?1:-1)*(worldR*.48),cz=(p<2?-1:1)*(worldR*.43);for(let i=0;i<7+lvl*2;i++){const t=cloneKenney(nature[Math.floor(rng()*nature.length)]);t.scale.setScalar(.28+rng()*.34);t.position.set(cx+(rng()-.5)*2.2,.04,cz+(rng()-.5)*1.7);t.rotation.y=rng()*Math.PI*2;pg.add(t)}}}
    const plaza=new THREE.Mesh(new THREE.CircleGeometry(Math.min(1.05,.45+lvl*.07),32),new THREE.MeshStandardMaterial({color:0x6b8577,roughness:1}));plaza.rotation.x=-Math.PI/2;plaza.position.y=.025;district.add(plaza);
  }).catch(()=>addFallbackCityDistrict(group,seed,lvl,opts));
}

function addCozyProjectVisuals(group,c){
  const projects=c.cozy?.projects||[]; if(!projects.length)return;
  const mat=(color,rough=.8)=>new THREE.MeshStandardMaterial({color,roughness:rough});
  projects.slice(-8).forEach((p,i)=>{
    const id=p.id, x=-4.4+(i%4)*2.8, z=3.4+Math.floor(i/4)*1.5;
    const g=new THREE.Group();g.position.set(x,.06,z);group.add(g);
    if(id==='park'||id==='playground'||id==='clean'||id==='street'){
      const base=new THREE.Mesh(new THREE.BoxGeometry(1.35,.035,1.0),mat(id==='park'?0x5d855d:0x8b8b68,1));base.position.y=.02;g.add(base);
      for(let t=0;t<3;t++){const tr=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,.28,6),mat(0x684e39,1));tr.position.set(-.42+t*.42,.18,.18);g.add(tr);const crown=new THREE.Mesh(new THREE.SphereGeometry(.18,7,6),mat([0x4f7b55,0x648d5e,0x47714f][t],1));crown.position.set(tr.position.x,.40,.18);g.add(crown);}
      if(id==='playground'){const post=mat(0xd7a24c,1);for(const px of [-.35,.35]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.28,6),post);pole.position.set(px,.18,-.2);g.add(pole)}const bar=new THREE.Mesh(new THREE.BoxGeometry(.8,.035,.035),post);bar.position.set(0,.31,-.2);g.add(bar)}
    } else if(id==='market'||id==='cafe'||id==='library'){
      const body=new THREE.Mesh(new THREE.BoxGeometry(1.0,.55,.72),mat(id==='cafe'?0xc58b63:id==='library'?0x9b7f67:0xc4aa68,.72));body.position.y=.30;g.add(body);
      const roof=new THREE.Mesh(new THREE.ConeGeometry(.72,.22,4),mat(id==='market'?0x9b5b52:0x596e73,.8));roof.position.y=.72;roof.rotation.y=Math.PI/4;g.add(roof);
      if(id==='cafe'){const awning=new THREE.Mesh(new THREE.BoxGeometry(.72,.08,.18),mat(0xe1c477,.5));awning.position.set(0,.46,.42);g.add(awning)}
      if(id==='library'){for(let j=-1;j<=1;j++){const w=new THREE.Mesh(new THREE.BoxGeometry(.12,.14,.025),mat(0xe2d6a7,.5));w.position.set(j*.2,.34,.37);g.add(w)}}
    } else if(id==='festival'){
      const pole=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.75,5),mat(0x6d5944,1));pole.position.y=.38;g.add(pole);
      for(let k=0;k<5;k++){const bulb=new THREE.Mesh(new THREE.SphereGeometry(.045,6,5),new THREE.MeshBasicMaterial({color:k%2?0xe6c96d:0x9bd7d3}));bulb.position.set(-.65+k*.32,.70,.05);g.add(bulb)}
    }
  });
}
function addAmbientCitizens(group,c){
  const rng=seeded(hashCity(`${c.name}:citizens`)),people=new THREE.Group();people.name='Citizens';group.add(people);
  for(let i=0;i<9;i++){
    const p=new THREE.Group();p.userData.phase=rng()*Math.PI*2;p.userData.radius=2.0+rng()*4;p.userData.speed=.00022+rng()*.00018;p.userData.lane=i%2?'a':'b';
    const body=new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,.16,6),new THREE.MeshStandardMaterial({color:[0xd07a67,0x6f92aa,0xd0b35e,0x7c9b72][i%4],roughness:.9}));body.position.y=.16;p.add(body);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.055,7,6),new THREE.MeshStandardMaterial({color:0xd3a27e,roughness:1}));head.position.y=.29;p.add(head);
    people.add(p);
  }
  people.userData.citizens=true;
}
function buildCityScene(host,c,opts={}){
  if(!host||!c)return null;
  const width=host.clientWidth||640,height=host.clientHeight||320;
  const scene=new THREE.Scene(),style=cityStyle(c);scene.background=new THREE.Color(style.ground);
  const camera=new THREE.PerspectiveCamera(32,width/height,.1,100);camera.position.set(9.5,7.8,11.5);camera.lookAt(0,1.2,0);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));renderer.setSize(width,height,false);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xb8dce4,0x10252c,1.75));const sun=new THREE.DirectionalLight(0xffe2ad,2.1);sun.position.set(5,10,4);sun.castShadow=true;scene.add(sun);
  const group=new THREE.Group();scene.add(group);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(22,18),new THREE.MeshStandardMaterial({color:style.ground,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;group.add(ground);
  const lvl=Math.max(1,Math.min(10,c.level||1)),seed=c.citySeed||citySeed(c);
  addKenneyCityAssets(group,seed,lvl,{radius:6.4});
  addCozyProjectVisuals(group,c);
  addAmbientCitizens(group,c);
  // Sparse civic progression that does not use the retired placeholder building/tree library.
  if(lvl>=4){const landmark=new THREE.Mesh(new THREE.BoxGeometry(.65,1.4+lvl*.18,.65),new THREE.MeshStandardMaterial({color:style.accent,metalness:.2,roughness:.45}));landmark.position.set(0,.75+lvl*.09,0);group.add(landmark);}
  if(lvl>=6){const tower=new THREE.Mesh(new THREE.CylinderGeometry(.14,.24,2.4+lvl*.25,10),new THREE.MeshStandardMaterial({color:0xcbd9de,metalness:.35,roughness:.3}));tower.position.set(1.9,1.25+lvl*.13,-1.8);group.add(tower);}
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
  cities.forEach((c,i)=>{
    const angle=i*2.399963; // golden-angle distribution, deterministic and spread out
    const rad=i===0?0:3.0+Math.sqrt(i)*2.05;
    let x=Math.cos(angle)*rad, z=Math.sin(angle)*rad*.70;
    x=Math.max(-12,Math.min(12,x)); z=Math.max(-9,Math.min(9,z));
    if(i===0){x=-1.5;z=-1.5;}
    positions.push([x,z]);
    const cityGroup=new THREE.Group(); cityGroup.position.set(x,.06,z);
    const cLvl=Math.max(1,Math.min(10,c.level||1));
    // footprint: roads + the same small houses/civic vocabulary as V7.13, scaled down.
    addFallbackCityDistrict(cityGroup,c.citySeed||citySeed(c),cLvl,{radius:3.1});
    cityGroup.scale.setScalar(.42+Math.min(cLvl,8)*.018);
    world.add(cityGroup);
    // city glow/marker
    const ring=new THREE.Mesh(new THREE.RingGeometry(.55,.64,24),new THREE.MeshBasicMaterial({color:i===0?0xe5c36a:0x7bc7cc,transparent:true,opacity:.72,side:THREE.DoubleSide}));
    ring.rotation.x=-Math.PI/2; ring.position.set(x,.16,z); world.add(ring);
    const beacon=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.65,8),new THREE.MeshBasicMaterial({color:i===0?0xe5c36a:0x7bc7cc}));
    beacon.position.set(x,.38,z); world.add(beacon);
  });
  // Small villages/settlements fill the countryside between the major cities.
  for(let i=0;i<Math.max(8,cities.length*2);i++){
    const x=(rng()-.5)*25,z=(rng()-.5)*17;
    if(Math.abs(x-5)<1.5)continue;
    const settlement=new THREE.Group();settlement.position.set(x,.04,z);
    for(let h=0;h<3+(i%3);h++){
      const b=new THREE.Mesh(new THREE.BoxGeometry(.16,.10,.15),new THREE.MeshStandardMaterial({color:[0xd8c6a7,0xc9d4ca,0xd5b18c][h%3],roughness:.9}));
      b.position.set((rng()-.5)*.65,.08,(rng()-.5)*.5);settlement.add(b);
      const roof=new THREE.Mesh(new THREE.ConeGeometry(.12,.07,4),new THREE.MeshStandardMaterial({color:0x81584d,roughness:.9}));roof.position.set(b.position.x,.17,b.position.z);roof.rotation.y=Math.PI/4;settlement.add(roof);
    }
    world.add(settlement);
  }
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
function initCityScenes(){disposeCityScenes();if(!state.nation)return;$$('[data-city-scene]').forEach(host=>{const name=host.dataset.cityScene;const c=state.nation.cities.find(x=>x.name===name);if(c)buildCityScene(host,c)});const nationHost=$('#nation-city-scene');if(nationHost){buildNationalScene(nationHost);}const animate=()=>{if(!citySceneRecords.length)return;citySceneRecords.forEach(r=>{if(r.group&&r.host.offsetWidth>0&&r.host.offsetHeight>0){r.group.rotation.y+=.0007;const people=r.group.getObjectByName('Citizens');if(people){people.children.forEach((p,j)=>{const t=performance.now()*p.userData.speed+p.userData.phase;p.position.set(Math.cos(t)*p.userData.radius*.72,.03,Math.sin(t)*p.userData.radius*.52);p.rotation.y=-t+Math.PI/2;});}r.renderer.render(r.scene,r.camera)}});window.__cityFrame=requestAnimationFrame(animate)};cancelAnimationFrame(window.__cityFrame);window.__cityFrame=requestAnimationFrame(animate)}
function renderGame(){tick();disposeHeroScene();const root=$('#app');let body=home();if(state.screen==='skills')body=fullSkills();else if(['store','development','buildings'].includes(state.screen))body=fullStore();else if(state.screen==='cities')body=fullCities();else if(['statistics','progress'].includes(state.screen))body=fullProgress();else if(state.screen==='map')body=fullMap();else if(state.screen==='history')body=fullHistory();else if(state.screen==='settings')body=fullSettings();else if(state.screen==='diplomacy')body=placeholder('Global Standing','Diplomacy and relations.');root.innerHTML=`<div class="game"><div class="sidebarwrap">${sidebar()}</div><div class="gamearea">${topbar()}${body}</div></div>${state.toast?`<div class="toast">${esc(state.toast)}</div>`:''}`;requestAnimationFrame(()=>{initHeroScene();initCityScenes()});}

let landingRenderer,landingScene,landingCamera,landingGlobe,landingFrame;
function disposeLanding(){if(landingFrame)cancelAnimationFrame(landingFrame);landingFrame=null;if(landingRenderer)landingRenderer.dispose();landingRenderer=null;landingScene=null;landingCamera=null;landingGlobe=null;}
function initLanding(){const host=$('#landing-globe');if(!host)return;disposeLanding();const w=host.clientWidth||500,h=host.clientHeight||500;landingScene=new THREE.Scene();landingCamera=new THREE.PerspectiveCamera(38,w/h,.1,100);landingCamera.position.z=6.4;landingRenderer=new THREE.WebGLRenderer({antialias:true,alpha:true});landingRenderer.setPixelRatio(Math.min(1.6,devicePixelRatio||1));landingRenderer.setSize(w,h,false);landingRenderer.setClearColor(0,0);host.appendChild(landingRenderer.domElement);landingGlobe=new THREE.Group();landingGlobe.rotation.z=-.16;landingScene.add(landingGlobe);const pts=[];const golden=(1+Math.sqrt(5))/2;for(let i=0;i<1700;i++){const y=1-i/1699*2,r=Math.sqrt(Math.max(0,1-y*y)),a=i*golden*Math.PI*2;pts.push(Math.cos(a)*r*2.3,y*2.3,Math.sin(a)*r*2.3)}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));landingGlobe.add(new THREE.Points(g,new THREE.PointsMaterial({color:0x80d9df,size:.026,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending})));const mat=new THREE.LineBasicMaterial({color:0x65cbd2,transparent:true,opacity:.12});for(let lat=-75;lat<=75;lat+=15){const ring=[],p=THREE.MathUtils.degToRad(lat),rr=Math.cos(p)*2.31,yy=Math.sin(p)*2.31;for(let j=0;j<=96;j++){const a=j/96*Math.PI*2;ring.push(new THREE.Vector3(Math.cos(a)*rr,yy,Math.sin(a)*rr))}landingGlobe.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ring),mat));}let drag=false,lastX=0,lastY=0;host.onpointerdown=e=>{drag=true;lastX=e.clientX;lastY=e.clientY};host.onpointerup=()=>drag=false;host.onpointerleave=()=>drag=false;host.onpointermove=e=>{if(drag){landingGlobe.rotation.y+=(e.clientX-lastX)*.004;landingGlobe.rotation.x+=(e.clientY-lastY)*.003;lastX=e.clientX;lastY=e.clientY}};const anim=()=>{landingFrame=requestAnimationFrame(anim);if(!drag)landingGlobe.rotation.y+=.0015;landingRenderer.render(landingScene,landingCamera)};anim();window.addEventListener('resize',()=>{if(!landingRenderer)return;const ww=host.clientWidth,hh=host.clientHeight;landingCamera.aspect=ww/hh;landingCamera.updateProjectionMatrix();landingRenderer.setSize(ww,hh,false);},{once:false});}
function showLanding(){disposeLanding();$('#app').innerHTML=`<main class="landing"><div class="landing-copy"><small>SIMULATE · BUILD · WATCH IT LIVE</small><h1>FORGE<br><span>A NATION</span></h1><p>Build a country. Then watch your decisions become cities, roads, factories, farms and history.</p><button class="landingbtn" data-action="create">CREATE YOUR NATION <b>→</b></button><div class="landingnote">LOCAL-FIRST · SINGLE PLAYER · NO ACCOUNT</div>${credits()}</div><div class="landing-globe" id="landing-globe"></div></main>`;initLanding();}
function showGame(){if(!state.nation){showLanding();return}renderGame();}
function renderCreator(){disposeLanding();$('#app').innerHTML=`<main class="creator"><div class="creatorcard"><button class="backbtn" data-action="backlanding">← Back</button><div class="creatorhead"><small>FORGE A NATION</small><h1>Create Your Nation</h1><p>Choose an identity, a focus, and a starting population.</p></div><div class="creatorgrid"><label>Nation Name<input id="nationName" value="Novara" maxlength="24"></label><label>Government<select id="gov"><option>Republic</option><option>Kingdom</option><option>Federation</option><option>Commonwealth</option></select></label><label>Capital Geography<select id="terrain"><option>Coastal</option><option>River Valley</option><option>Highlands</option><option>Plains</option></select></label><label>Starting Population<select id="pop"><option value="1.2" selected>1.2 million</option><option value="2.1">2.1 million</option><option value="3.8">3.8 million</option><option value="5.2">5.2 million</option></select></label></div><label>National Focus<select id="focus">${Object.entries(focusDefs).map(([k,v])=>`<option value="${k}">${v.name} — ${v.desc}</option>`).join('')}</select></label><div class="presetrow"><button data-preset="coastal">Coastal Republic</button><button data-preset="industrial">Industrial Power</button><button data-preset="tech">Tech Nation</button><button data-preset="cultural">Cultural State</button></div><button class="landingbtn createbtn" data-action="forge">CREATE NATION <b>→</b></button>${credits()}</div></main>`;$$('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>{const p=btn.dataset.preset;$('#terrain').value=p==='coastal'?'Coastal':p==='tech'?'River Valley':p==='cultural'?'Coastal':'Plains';$('#focus').value=p==='coastal'?'commercial':p==='tech'?'technological':p==='cultural'?'cultural':'industrial';}));}

let navSwipe=false,navStartX=0,navStartY=0;
document.addEventListener('touchstart',e=>{const nav=e.target.closest('.sidebar nav');if(!nav)return;const t=e.touches[0];navSwipe=false;navStartX=t.clientX;navStartY=t.clientY;},{passive:true});
document.addEventListener('touchmove',e=>{const nav=e.target.closest('.sidebar nav');if(!nav)return;const t=e.touches[0];if(Math.abs(t.clientX-navStartX)>10&&Math.abs(t.clientX-navStartX)>Math.abs(t.clientY-navStartY))navSwipe=true;},{passive:true});
document.addEventListener('click',e=>{if(navSwipe&&e.target.closest('.sidebar nav')){navSwipe=false;e.preventDefault();e.stopPropagation();return;}const b=e.target.closest('[data-screen],[data-action],[data-skill],[data-buy],[data-moment],[data-city-visit]');if(!b)return;if(b.dataset.screen){state.screen=b.dataset.screen;save();renderGame();return}if(b.dataset.skill){upgradeSkill(b.dataset.skill);return}if(b.dataset.buy){buyAsset(b.dataset.buy);return}if(b.dataset.moment){doMoment(b.dataset.moment);return}if(b.dataset.cityVisit){visitCity(Number(b.dataset.cityVisit));return}if(b.dataset.screen==='cities'&&e.target.closest('[data-city-select]'))return;const a=b.dataset.action;if(a==='create')renderCreator();else if(a==='new')newNation();else if(a==='backlanding'){state.screen='landing';showLanding();}else if(a==='cityup')upgradeCity();else if(a==='collect')collectAway();else if(a==='continue')continuePlaying();else if(a==='forge')createNation();else if(a==='save'){save();toast('Game saved');}});
document.addEventListener('change',e=>{const s=e.target.closest('[data-city-select]');if(s){chooseCity(Number(s.value));}});
setInterval(()=>{if(state.nation){tick();save();}},1000);
if(state.nation)showGame();else showLanding();
