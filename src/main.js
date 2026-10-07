import './style.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const KEY='forgeNationV74';
const OLD_KEYS=['forgeNationV73','forgeNationV72','forgeNationV71','forgeNationV70'];
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
function ensureCityVariants(n){if(!n?.cities)return;n.cities.forEach(c=>{if(!Number.isInteger(c.citySeed))c.citySeed=hashCity(`${n.name}:${c.name}`);});}


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
let state=load();
function load(){
  try{const keys=[KEY,...OLD_KEYS];for(const k of keys){const x=JSON.parse(localStorage.getItem(k));if(x?.nation){return migrate({...defaultState,...x,screen:'home'});}}}catch{}
  return {...defaultState};
}
function migrate(s){
  const n=s.nation;if(!n)return s;
  n.skills={industry:1,education:1,infrastructure:1,technology:1,health:1,commerce:1,culture:1,...n.skills};
  n.assets={...n.assets};n.cityLevel=n.cityLevel||3;n.reputation=n.reputation??32;n.happiness=n.happiness??68;n.xp=n.xp??384;n.money=n.money??12400000;n.population=n.population??1200000;n.cities=n.cities?.length?n.cities:[{name:n.name+' City',type:'Capital City',level:n.cityLevel,pop:n.population*.45,income:4800000,happiness:72}];
  n.history=n.history||[];n.created=n.created||Date.now();n.focus=n.focus||'industrial';ensureCityVariants(n);
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
 state.nation={name,capital:name+' City',focus,terrain,government:gov,population:pop*1e6,money:12400000,xp:384,skills:{industry:2,education:1,infrastructure:2,technology:1,health:1,commerce:1,culture:1},assets:{factory:0},cityLevel:3,reputation:32,happiness:68,awayEarned:0,history:[`Founded as a ${gov.toLowerCase()} in a ${terrain.toLowerCase()} region.`],cities:[{name:name+' City',type:'Capital City',level:3,pop:Math.round(pop*.45*1e6),income:4800000,happiness:72,citySeed:hashCity(`${name}:${name} City`)}],created:Date.now()};
 Object.entries(focusDefs[focus].skills).forEach(([k,v])=>state.nation.skills[k]=Math.max(state.nation.skills[k],v));state.screen='home';state.lastSeen=Date.now();save();showGame();toast('Nation forged. Welcome home.');
}
function newNation(){if(confirm('Start a new nation? Your current nation will be replaced.')){localStorage.removeItem(KEY);state={...defaultState,screen:'landing'};showLanding();}}
function upgradeSkill(id){const n=state.nation,c=skillCost(id),d=skillDefs.find(x=>x.id===id);if(n.money<c)return toast('You need more national wealth.');n.money-=c;n.skills[id]++;n.xp+=Math.round(c/28000)+70;n.history.unshift(`${d.name} advanced to Level ${n.skills[id]}.`);save();toast(`${d.name} upgraded`);renderGame();}
function buyAsset(id){const n=state.nation,d=storeDefs.find(x=>x.id===id);if(!d)return;if(level().level<d.req)return toast(`Reach Level ${d.req} to unlock this.`);if(n.money<d.cost)return toast('Not enough national wealth.');n.money-=d.cost;n.assets[id]=(n.assets[id]||0)+1;n.xp+=Math.round(d.cost/20000);if(id==='stadium')n.happiness=Math.min(100,n.happiness+3);if(id==='hospital')n.happiness=Math.min(100,n.happiness+4);if(id==='finance')n.reputation+=4;n.history.unshift(`${d.name} was built in ${n.name}.`);save();toast(`${d.name} built`);renderGame();}
function upgradeCity(){const n=state.nation,c=Math.round(1800000*Math.pow(1.55,n.cityLevel-1));if(n.money<c)return toast('Not enough wealth to upgrade this city.');n.money-=c;n.cityLevel++;n.cities[0].level=n.cityLevel;n.cities[0].pop*=1.10;n.cities[0].income+=420000;n.happiness=Math.min(100,n.happiness+1);n.xp+=Math.round(c/18000);n.history.unshift(`${n.cities[0].name} reached City Level ${n.cityLevel}.`);if(n.cityLevel%2===0&&n.cities.length<5){const cityNames=['Harborview','New Meridian','Northgate','Rivermouth'];const i=n.cities.length;n.cities.push({name:cityNames[i-1],type:'Regional City',level:1,pop:n.population*.08,income:650000,happiness:64,citySeed:hashCity(`${n.name}:${cityNames[i-1]}`)});}save();toast('City upgraded');renderGame();}
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
function home(){return `<main class="maincontent">${hero()}<div class="dashboardgrid"><div>${skillsCard()}</div><div>${storeCard()}</div><div>${cityCard()}</div><div>${progressCard()}</div><div>${globalCard()}${achievements()}</div></div><div class="lowergrid">${lower()}</div></main>`;}
function listPage(kicker,title,content){return `<main class="subpage"><div class="pagehead"><small>${kicker.toUpperCase()}</small><h1>${title}</h1><p>Manage this part of ${esc(state.nation.name)} with the same progression-driven simulation.</p></div>${content}</main>`;}
function fullSkills(){return listPage('National Skills','Build your capabilities.',`<div class="fullskills">${skillsCard()}</div>`);}
function fullStore(){return listPage('Development Store','Build the things that make a nation better.',`<div class="fullstore">${storeDefs.map(d=>{const n=state.nation,u=level().level>=d.req,can=n.money>=d.cost;return `<article class="bigstore"><img class="thumb" src="/${d.img}" alt=""><div><h2>${d.name}</h2><p>${d.desc}</p><small>+${money(d.inc)}/day · Requires Level ${d.req}</small></div><strong>${money(d.cost)}</strong><button class="gold" data-buy="${d.id}" ${!u||!can?'disabled':''}>${u?'Buy':'Locked'}</button></article>`}).join('')}</div>`);}
function fullCities(){return listPage('Cities','A nation that grows city by city.',`<div class="citiesfull">${state.nation.cities.map((c,i)=>`<article class="citylarge"><div class="citylarge3d city3d" data-city-scene="${esc(c.name)}"></div><div><small>${c.type.toUpperCase()}</small><h2>${esc(c.name)}</h2><p>${fmt(c.pop/1e6)}M citizens · Level ${c.level}</p><button class="gold" data-action="cityup">Upgrade City</button></div></article>`).join('')}</div>`);}
function fullProgress(){return listPage('Nation Progression','Watch your story unfold.',`<div class="fullprogress">${levels.map(x=>`<article class="pstage ${x.level<=level().level?'done':''}"><span>Lv.${x.level}</span><h2>${x.name}</h2><p>Unlock: ${x.unlock}</p><small>${x.xp.toLocaleString()} XP</small></article>`).join('')}</div>`);}
function fullMap(){return listPage('National Map','See your nation grow.',`<section class="mapscene panel"><div class="nation3d" id="nation-city-scene"></div><div class="mapbadges"><div><b>${state.nation.cities.length}</b><small>Cities</small></div><div><b>${Object.values(state.nation.assets).reduce((a,b)=>a+b,0)}</b><small>Developments</small></div><div><b>Lv. ${level().level}</b><small>Nation</small></div></div><button class="gold" data-screen="cities">Manage Cities</button></section>`);}
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
  const district=new THREE.Group();district.name='Living City Fallback District';group.add(district);
  const roadMat=new THREE.MeshStandardMaterial({color:0x3b4b52,roughness:.92});
  const lotMat=new THREE.MeshStandardMaterial({color:0x49634f,roughness:1});
  const roadW=.34, span=radius*1.55;
  for(let i=-2;i<=2;i++){const h=new THREE.Mesh(new THREE.BoxGeometry(roadW,.045,span*2),roadMat);h.position.set(i*2.45,.04,0);district.add(h);const v=new THREE.Mesh(new THREE.BoxGeometry(span*2,.045,roadW),roadMat);v.position.set(0,.045,i*2.45);district.add(v)}
  const park=new THREE.Mesh(new THREE.BoxGeometry(radius*1.05,.035,radius*.8),lotMat);park.position.set(radius*.38,.055,-radius*.42);district.add(park);
  const used=[]; const count=Math.min(34,7+lvl*3);
  for(let i=0;i<count;i++){
    let placed=false;
    for(let a=0;a<80&&!placed;a++){
      const x=(rng()-.5)*radius*1.9,z=(rng()-.5)*radius*1.9;
      if(Math.abs(x)<.55||Math.abs(z)<.55||Math.hypot(x-radius*.38,z+radius*.42)<1.0)continue;
      const w=.38+rng()*.42,d=.38+rng()*.42,h=.45+rng()*(.55+lvl*.16);
      if(used.some(q=>Math.abs(q.x-x)<(q.w+w)*.55+.12&&Math.abs(q.z-z)<(q.d+d)*.55+.12))continue;
      const g=new THREE.Group();
      const bodyMat=new THREE.MeshStandardMaterial({color:new THREE.Color().setHSL(.55+rng()*.08,.18,.38+rng()*.18),roughness:.82});
      const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),bodyMat);b.position.y=h/2;g.add(b);
      if(rng()>.35){const roof=new THREE.Mesh(new THREE.BoxGeometry(w*1.05,.06,d*1.05),new THREE.MeshStandardMaterial({color:0x28383d,roughness:.9}));roof.position.y=h+.03;g.add(roof)}
      if(h>1.15){const cap=new THREE.Mesh(new THREE.BoxGeometry(w*.58,.08,d*.58),new THREE.MeshStandardMaterial({color:0x627c82,roughness:.65,metalness:.15}));cap.position.y=h+.09;g.add(cap)}
      g.position.set(x,.06,z);g.rotation.y=Math.floor(rng()*4)*Math.PI/2;district.add(g);used.push({x,z,w,d});placed=true;
    }
  }
  const trees=new THREE.Group();trees.name='Green Corridors';district.add(trees);
  for(let i=0;i<Math.min(22,6+lvl*2);i++){const x=radius*.38+(rng()-.5)*radius*.75,z=-radius*.42+(rng()-.5)*radius*.5;const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,.28,6),new THREE.MeshStandardMaterial({color:0x5a4938}));trunk.position.set(x,.2,z);const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(.22+rng()*.12,1),new THREE.MeshStandardMaterial({color:0x3f7958,roughness:1}));crown.position.set(x,.48,z);trees.add(trunk,crown)}
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
    if(suburban.length){const rg=new THREE.Group();rg.name='Residential';district.add(rg);placeSpacedKenney(rg,suburban,rng,Math.min(14,3+lvl),{x0:-worldR,x1:worldR,z0:-worldR,z1:worldR},{min:.55,max:.86},.95)}
    if(commercial.length&&lvl>=2){const cg=new THREE.Group();cg.name='Commercial Core';district.add(cg);placeSpacedKenney(cg,commercial,rng,Math.min(7,1+Math.floor(lvl*.65)),{x0:-coreR,x1:coreR,z0:-coreR,z1:coreR},{min:.55,max:.82},1.15)}
    if(industrial.length&&lvl>=3){const ig=new THREE.Group();ig.name='Industrial District';district.add(ig);placeSpacedKenney(ig,industrial,rng,Math.min(5,1+Math.floor(lvl/2)),{x0:-worldR,x1:-worldR*.48,z0:-worldR*.72,z1:worldR*.72},{min:.52,max:.78},1.2)}
    if(nature.length){const pg=new THREE.Group();pg.name='Parks and Green Corridors';district.add(pg);const parkCount=Math.min(4,1+Math.floor(lvl/3));for(let p=0;p<parkCount;p++){const cx=(p%2?1:-1)*(worldR*.48),cz=(p<2?-1:1)*(worldR*.43);for(let i=0;i<4+lvl;i++){const t=cloneKenney(nature[Math.floor(rng()*nature.length)]);t.scale.setScalar(.28+rng()*.34);t.position.set(cx+(rng()-.5)*2.2,.04,cz+(rng()-.5)*1.7);t.rotation.y=rng()*Math.PI*2;pg.add(t)}}}
    const plaza=new THREE.Mesh(new THREE.CircleGeometry(Math.min(1.05,.45+lvl*.07),32),new THREE.MeshStandardMaterial({color:0x6b8577,roughness:1}));plaza.rotation.x=-Math.PI/2;plaza.position.y=.025;district.add(plaza);
  }).catch(()=>addFallbackCityDistrict(group,seed,lvl,opts));
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
  // Sparse civic progression that does not use the retired placeholder building/tree library.
  if(lvl>=4){const landmark=new THREE.Mesh(new THREE.BoxGeometry(.65,1.4+lvl*.18,.65),new THREE.MeshStandardMaterial({color:style.accent,metalness:.2,roughness:.45}));landmark.position.set(0,.75+lvl*.09,0);group.add(landmark);}
  if(lvl>=6){const tower=new THREE.Mesh(new THREE.CylinderGeometry(.14,.24,2.4+lvl*.25,10),new THREE.MeshStandardMaterial({color:0xcbd9de,metalness:.35,roughness:.3}));tower.position.set(1.9,1.25+lvl*.13,-1.8);group.add(tower);}
  let dragging=false,lastX=0,lastY=0;renderer.domElement.style.touchAction='none';renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId)});renderer.domElement.addEventListener('pointerup',e=>{dragging=false;renderer.domElement.releasePointerCapture?.(e.pointerId)});renderer.domElement.addEventListener('pointercancel',()=>dragging=false);renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;group.rotation.y+=(e.clientX-lastX)*.008;group.rotation.x=THREE.MathUtils.clamp(group.rotation.x+(e.clientY-lastY)*.004,-.35,.25);lastX=e.clientX;lastY=e.clientY});
  const rec={renderer,scene,camera,group,host};citySceneRecords.push(rec);return rec;
}
function initCityScenes(){disposeCityScenes();if(!state.nation)return;$$('[data-city-scene]').forEach(host=>{const name=host.dataset.cityScene;const c=state.nation.cities.find(x=>x.name===name);if(c)buildCityScene(host,c)});const nationHost=$('#nation-city-scene');if(nationHost){const aggregate={...state.nation.cities[0],name:state.nation.name+' Nation',level:level().level,citySeed:hashCity(state.nation.name+':nation')};buildCityScene(nationHost,aggregate)};const animate=()=>{if(!citySceneRecords.length)return;citySceneRecords.forEach(r=>{if(r.group&&r.host.offsetWidth>0&&r.host.offsetHeight>0){r.group.rotation.y+=.0007;r.renderer.render(r.scene,r.camera)}});window.__cityFrame=requestAnimationFrame(animate)};cancelAnimationFrame(window.__cityFrame);window.__cityFrame=requestAnimationFrame(animate)}
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
document.addEventListener('click',e=>{if(navSwipe&&e.target.closest('.sidebar nav')){navSwipe=false;e.preventDefault();e.stopPropagation();return;}const b=e.target.closest('[data-screen],[data-action],[data-skill],[data-buy]');if(!b)return;if(b.dataset.screen){state.screen=b.dataset.screen;save();renderGame();return}if(b.dataset.skill){upgradeSkill(b.dataset.skill);return}if(b.dataset.buy){buyAsset(b.dataset.buy);return}const a=b.dataset.action;if(a==='create')renderCreator();else if(a==='new')newNation();else if(a==='backlanding'){state.screen='landing';showLanding();}else if(a==='cityup')upgradeCity();else if(a==='collect')collectAway();else if(a==='continue')continuePlaying();else if(a==='forge')createNation();else if(a==='save'){save();toast('Game saved');}});
setInterval(()=>{if(state.nation){tick();save();}},1000);
if(state.nation)showGame();else showLanding();
